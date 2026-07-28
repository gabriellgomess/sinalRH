<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\EscutaRespostaDenuncianteMail;
use App\Models\Empresa;
use App\Models\EscutaAcesso;
use App\Models\EscutaMensagem;
use App\Models\EscutaNota;
use App\Models\RelatoEscuta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EscutaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $grupo = $user->grupo_escuta;

        // Sem grupo de tratamento => nao ve nenhum relato de escuta.
        if (!$grupo) {
            return response()->json(['data' => [], 'total' => 0, 'sem_grupo' => true]);
        }

        $relatos = RelatoEscuta::query()
            ->where('empresa_id', $user->empresa_id)
            ->where('grupo_destino', $grupo)              // só o que é destinado ao seu grupo
            ->where(function ($q) use ($user) {            // nunca ve relato em que ele e o denunciado
                $q->whereNull('usuario_denunciado_id')
                  ->orWhere('usuario_denunciado_id', '!=', $user->id);
            })
            ->when($request->status,     fn ($q) => $q->where('status', $request->status))
            ->when($request->prioridade, fn ($q) => $q->where('prioridade', $request->prioridade))
            ->when($request->setor_id,   fn ($q) => $q->where('setor_id', $request->setor_id))
            ->with('setor:id,nome')
            ->withCount(['mensagens as mensagens_nao_lidas' => fn ($q) => $q->where('autor', 'denunciante')->whereNull('lida_em')])
            ->latest()
            ->paginate(20);

        return response()->json($relatos);
    }

    public function show(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarTratamento($request, $relato);
        $this->logAcesso($request, $relato, 'visualizou');

        $relato->load(['setor:id,nome', 'notas.autor:id,nome', 'mensagens.user:id,nome']);

        // Mensagens do denunciante ficam marcadas como lidas ao abrir o relato
        $relato->mensagens()->where('autor', 'denunciante')->whereNull('lida_em')->update(['lida_em' => now()]);
        if ($relato->modo === 'identificado') {
            $relato->load('colaborador:id,nome,email');
        }

        return response()->json([
            'id'            => $relato->id,
            'protocolo'     => $relato->protocolo,
            'origem'        => $relato->origem,
            'modo'          => $relato->modo,
            'categoria'     => $relato->categoria,
            'tag'           => $relato->tag,
            'texto'         => $relato->texto,
            'status'        => $relato->status,
            'prioridade'    => $relato->prioridade,
            'tipo_envolvido'=> $relato->tipo_envolvido,
            'cargo_nivel_denunciado' => $relato->cargo_nivel_denunciado,
            'grupo_destino' => $relato->grupo_destino,
            'nivel_sigilo'  => $relato->nivel_sigilo,
            'setor'         => $relato->setor,
            'colaborador'   => $relato->modo === 'identificado' ? $relato->colaborador : null,
            'atendido_por'  => $relato->atendido_por,
            'atendido_em'   => $relato->atendido_em,
            'notas'         => $relato->notas->map(fn ($n) => [
                'id'    => $n->id,
                'nota'  => $n->nota,
                'autor' => $n->autor?->nome,
                'data'  => $n->created_at,
            ]),
            'mensagens'     => $relato->mensagens->map(fn ($m) => [
                'id'    => $m->id,
                'autor' => $m->autor === 'equipe' ? ($m->user?->nome ?? 'Equipe') : 'Denunciante',
                'de_equipe' => $m->autor === 'equipe',
                'texto' => $m->texto,
                'data'  => $m->created_at,
            ]),
            'tem_email_notificacao' => (bool) $relato->getRawOriginal('email_notificacao'),  // so o booleano; o e-mail nunca sai na resposta
            'created_at'    => $relato->created_at,
        ]);
    }

    public function assumir(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarTratamento($request, $relato);

        $relato->forceFill([
            'atendido_por' => $request->user()->id,
            'atendido_em'  => now(),
            'status'       => $relato->status === 'pendente' ? 'em_analise' : $relato->status,
        ])->save();

        $this->logAcesso($request, $relato, 'assumiu');

        return response()->json(['message' => 'Relato assumido.', 'status' => $relato->status]);
    }

    public function atualizarStatus(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarTratamento($request, $relato);

        $validated = $request->validate([
            'status' => 'required|in:pendente,em_analise,resolvido,arquivado',
        ]);

        $relato->update(['status' => $validated['status']]);

        $this->logAcesso(
            $request,
            $relato,
            $validated['status'] === 'arquivado' ? 'arquivou' : 'mudou_status',
            $validated['status']
        );

        return response()->json(['status' => $relato->status]);
    }

    public function adicionarNota(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarTratamento($request, $relato);

        $validated = $request->validate([
            'nota' => 'required|string|max:2000',
        ]);

        $nota = EscutaNota::create([
            'relato_id' => $relato->id,
            'autor_id'  => $request->user()->id,
            'nota'      => $validated['nota'],
        ]);

        $this->logAcesso($request, $relato, 'adicionou_nota');

        return response()->json([
            'message' => 'Nota adicionada.',
            'nota'    => [
                'id'    => $nota->id,
                'nota'  => $nota->nota,
                'autor' => $request->user()->nome,
                'data'  => $nota->created_at,
            ],
        ], 201);
    }

    /**
     * Resposta ao denunciante (visivel na pagina publica de acompanhamento).
     */
    public function adicionarMensagem(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarTratamento($request, $relato);

        $validated = $request->validate([
            'texto' => 'required|string|min:2|max:3000',
        ]);

        $mensagem = EscutaMensagem::create([
            'relato_id' => $relato->id,
            'autor'     => 'equipe',
            'user_id'   => $request->user()->id,
            'texto'     => $validated['texto'],
        ]);

        $this->logAcesso($request, $relato, 'respondeu_denunciante');

        // Aviso por e-mail, se o denunciante deixou um (opcional). Sem protocolo, sem conteudo.
        $email = $relato->email_notificacao;
        if ($email) {
            try {
                $url = rtrim(config('app.frontend_url'), '/') . '/escuta/acompanhar';
                Mail::to($email)->queue(new EscutaRespostaDenuncianteMail($url));
            } catch (\Throwable $e) {
                Log::warning('Falha ao avisar denunciante por e-mail', ['relato_id' => $relato->id, 'erro' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message'  => 'Resposta enviada ao denunciante.',
            'mensagem' => [
                'id'    => $mensagem->id,
                'autor' => $request->user()->nome,
                'de_equipe' => true,
                'texto' => $mensagem->texto,
                'data'  => $mensagem->created_at,
            ],
        ], 201);
    }

    // ── Link publico (config da empresa — somente role admin) ────────────
    public function configPublico(Request $request): JsonResponse
    {
        $empresa = Empresa::findOrFail($request->user()->empresa_id);

        return response()->json($this->payloadConfig($empresa));
    }

    public function ativarPublico(Request $request): JsonResponse
    {
        $empresa = Empresa::findOrFail($request->user()->empresa_id);

        abort_unless($empresa->temProdutoAtivo('canal_escuta'), 422, 'Produto Canal de Escuta nao esta ativo.');

        if (!$empresa->escuta_slug) {
            $empresa->escuta_slug = $this->gerarSlug($empresa);
        }
        $empresa->escuta_publica_ativa = true;
        $empresa->save();

        return response()->json($this->payloadConfig($empresa));
    }

    public function desativarPublico(Request $request): JsonResponse
    {
        $empresa = Empresa::findOrFail($request->user()->empresa_id);
        $empresa->update(['escuta_publica_ativa' => false]);

        return response()->json($this->payloadConfig($empresa));
    }

    /**
     * Gera um novo slug (invalida o link antigo — util se o link vazou).
     */
    public function regenerarSlug(Request $request): JsonResponse
    {
        $empresa = Empresa::findOrFail($request->user()->empresa_id);
        $empresa->update(['escuta_slug' => $this->gerarSlug($empresa)]);

        return response()->json($this->payloadConfig($empresa));
    }

    private function gerarSlug(Empresa $empresa): string
    {
        $base = Str::slug(Str::limit($empresa->nome_fantasia, 40, ''));
        do {
            $slug = $base . '-' . Str::lower(Str::random(4));
        } while (Empresa::where('escuta_slug', $slug)->where('id', '!=', $empresa->id)->exists());

        return $slug;
    }

    private function payloadConfig(Empresa $empresa): array
    {
        $url = $empresa->escuta_slug
            ? rtrim(config('app.frontend_url'), '/') . '/escuta/' . $empresa->escuta_slug
            : null;

        return [
            'ativa' => (bool) $empresa->escuta_publica_ativa,
            'slug'  => $empresa->escuta_slug,
            'url'   => $url,
            'url_acompanhamento' => rtrim(config('app.frontend_url'), '/') . '/escuta/acompanhar',
            'produto_ativo' => $empresa->temProdutoAtivo('canal_escuta'),
        ];
    }

    // ── Seguranca ────────────────────────────────────────────────────────
    /**
     * Autoriza o tratamento apenas para quem e do grupo de destino, da mesma
     * empresa, nao e o denunciado, e o relato nao e de comite externo.
     */
    private function autorizarTratamento(Request $request, RelatoEscuta $relato): void
    {
        $user = $request->user();

        abort_if((int) $relato->empresa_id !== (int) $user->empresa_id, 403);
        abort_if($relato->grupo_destino === 'comite_externo', 403);
        abort_if($user->grupo_escuta !== $relato->grupo_destino, 403);
        abort_if($relato->usuario_denunciado_id && (int) $relato->usuario_denunciado_id === (int) $user->id, 403);
    }

    private function logAcesso(Request $request, RelatoEscuta $relato, string $acao, ?string $detalhe = null): void
    {
        EscutaAcesso::create([
            'relato_id'  => $relato->id,
            'user_id'    => $request->user()->id,
            'acao'       => $acao,
            'detalhe'    => $detalhe,
            'ip_hash'    => hash('sha256', $request->ip() . '|' . $relato->empresa_id),
            'created_at' => now(),
        ]);
    }
}
