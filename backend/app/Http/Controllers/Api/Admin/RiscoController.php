<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Risco;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiscoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;

        // Último risco de cada setor
        $riscos = Risco::where('empresa_id', $empresa->id)
            ->when($request->periodo, fn ($q) => $q->where('periodo', $request->periodo))
            ->when($request->nivel,   fn ($q) => $q->whereIn('nivel', explode(',', $request->nivel)))
            ->with('setor')
            ->latest()
            ->get()
            ->unique('setor_id')
            ->sortBy(function ($r) {
                return match ($r->nivel) {
                    'critico'  => 0,
                    'alto'     => 1,
                    'moderado' => 2,
                    'baixo'    => 3,
                    default    => 4,
                };
            })
            ->values();

        $resumo = [
            'total'    => $riscos->count(),
            'criticos' => $riscos->where('nivel', 'critico')->count(),
            'altos'    => $riscos->where('nivel', 'alto')->count(),
            'moderados'=> $riscos->where('nivel', 'moderado')->count(),
            'baixos'   => $riscos->where('nivel', 'baixo')->count(),
        ];

        return response()->json([
            'riscos' => $riscos->map(fn ($r) => [
                'id'       => $r->id,
                'setor'    => $r->setor->nome,
                'setor_id' => $r->setor_id,
                'pessoas'  => $r->setor->colaboradores()->where('status', 'ativo')->count(),
                'nivel'    => $r->nivel,
                'score'    => $r->score,
                'dimensoes'=> $r->dimensoes,
                'periodo'  => $r->periodo,
                'recomendacao' => $r->recomendacao_titulo ? [
                    'titulo'   => $r->recomendacao_titulo,
                    'descricao'=> $r->recomendacao_texto,
                ] : null,
            ]),
            'resumo' => $resumo,
        ]);
    }

    public function show(Request $request, Setor $setor): JsonResponse
    {
        $risco = Risco::where('setor_id', $setor->id)
            ->where('empresa_id', $request->user()->empresa_id)
            ->latest()
            ->firstOrFail();

        return response()->json([
            'setor'    => $setor->nome,
            'pessoas'  => $setor->colaboradores()->where('status', 'ativo')->count(),
            'nivel'    => $risco->nivel,
            'score'    => $risco->score,
            'dimensoes'=> $risco->dimensoes,
            'historico'=> Risco::where('setor_id', $setor->id)
                ->orderByDesc('created_at')
                ->take(6)
                ->get(['periodo', 'nivel', 'score']),
            'recomendacao' => [
                'titulo'   => $risco->recomendacao_titulo,
                'descricao'=> $risco->recomendacao_texto,
            ],
        ]);
    }

    public function revisao(Request $request, Setor $setor): JsonResponse
    {
        $risco = Risco::where('setor_id', $setor->id)
            ->where('empresa_id', $request->user()->empresa_id)
            ->latest()
            ->first();

        if (!$risco) {
            return response()->json(['error' => 'Risco não encontrado.'], 404);
        }

        $meta = $risco->metadados ?? [];
        $meta['para_revisao'] = !($meta['para_revisao'] ?? false);
        $risco->update(['metadados' => $meta]);

        return response()->json(['para_revisao' => $meta['para_revisao']]);
    }

    public function planoAcao(Request $request, Setor $setor): JsonResponse
    {
        $validated = $request->validate([
            'acoes' => 'required|array|min:1',
            'acoes.*.descricao'   => 'required|string',
            'acoes.*.prazo'       => 'required|date',
            'acoes.*.responsavel' => 'required|string',
        ]);

        // Salva no risco mais recente do setor
        $risco = Risco::where('setor_id', $setor->id)->latest()->first();
        if ($risco) {
            $meta = $risco->metadados ?? [];
            $meta['plano_acao'] = $validated['acoes'];
            $risco->update(['metadados' => $meta]);
        }

        return response()->json(['message' => 'Plano de ação salvo.']);
    }
}
