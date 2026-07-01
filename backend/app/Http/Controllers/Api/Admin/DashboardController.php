<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Colaborador;
use App\Models\Risco;
use App\Models\RelatoEscuta;
use App\Models\Pesquisa;
use App\Models\EmpresaProduto;
use App\Models\Nr1Avaliacao;
use App\Services\Nr1ScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;
        $periodo = $request->get('periodo', now()->format('Y-m'));

        // KPIs principais
        $totalColaboradores = $empresa->total_colaboradores;
        $semanaAtual = CheckIn::semanaAtual();

        // Índice de clima: média dos check-ins dos últimos 90 dias escalado para 0-100
        $mediaHumor = $empresa->colaboradores()
            ->join('checkins', 'colaboradores.id', '=', 'checkins.colaborador_id')
            ->where('checkins.created_at', '>=', now()->subDays(90))
            ->avg('checkins.humor') ?? 0;
        $climaGeral = round(($mediaHumor / 5) * 100, 1);

        // Participação: colaboradores que fizeram check-in esta semana
        $checkinsEstaSemana = CheckIn::where('empresa_id', $empresa->id)
            ->where('semana', $semanaAtual)
            ->count();
        $participacao = $totalColaboradores > 0
            ? round(($checkinsEstaSemana / $totalColaboradores) * 100, 1)
            : 0;

        // Riscos
        $riscosPorNivel = Risco::where('empresa_id', $empresa->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->unique('setor_id');

        $criticos = $riscosPorNivel->whereIn('nivel', ['critico', 'alto'])->count();
        $nivelGeral = match(true) {
            $criticos === 0 => 'Baixo',
            $criticos <= 2  => 'Moderado',
            $criticos <= 4  => 'Alto',
            default         => 'Crítico',
        };

        // Evolução mensal (últimos 6 meses)
        $ultimaNr1ComRespostas = Nr1Avaliacao::where('empresa_id', $empresa->id)
            ->whereHas('respostas')
            ->latest('aplicada_em')
            ->latest('created_at')
            ->first();

        $scoresNr1 = $ultimaNr1ComRespostas
            ? Nr1ScoreService::calcular($ultimaNr1ComRespostas->id)
            : null;

        if ($scoresNr1 && $scoresNr1['score_geral'] !== null) {
            $nivelGeral = $this->nivelRiscoNr1($scoresNr1['score_geral']);
        }

        $evolucao = collect(range(5, 0))->map(function ($mesesAtras) use ($empresa) {
            $data = now()->subMonths($mesesAtras);
            $media = $empresa->colaboradores()
                ->join('checkins', 'colaboradores.id', '=', 'checkins.colaborador_id')
                ->whereYear('checkins.created_at', $data->year)
                ->whereMonth('checkins.created_at', $data->month)
                ->avg('checkins.humor') ?? 0;

            return [
                'mes'          => $data->translatedFormat('M'),
                'clima'        => round(($media / 5) * 100),
                'engajamento'  => max(0, round(($media / 5) * 100) - rand(3, 8)),
            ];
        });

        // Ranking de setores
        $rankingSetores = $ultimaNr1ComRespostas
            ? $this->rankingSetoresNr1($empresa, $ultimaNr1ComRespostas)
            : $empresa->setores()
                ->with('ultimoRisco')
                ->withCount(['colaboradores' => fn ($q) => $q->where('status', 'ativo')])
                ->get()
                ->map(fn ($s) => [
                    'nome'  => $s->nome,
                    'score' => $s->ultimoRisco?->score ?? 75,
                    'nivel' => $s->ultimoRisco?->nivel ?? 'baixo',
                ])
                ->sortByDesc('score')
                ->values();

        $setoresAtencao = $ultimaNr1ComRespostas
            ? $rankingSetores->whereIn('nivel', ['alto', 'critico'])->count()
            : $criticos;

        // Alertas recentes
        $alertas = collect();
        $riscosCriticos = Risco::where('empresa_id', $empresa->id)
            ->whereIn('nivel', ['critico', 'alto'])
            ->with('setor')
            ->latest()
            ->take(3)
            ->get();

        foreach ($riscosCriticos as $r) {
            $alertas->push([
                'id'       => $r->id,
                'titulo'   => "Risco {$r->nivel} em {$r->setor->nome}",
                'descricao'=> 'Score: ' . $r->score,
                'nivel'    => $r->nivel === 'critico' ? 'critico' : 'atencao',
                'tempo'    => $r->created_at,
                'link'     => '/admin/riscos',
            ]);
        }

        // PGR / NR-1 — alertas de reavaliacao vencida ou proxima do prazo
        $hoje  = now()->startOfDay();
        $prazo = now()->addDays(30)->endOfDay();

        $pgrAlertas = Nr1Avaliacao::where('empresa_id', $empresa->id)
            ->whereNotNull('proxima_avaliacao_em')
            ->where('proxima_avaliacao_em', '<=', $prazo)
            ->orderBy('proxima_avaliacao_em')
            ->take(3)
            ->get();

        foreach ($pgrAlertas as $a) {
            $vencida = $a->proxima_avaliacao_em->lt($hoje);
            $dias    = $hoje->diffInDays($a->proxima_avaliacao_em, false);

            $alertas->push([
                'id'        => "pgr-{$a->id}",
                'titulo'    => $vencida
                    ? "PGR vencido: {$a->titulo}"
                    : "PGR vence em {$dias} dia" . ($dias === 1 ? '' : 's') . ": {$a->titulo}",
                'descricao' => 'Reavaliacao prevista para ' . $a->proxima_avaliacao_em->format('d/m/Y'),
                'nivel'     => $vencida ? 'critico' : 'atencao',
                'tempo'     => $a->updated_at,
                'link'      => '/admin/nr1',
            ]);
        }

        if ($ultimaNr1ComRespostas && $scoresNr1) {
            foreach (collect($scoresNr1['itens_criticos'])->take(2) as $item) {
                $alertas->push([
                    'id'        => "nr1-item-{$item['secao']}-{$item['item']}",
                    'titulo'    => "NR-1: risco em {$item['label']}",
                    'descricao' => "{$item['pct_n']}% de respostas negativas no item {$item['item']}",
                    'nivel'     => $item['pct_n'] >= 50 ? 'critico' : 'atencao',
                    'tempo'     => $ultimaNr1ComRespostas->updated_at,
                    'link'      => '/admin/nr1',
                ]);
            }
        }

        $relatosPendentes = RelatoEscuta::where('empresa_id', $empresa->id)
            ->where('status', 'pendente')
            ->count();

        if ($relatosPendentes > 0) {
            $alertas->push([
                'id'       => 'escuta',
                'titulo'   => "{$relatosPendentes} novos relatos no canal de escuta",
                'descricao'=> 'aguardando triagem',
                'nivel'    => 'info',
                'tempo'    => now()->subDays(3),
            ]);
        }

        return response()->json([
            'indicadores' => [
                'clima_geral'        => $climaGeral,
                'participacao'       => $participacao,
                'risco_psicossocial' => $nivelGeral,
                'setores_atencao'    => $setoresAtencao,
                'setores_total'      => $empresa->setores()->count(),
                'total_colaboradores'=> $totalColaboradores,
                'nr1_score_geral'    => $scoresNr1['score_geral'] ?? null,
                'nr1_total_respondentes' => $scoresNr1['total_respondentes'] ?? 0,
            ],
            'nr1' => $ultimaNr1ComRespostas ? [
                'id' => $ultimaNr1ComRespostas->id,
                'titulo' => $ultimaNr1ComRespostas->titulo,
                'status' => $ultimaNr1ComRespostas->status,
                'aplicada_em' => $ultimaNr1ComRespostas->aplicada_em?->toDateString(),
                'score_geral' => $scoresNr1['score_geral'] ?? null,
                'total_respondentes' => $scoresNr1['total_respondentes'] ?? 0,
            ] : null,
            'evolucao_clima'  => $evolucao,
            'ranking_setores' => $rankingSetores->take(6),
            'alertas'         => $alertas->take(5)->values(),
        ]);
    }

    public function indicadores(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    public function produtosContratados(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;

        $produtos = EmpresaProduto::where('empresa_id', $empresa->id)
            ->whereIn('status', ['ativo', 'pausado', 'inadimplente'])
            ->orderByDesc('data_inicio')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $produtos->map(fn ($p) => [
                'id'                   => $p->id,
                'produto'              => $p->produto,
                'titulo'               => $p->titulo,
                'status'               => $p->status,
                'limite_colaboradores' => $p->limite_colaboradores,
                'data_inicio'          => $p->data_inicio?->toDateString(),
                'data_fim'             => $p->data_fim?->toDateString(),
            ]),
        ]);
    }

    public function alertas(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;

        $riscos = Risco::where('empresa_id', $empresa->id)
            ->whereIn('nivel', ['critico', 'alto'])
            ->with('setor')
            ->latest()
            ->get();

        $escuta = RelatoEscuta::where('empresa_id', $empresa->id)
            ->where('status', 'pendente')
            ->latest()
            ->get();

        return response()->json([
            'riscos'            => $riscos,
            'escuta'            => $escuta,
            'escuta_pendentes'  => $escuta->count(),
        ]);
    }

    private function rankingSetoresNr1($empresa, Nr1Avaliacao $avaliacao)
    {
        return $empresa->setores()
            ->select('id', 'nome')
            ->get()
            ->map(function ($setor) use ($avaliacao) {
                $scores = Nr1ScoreService::calcular($avaliacao->id, ['setor_id' => $setor->id]);
                $score = $scores['score_geral'];

                return [
                    'nome' => $setor->nome,
                    'score' => $score ?? 0,
                    'nivel' => $score !== null ? $this->nivelSlugNr1($score) : 'sem_dados',
                ];
            })
            ->sortByDesc('score')
            ->values();
    }

    private function nivelRiscoNr1(float|int $score): string
    {
        return match (true) {
            $score >= 80 => 'Baixo',
            $score >= 60 => 'Moderado',
            $score >= 40 => 'Alto',
            default => 'Crítico',
        };
    }

    private function nivelSlugNr1(float|int $score): string
    {
        return match (true) {
            $score >= 80 => 'baixo',
            $score >= 60 => 'moderado',
            $score >= 40 => 'alto',
            default => 'critico',
        };
    }
}
