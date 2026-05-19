<?php

namespace App\Http\Controllers\Api\Plataforma;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Colaborador;
use App\Models\Empresa;
use App\Models\Pesquisa;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalEmpresas      = Empresa::where('status', 'ativo')->count();
        $totalColaboradores = Colaborador::where('status', 'ativo')->count();
        $pesquisasAtivas    = Pesquisa::where('status', 'ativa')->count();
        $checkinsHoje       = CheckIn::whereDate('created_at', today())->count();

        $empresasRecentes = Empresa::withCount([
                'colaboradores' => fn ($q) => $q->where('status', 'ativo'),
            ])
            ->orderByDesc('created_at')
            ->take(5)
            ->get(['id', 'nome_fantasia', 'plano', 'status', 'created_at']);

        $porPlano = Empresa::selectRaw('plano, COUNT(*) as total')
            ->groupBy('plano')
            ->pluck('total', 'plano');

        $evolucao = collect(range(5, 0))->map(function ($mesesAtras) {
            $data = now()->subMonths($mesesAtras);
            return [
                'mes'       => $data->translatedFormat('M'),
                'empresas'  => Empresa::whereYear('created_at', $data->year)
                                  ->whereMonth('created_at', $data->month)
                                  ->count(),
            ];
        });

        return response()->json([
            'indicadores' => [
                'total_empresas'      => $totalEmpresas,
                'total_colaboradores' => $totalColaboradores,
                'pesquisas_ativas'    => $pesquisasAtivas,
                'checkins_hoje'       => $checkinsHoje,
            ],
            'empresas_recentes' => $empresasRecentes,
            'por_plano'         => $porPlano,
            'evolucao'          => $evolucao,
        ]);
    }
}
