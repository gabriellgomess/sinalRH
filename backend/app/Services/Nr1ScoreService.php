<?php

namespace App\Services;

use App\Models\Nr1Resposta;

class Nr1ScoreService
{
    // Itens por seção (para calcular totais esperados)
    private const ITENS_POR_SECAO = [
        1 => 4,
        2 => 4,
        3 => 4,
        4 => 4,
        5 => 4,
        6 => 4,
        7 => 4,
        8 => 4,
        9 => 4,
        10 => 4,
    ];

    private const SECAO_LABELS = [
        1 => 'Demandas de Trabalho',
        2 => 'Controle e Autonomia',
        3 => 'Clareza de Papel e Expectativas',
        4 => 'Relacionamentos e Justiça Organizacional',
        5 => 'Reconhecimento e Recompensa',
        6 => 'Suporte e Segurança Psicológica',
        7 => 'Condições Organizacionais e Comunicação',
        8 => 'Gestão de Mudanças',
        9 => 'Segurança e Situações Críticas',
        10 => 'Integração e Trabalho Remoto',
    ];

    public static function calcular(int $avaliacaoId, array $filtros = []): array
    {
        $query = Nr1Resposta::where('avaliacao_id', $avaliacaoId)
            ->when(!empty($filtros['setor_id']), fn ($q) =>
                $q->whereHas('respondente', fn ($r) => $r->where('setor_id', $filtros['setor_id']))
            )
            ->when(!empty($filtros['sexo']), fn ($q) =>
                $q->whereHas('respondente', fn ($r) => $r->where('sexo', $filtros['sexo']))
            )
            ->when(!empty($filtros['faixa_etaria']), fn ($q) =>
                $q->whereHas('respondente', fn ($r) => $r->where('faixa_etaria', $filtros['faixa_etaria']))
            );

        $total = $query->count();

        if ($total === 0) {
            return [
                'total_respostas'    => 0,
                'total_respondentes' => 0,
                'score_geral'        => null,
                'media_geral'        => null,
                'global'             => ['S' => 0, 'P' => 0, 'N' => 0],
                'por_secao'          => self::secaosVazias(),
                'itens_criticos'     => [],
            ];
        }

        // Total respondentes com filtros
        $totalRespondentes = Nr1Resposta::where('avaliacao_id', $avaliacaoId)
            ->when(!empty($filtros['setor_id']), fn ($q) =>
                $q->whereHas('respondente', fn ($r) => $r->where('setor_id', $filtros['setor_id']))
            )
            ->when(!empty($filtros['sexo']), fn ($q) =>
                $q->whereHas('respondente', fn ($r) => $r->where('sexo', $filtros['sexo']))
            )
            ->when(!empty($filtros['faixa_etaria']), fn ($q) =>
                $q->whereHas('respondente', fn ($r) => $r->where('faixa_etaria', $filtros['faixa_etaria']))
            )
            ->distinct('respondente_id')
            ->count('respondente_id');

        // Distribuição global Likert 1-5
        $distribuicao = (clone $query)
            ->selectRaw('valor, count(*) as total')
            ->groupBy('valor')
            ->pluck('total', 'valor')
            ->toArray();

        // Garante que todas as chaves de 1 a 5 existam no array
        $distribuicao = $distribuicao + [
            '1' => 0,
            '2' => 0,
            '3' => 0,
            '4' => 0,
            '5' => 0,
        ];

        // Mapeamento compatível para a interface antiga:
        // S = Positivo (4 e 5) | P = Neutro (3) | N = Negativo (1 e 2)
        $s = $distribuicao['4'] + $distribuicao['5'];
        $p = $distribuicao['3'];
        $n = $distribuicao['1'] + $distribuicao['2'];
        $global = ['S' => $s, 'P' => $p, 'N' => $n];

        // Média geral da escala Likert (1 a 5)
        $somaValores = (1 * $distribuicao['1']) +
                       (2 * $distribuicao['2']) +
                       (3 * $distribuicao['3']) +
                       (4 * $distribuicao['4']) +
                       (5 * $distribuicao['5']);

        $mediaGeral = round($somaValores / $total, 2);

        // Score geral normalizado (0-100) para compatibilidade retroativa
        $scoreGeral = round(($mediaGeral - 1) / 4 * 100, 1);

        // Por seção
        $porSecaoBruto = (clone $query)
            ->selectRaw('secao, item, valor, count(*) as total')
            ->groupBy('secao', 'item', 'valor')
            ->get();

        $porSecao = [];
        foreach (self::ITENS_POR_SECAO as $secao => $numItens) {
            $respostasSecao = $porSecaoBruto->where('secao', $secao);

            $c1 = $respostasSecao->where('valor', '1')->sum('total');
            $c2 = $respostasSecao->where('valor', '2')->sum('total');
            $c3 = $respostasSecao->where('valor', '3')->sum('total');
            $c4 = $respostasSecao->where('valor', '4')->sum('total');
            $c5 = $respostasSecao->where('valor', '5')->sum('total');

            $totalSecao = $c1 + $c2 + $c3 + $c4 + $c5;
            $somaSecao = (1 * $c1) + (2 * $c2) + (3 * $c3) + (4 * $c4) + (5 * $c5);

            $mediaSecao = $totalSecao > 0 ? round($somaSecao / $totalSecao, 2) : null;
            $score = $mediaSecao !== null ? round(($mediaSecao - 1) / 4 * 100, 1) : null;

            $porSecao[] = [
                'secao'        => $secao,
                'label'        => self::SECAO_LABELS[$secao],
                'score'        => $score,
                'media_likert' => $mediaSecao,
                'S'            => $c4 + $c5,
                'P'            => $c3,
                'N'            => $c1 + $c2,
                'total'        => $totalSecao,
            ];
        }

        // Itens críticos: item com >= 30% de respostas negativas (notas 1 e 2)
        $itensCriticos = [];
        foreach ($porSecaoBruto->groupBy(fn ($r) => "{$r->secao}-{$r->item}") as $chave => $respostas) {
            $totalItem = $respostas->sum('total');
            $nItem = $respostas->whereIn('valor', ['1', '2'])->sum('total');
            if ($totalItem > 0 && ($nItem / $totalItem) >= 0.30) {
                [$secao, $item] = explode('-', $chave);
                $itensCriticos[] = [
                    'secao'      => (int) $secao,
                    'item'       => (int) $item,
                    'label'      => self::SECAO_LABELS[(int) $secao],
                    'pct_n'      => round(($nItem / $totalItem) * 100, 1),
                    'total'      => $totalItem,
                    'N'          => $nItem,
                ];
            }
        }

        usort($itensCriticos, fn ($a, $b) => $b['pct_n'] <=> $a['pct_n']);

        return [
            'total_respostas'    => $total,
            'total_respondentes' => $totalRespondentes,
            'score_geral'        => $scoreGeral,
            'media_geral'        => $mediaGeral,
            'global'             => $global,
            'por_secao'          => $porSecao,
            'itens_criticos'     => array_slice($itensCriticos, 0, 10),
        ];
    }

    private static function secaosVazias(): array
    {
        $resultado = [];
        foreach (self::ITENS_POR_SECAO as $secao => $numItens) {
            $resultado[] = [
                'secao'        => $secao,
                'label'        => self::SECAO_LABELS[$secao],
                'score'        => null,
                'media_likert' => null,
                'S'            => 0,
                'P'            => 0,
                'N'            => 0,
                'total'        => 0,
            ];
        }
        return $resultado;
    }
}
