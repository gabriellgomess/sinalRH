<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Nr1Avaliacao;
use App\Models\Risco;
use App\Models\Setor;
use App\Services\Nr1ScoreService;
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

        if ($riscos->isEmpty()) {
            $riscosNr1 = $this->riscosDaUltimaNr1($empresa);

            if ($riscosNr1->isNotEmpty()) {
                return response()->json([
                    'riscos' => $riscosNr1,
                    'resumo' => $this->resumo($riscosNr1),
                    'fonte'  => 'nr1',
                ]);
            }
        }

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

    private function riscosDaUltimaNr1($empresa)
    {
        $avaliacao = Nr1Avaliacao::where('empresa_id', $empresa->id)
            ->whereHas('respostas')
            ->latest('aplicada_em')
            ->latest('created_at')
            ->first();

        if (!$avaliacao) {
            return collect();
        }

        return $empresa->setores()
            ->select('id', 'nome')
            ->get()
            ->map(function (Setor $setor) use ($avaliacao) {
                $scores = Nr1ScoreService::calcular($avaliacao->id, ['setor_id' => $setor->id]);
                $scoreSaude = $scores['score_geral'];
                $scoreRisco = $scoreSaude !== null ? round(100 - $scoreSaude, 1) : 0;
                $nivel = $scoreSaude !== null ? $this->nivelPorScoreNr1($scoreSaude) : 'sem_dados';

                return [
                    'id' => "nr1-{$avaliacao->id}-setor-{$setor->id}",
                    'setor' => $setor->nome,
                    'setor_id' => $setor->id,
                    'pessoas' => $setor->colaboradores()->where('status', 'ativo')->count(),
                    'nivel' => $nivel,
                    'score' => $scoreRisco,
                    'dimensoes' => collect($scores['por_secao'])
                        ->mapWithKeys(fn ($secao) => [
                            $secao['label'] => $secao['score'] !== null ? round(100 - $secao['score'], 1) : 0,
                        ])
                        ->all(),
                    'periodo' => $avaliacao->aplicada_em?->format('Y-m'),
                    'para_revisao' => false,
                    'recomendacao' => $this->recomendacaoNr1($nivel, $scores),
                ];
            })
            ->sortBy(function ($r) {
                return match ($r['nivel']) {
                    'critico'  => 0,
                    'alto'     => 1,
                    'moderado' => 2,
                    'baixo'    => 3,
                    default    => 4,
                };
            })
            ->values();
    }

    private function resumo($riscos): array
    {
        return [
            'total'     => $riscos->count(),
            'criticos'  => $riscos->where('nivel', 'critico')->count(),
            'altos'     => $riscos->where('nivel', 'alto')->count(),
            'moderados' => $riscos->where('nivel', 'moderado')->count(),
            'baixos'    => $riscos->where('nivel', 'baixo')->count(),
        ];
    }

    private function nivelPorScoreNr1(float|int $score): string
    {
        return match (true) {
            $score >= 80 => 'baixo',
            $score >= 60 => 'moderado',
            $score >= 40 => 'alto',
            default => 'critico',
        };
    }

    private function recomendacaoNr1(string $nivel, array $scores): ?array
    {
        if (!in_array($nivel, ['critico', 'alto'], true)) {
            return null;
        }

        $critico = collect($scores['itens_criticos'])->first();

        return [
            'titulo' => $nivel === 'critico'
                ? 'Plano de ação prioritário recomendado'
                : 'Acompanhar fatores psicossociais em atenção',
            'descricao' => $critico
                ? "{$critico['pct_n']}% de respostas negativas em {$critico['label']}."
                : 'Revise as dimensões com maior intensidade de risco e defina ações preventivas.',
        ];
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
