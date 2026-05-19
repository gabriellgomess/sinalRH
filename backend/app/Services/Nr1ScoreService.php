<?php

namespace App\Services;

use App\Models\Nr1Resposta;

class Nr1ScoreService
{
    // Itens por seção (para calcular totais esperados)
    private const ITENS_POR_SECAO = [
        1 => 7,
        2 => 5,
        3 => 4,
        4 => 5,
        5 => 5,
        6 => 4,
        7 => 5,
    ];

    private const SECAO_LABELS = [
        1 => 'Demandas do Trabalho',
        2 => 'Autonomia e Controle',
        3 => 'Clareza de Papel e Expectativas',
        4 => 'Relacionamentos no Ambiente de Trabalho',
        5 => 'Reconhecimento e Reforço Positivo',
        6 => 'Segurança Psicológica',
        7 => 'Condições Organizacionais',
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

        // Distribuição global S/P/N
        $global = (clone $query)
            ->selectRaw('valor, count(*) as total')
            ->groupBy('valor')
            ->pluck('total', 'valor')
            ->toArray();

        $global = array_merge(['S' => 0, 'P' => 0, 'N' => 0], $global);

        // Score geral: S=1, P=0.5, N=0
        $scoreGeral = $total > 0
            ? round((($global['S'] + $global['P'] * 0.5) / $total) * 100, 1)
            : null;

        // Por seção
        $porSecaoBruto = (clone $query)
            ->selectRaw('secao, item, valor, count(*) as total')
            ->groupBy('secao', 'item', 'valor')
            ->get();

        $porSecao = [];
        foreach (self::ITENS_POR_SECAO as $secao => $numItens) {
            $respostasSecao = $porSecaoBruto->where('secao', $secao);

            $s = $respostasSecao->where('valor', 'S')->sum('total');
            $p = $respostasSecao->where('valor', 'P')->sum('total');
            $n = $respostasSecao->where('valor', 'N')->sum('total');
            $totalSecao = $s + $p + $n;

            $score = $totalSecao > 0
                ? round((($s + $p * 0.5) / $totalSecao) * 100, 1)
                : null;

            $porSecao[] = [
                'secao'  => $secao,
                'label'  => self::SECAO_LABELS[$secao],
                'score'  => $score,
                'S'      => $s,
                'P'      => $p,
                'N'      => $n,
                'total'  => $totalSecao,
            ];
        }

        // Itens críticos: item com > 30% de resposta N
        $itensCriticos = [];
        foreach ($porSecaoBruto->groupBy(fn ($r) => "{$r->secao}-{$r->item}") as $chave => $respostas) {
            $totalItem = $respostas->sum('total');
            $nItem = $respostas->where('valor', 'N')->sum('total');
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
                'secao' => $secao,
                'label' => self::SECAO_LABELS[$secao],
                'score' => null,
                'S' => 0, 'P' => 0, 'N' => 0,
                'total' => 0,
            ];
        }
        return $resultado;
    }
}
