<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;

        $checkins = CheckIn::where('empresa_id', $empresa->id)
            ->when($request->setor_id, fn ($q) => $q->where('setor_id', $request->setor_id))
            ->when($request->semana,   fn ($q) => $q->where('semana', $request->semana))
            ->when($request->humor,    fn ($q) => $q->where('humor', $request->humor))
            ->with([
                'colaborador:id,nome,cargo,setor_id',
                'setor:id,nome',
            ])
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 30));

        return response()->json($checkins);
    }

    public function resumo(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;
        $semana  = $request->get('semana', CheckIn::semanaAtual());

        $total = $empresa->colaboradores()->where('status', 'ativo')->count();

        $checkinsSemana = CheckIn::where('empresa_id', $empresa->id)
            ->where('semana', $semana)
            ->selectRaw('humor, COUNT(*) as total')
            ->groupBy('humor')
            ->pluck('total', 'humor');

        $mediaHumor = CheckIn::where('empresa_id', $empresa->id)
            ->where('semana', $semana)
            ->avg('humor') ?? 0;

        $participacao = $total > 0
            ? round(($checkinsSemana->sum() / $total) * 100, 1)
            : 0;

        return response()->json([
            'semana'         => $semana,
            'total_esperado' => $total,
            'total_recebido' => $checkinsSemana->sum(),
            'participacao'   => $participacao,
            'media_humor'    => round($mediaHumor, 2),
            'clima_score'    => round(($mediaHumor / 5) * 100, 1),
            'distribuicao'   => [
                '5' => $checkinsSemana->get(5, 0),
                '4' => $checkinsSemana->get(4, 0),
                '3' => $checkinsSemana->get(3, 0),
                '2' => $checkinsSemana->get(2, 0),
                '1' => $checkinsSemana->get(1, 0),
            ],
        ]);
    }

    public function porSemana(Request $request, string $semana): JsonResponse
    {
        $empresa = $request->user()->empresa;

        $checkins = CheckIn::where('empresa_id', $empresa->id)
            ->where('semana', $semana)
            ->with(['colaborador:id,nome', 'setor:id,nome'])
            ->orderByDesc('humor')
            ->get();

        $porSetor = $checkins->groupBy('setor_id')->map(fn ($group) => [
            'setor'       => $group->first()->setor?->nome ?? 'Sem setor',
            'count'       => $group->count(),
            'media_humor' => round($group->avg('humor'), 2),
        ])->values();

        return response()->json([
            'semana'    => $semana,
            'checkins'  => $checkins,
            'por_setor' => $porSetor,
        ]);
    }
}
