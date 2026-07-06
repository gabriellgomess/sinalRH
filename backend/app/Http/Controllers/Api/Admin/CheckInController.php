<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

        $checkins->getCollection()->transform([$this, 'anonimizar']);

        return response()->json($checkins);
    }

    public function resumo(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;
        $semana  = $request->get('semana', CheckIn::semanaAtual());

        $total = $empresa->total_colaboradores;

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

        $series = CheckIn::where('empresa_id', $empresa->id)
            ->selectRaw('semana, COUNT(*) as total, AVG(humor) as media')
            ->groupBy('semana')
            ->orderByDesc('semana')
            ->limit(6)
            ->get()
            ->sortBy('semana')
            ->values();

        $evolucao = $series->map(fn ($r) => [
            'mes'         => 'Sem ' . Str::after($r->semana, '-W'),
            'clima'       => round(((float) $r->media / 5) * 100, 1),
            'engajamento' => $total > 0 ? round(((int) $r->total / $total) * 100, 1) : 0,
        ])->values();

        $historico = $series->sortByDesc('semana')->map(fn ($r) => [
            'semana'            => $r->semana,
            'media_humor'       => round((float) $r->media, 2),
            'taxa_participacao' => $total > 0 ? round(((int) $r->total / $total) * 100, 1) : 0,
        ])->values();

        return response()->json([
            'semana'         => $semana,
            'total_esperado' => $total,
            'total_recebido' => $checkinsSemana->sum(),
            'participacao'   => $participacao,
            'media_humor'    => round($mediaHumor, 2),
            'clima_score'    => round(($mediaHumor / 5) * 100, 1),
            'evolucao'       => $evolucao,
            'historico'      => $historico,
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

        $porSetorBase = $checkins;
        $checkins = $checkins->map([$this, 'anonimizar']);

        $porSetor = $porSetorBase->groupBy('setor_id')->map(fn ($group) => [
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

    /**
     * Remove a identidade do colaborador quando o check-in e anonimo.
     */
    public function anonimizar(CheckIn $checkin): CheckIn
    {
        if ($checkin->anonimo) {
            $checkin->setRelation('colaborador', null);
            $checkin->makeHidden(['colaborador_id']);
        }

        return $checkin;
    }
}
