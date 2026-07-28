<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EscutaRespostaDenuncianteMail;
use App\Models\EscutaAcesso;
use App\Models\EscutaMensagem;
use App\Models\RelatoEscuta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Interface do Comite/Conselho externo — relatos que envolvem o topo da
 * hierarquia e que, por conflito de interesse, nenhum usuario interno ve.
 *
 * Acesso por TOKEN proprio, enviado no e-mail do comite. O token e distinto
 * do protocolo do denunciante de proposito: se fossem o mesmo, quem relatou
 * poderia responder e encerrar o proprio caso passando-se pelo comite.
 */
class EscutaComiteController extends Controller
{
    public function show(Request $request, string $token): JsonResponse
    {
        $relato = $this->relatoPeloToken($token);

        $relato->forceFill(['comite_ultimo_acesso_em' => now()])->save();
        $relato->mensagens()->where('autor', 'denunciante')->whereNull('lida_em')->update(['lida_em' => now()]);
        $this->logAcesso($request, $relato, 'comite_visualizou');

        $relato->load('empresa:id,nome_fantasia', 'setor:id,nome');

        return response()->json([
            'empresa'    => $relato->empresa?->nome_fantasia,
            'protocolo'  => $relato->protocolo,
            'origem'     => $relato->origem,
            'categoria'  => $relato->categoria,
            'prioridade' => $relato->prioridade,
            'status'     => $relato->status,
            'setor'      => $relato->setor?->nome,
            'cargo_nivel_denunciado' => $relato->cargo_nivel_denunciado,
            'texto'      => $relato->texto,
            'criado_em'  => $relato->created_at,
            'mensagens'  => $relato->mensagens->map(fn ($m) => [
                'id'        => $m->id,
                'autor'     => $m->autor === 'equipe' ? 'Comitê' : 'Quem relatou',
                'de_equipe' => $m->autor === 'equipe',
                'texto'     => $m->texto,
                'data'      => $m->created_at,
            ])->values(),
        ]);
    }

    public function responder(Request $request, string $token): JsonResponse
    {
        $relato = $this->relatoPeloToken($token);

        $validated = $request->validate([
            'texto' => 'required|string|min:2|max:3000',
        ]);

        $mensagem = EscutaMensagem::create([
            'relato_id' => $relato->id,
            'autor'     => 'equipe',
            'user_id'   => null, // comite externo nao e usuario do sistema
            'texto'     => $validated['texto'],
        ]);

        // Relato em tratamento assim que o comite responde
        if ($relato->status === 'pendente') {
            $relato->update(['status' => 'em_analise']);
        }

        $this->logAcesso($request, $relato, 'comite_respondeu');
        $this->avisarDenunciante($relato);

        return response()->json([
            'message'  => 'Resposta enviada a quem relatou.',
            'status'   => $relato->status,
            'mensagem' => [
                'id'        => $mensagem->id,
                'autor'     => 'Comitê',
                'de_equipe' => true,
                'texto'     => $mensagem->texto,
                'data'      => $mensagem->created_at,
            ],
        ], 201);
    }

    public function atualizarStatus(Request $request, string $token): JsonResponse
    {
        $relato = $this->relatoPeloToken($token);

        $validated = $request->validate([
            'status' => 'required|in:em_analise,resolvido,arquivado',
        ]);

        $relato->update(['status' => $validated['status']]);
        $this->logAcesso($request, $relato, 'comite_mudou_status', $validated['status']);

        return response()->json(['status' => $relato->status]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    private function relatoPeloToken(string $token): RelatoEscuta
    {
        $relato = RelatoEscuta::where('comite_token', $token)
            ->where('grupo_destino', 'comite_externo')
            ->first();

        abort_if(!$relato, 404, 'Acesso nao encontrado.');

        return $relato;
    }

    private function avisarDenunciante(RelatoEscuta $relato): void
    {
        $email = $relato->email_notificacao;
        if (!$email) {
            return;
        }

        try {
            $url = rtrim(config('app.frontend_url'), '/') . '/escuta/acompanhar';
            Mail::to($email)->queue(new EscutaRespostaDenuncianteMail($url));
        } catch (\Throwable $e) {
            Log::warning('Falha ao avisar denunciante por e-mail', ['relato_id' => $relato->id, 'erro' => $e->getMessage()]);
        }
    }

    /** Auditoria: user_id null identifica acao do comite externo. */
    private function logAcesso(Request $request, RelatoEscuta $relato, string $acao, ?string $detalhe = null): void
    {
        EscutaAcesso::create([
            'relato_id'  => $relato->id,
            'user_id'    => null,
            'acao'       => $acao,
            'detalhe'    => $detalhe,
            'ip_hash'    => hash('sha256', $request->ip() . '|' . $relato->empresa_id),
            'created_at' => now(),
        ]);
    }
}
