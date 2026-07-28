<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EscutaRespostaDenuncianteMail;
use App\Models\Empresa;
use App\Models\EscutaMensagem;
use App\Models\RelatoEscuta;
use App\Services\EscutaNotificacaoService;
use App\Services\EscutaRoteamentoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;

/**
 * Canal de Escuta — Relato Anonimo Publico (sem login).
 *
 * Garantias de anonimato (ver PLANO-RELATO-ANONIMO-PUBLICO.md):
 * - Nenhum dado de identificacao e coletado ou gravado no relato.
 * - IP nao e persistido: rate-limit usa contadores transitorios (middleware throttle).
 * - O protocolo e a unica credencial de acompanhamento (alta entropia).
 */
class EscutaPublicoController extends Controller
{
    /** Idade minima do form token (anti-bot): segundos entre GET e POST. */
    private const FORM_TOKEN_MIN_SEGUNDOS = 10;
    /** Validade maxima do form token. */
    private const FORM_TOKEN_MAX_SEGUNDOS = 7200;

    // ── Pagina da empresa ────────────────────────────────────────────────
    public function show(string $slug): JsonResponse
    {
        $empresa = $this->empresaPeloSlug($slug);

        return response()->json([
            'empresa'    => [
                'nome'     => $empresa->nome_fantasia,
                'logo_url' => filter_var($empresa->logo_path, FILTER_VALIDATE_URL) ? $empresa->logo_path : null,
            ],
            'sla_dias'   => RelatoEscuta::SLA_DIAS,
            'setores'    => $empresa->setores()->orderBy('nome')->get(['id', 'nome']),
            'form_token' => Crypt::encryptString(now()->timestamp . '|' . $slug),
        ]);
    }

    // ── Envio do relato ──────────────────────────────────────────────────
    public function store(
        Request $request,
        string $slug,
        EscutaRoteamentoService $roteamento,
        EscutaNotificacaoService $notificacao
    ): JsonResponse {
        $empresa = $this->empresaPeloSlug($slug);

        // Honeypot: campo oculto preenchido => descarte silencioso (resposta identica ao sucesso)
        if ($request->filled('website')) {
            return response()->json(['protocolo' => RelatoEscuta::gerarProtocolo()], 201);
        }

        $this->validarFormToken($request->input('form_token'), $slug);

        $validated = $request->validate([
            'categoria'      => 'required|string|max:100',
            'tag'            => 'nullable|string|max:50',
            'texto'          => 'required|string|min:10|max:5000',
            'tipo_envolvido' => 'required|in:colaborador_setor,lideranca,rh,diretoria,presidencia,nao_sabe,nao_informar',
            // Setor do denunciante — OPCIONAL (ele decide se indica)
            'setor_id'       => [
                'nullable', 'integer',
                Rule::exists('setores', 'id')->where('empresa_id', $empresa->id),
            ],
            // E-mail OPCIONAL, apenas para aviso de nova resposta
            'email_notificacao' => 'nullable|email|max:190',
        ]);

        $destino = $roteamento->calcular($validated['tipo_envolvido']);

        $relato = RelatoEscuta::create([
            'empresa_id'        => $empresa->id,
            'colaborador_id'    => null, // publico e SEMPRE anonimo, por construcao
            'setor_id'          => $validated['setor_id'] ?? null,
            'modo'              => 'anonimo',
            'origem'            => 'publico',
            'protocolo'         => RelatoEscuta::gerarProtocolo(),
            'categoria'         => $validated['categoria'],
            'tag'               => $validated['tag'] ?? null,
            'texto'             => $validated['texto'],
            'email_notificacao' => $validated['email_notificacao'] ?? null,
            'tipo_envolvido'    => $validated['tipo_envolvido'],
            'grupo_destino'     => $destino['grupo_destino'],
            'nivel_sigilo'      => $destino['nivel_sigilo'],
            'status'            => 'pendente',
            'prioridade'        => $notificacao->prioridade($validated['categoria'], $validated['texto']),
        ]);

        $notificacao->novoRelato($relato);

        return response()->json([
            'protocolo' => $relato->protocolo,
            'sla_dias'  => RelatoEscuta::SLA_DIAS,
            'message'   => 'Relato registrado com seguranca. Guarde o protocolo: ele e a unica forma de acompanhar a resposta.',
        ], 201);
    }

    // ── Acompanhamento pelo protocolo ────────────────────────────────────
    public function acompanhar(Request $request): JsonResponse
    {
        $relato = $this->relatoPeloProtocolo($request);

        // Mensagens da equipe sao marcadas como lidas ao serem consultadas
        $relato->mensagens()->where('autor', 'equipe')->whereNull('lida_em')->update(['lida_em' => now()]);

        return response()->json([
            'protocolo' => $relato->protocolo,
            'status'    => $relato->status,
            'criado_em' => $relato->created_at,
            'sla_dias'  => RelatoEscuta::SLA_DIAS,
            'pode_responder' => !in_array($relato->status, ['arquivado'], true),
            'mensagens' => $relato->mensagens->map(fn ($m) => [
                'autor' => $m->autor === 'equipe' ? 'Comitê' : 'Você',
                'de_equipe' => $m->autor === 'equipe',
                'texto' => $m->texto,
                'data'  => $m->created_at,
            ])->values(),
        ]);
    }

    public function responder(Request $request): JsonResponse
    {
        $relato = $this->relatoPeloProtocolo($request);

        abort_if($relato->status === 'arquivado', 422, 'Este relato foi encerrado e nao aceita novas mensagens.');

        $validated = $request->validate([
            'texto' => 'required|string|min:2|max:3000',
        ]);

        EscutaMensagem::create([
            'relato_id' => $relato->id,
            'autor'     => 'denunciante',
            'texto'     => $validated['texto'],
        ]);

        return response()->json(['message' => 'Mensagem enviada ao comitê.'], 201);
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    private function empresaPeloSlug(string $slug): Empresa
    {
        $empresa = Empresa::where('escuta_slug', $slug)
            ->where('escuta_publica_ativa', true)
            ->where('status', 'ativo')
            ->first();

        // Erro generico: nao diferencia "nao existe" de "inativo"
        abort_if(!$empresa || !$empresa->temProdutoAtivo('canal_escuta'), 404, 'Canal nao encontrado.');

        return $empresa;
    }

    private function relatoPeloProtocolo(Request $request): RelatoEscuta
    {
        $validated = $request->validate([
            'protocolo' => 'required|string|max:20',
        ]);

        $relato = RelatoEscuta::where('protocolo', strtoupper(trim($validated['protocolo'])))->first();

        // Resposta generica (anti-enumeracao)
        abort_if(!$relato, 404, 'Protocolo nao encontrado.');

        return $relato;
    }

    private function validarFormToken(?string $token, string $slug): void
    {
        try {
            [$timestamp, $slugToken] = explode('|', Crypt::decryptString((string) $token), 2);
        } catch (\Throwable) {
            abort(422, 'Sessao do formulario invalida. Recarregue a pagina.');
        }

        $idade = now()->timestamp - (int) $timestamp;

        abort_if($slugToken !== $slug, 422, 'Sessao do formulario invalida. Recarregue a pagina.');
        abort_if($idade < self::FORM_TOKEN_MIN_SEGUNDOS, 422, 'Envio rapido demais. Aguarde alguns segundos.');
        abort_if($idade > self::FORM_TOKEN_MAX_SEGUNDOS, 422, 'Sessao do formulario expirou. Recarregue a pagina.');
    }
}
