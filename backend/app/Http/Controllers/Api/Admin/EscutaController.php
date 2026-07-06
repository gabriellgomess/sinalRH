<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EscutaAcesso;
use App\Models\EscutaNota;
use App\Models\RelatoEscuta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            ->latest()
            ->paginate(20);

        return response()->json($relatos);
    }

    public function show(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarTratamento($request, $relato);
        $this->logAcesso($request, $relato, 'visualizou');

        $relato->load(['setor:id,nome', 'notas.autor:id,nome']);
        if ($relato->modo === 'identificado') {
            $relato->load('colaborador:id,nome,email');
        }

        return response()->json([
            'id'            => $relato->id,
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
