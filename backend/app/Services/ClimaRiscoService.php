<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Pesquisa;
use App\Models\Resposta;
use App\Models\Risco;

/**
 * Converte respostas de pesquisas de clima em registros de risco psicossocial
 * por setor (tabela `riscos`), alinhado aos 8 fatores da ISO 45003.
 *
 * Metodo: para cada setor, normaliza as respostas numericas (Likert 1-5 e
 * NPS 0-10) para um "score de saude" 0-100 e inverte para risco (100 - saude),
 * espelhando a semantica da NR-1. Respeita o mesmo minimo de sigilo por recorte.
 */
class ClimaRiscoService
{
    /** Minimo de respondentes por setor para nao ferir o anonimato. */
    public const MIN_RESPONDENTES = 5;

    /** Dimensoes ISO 45003 aceitas (chave => rotulo). */
    public const DIMENSOES = [
        'demanda'        => 'Demanda de trabalho',
        'lideranca'      => 'Qualidade da liderança',
        'clareza'        => 'Clareza de papel',
        'autonomia'      => 'Autonomia',
        'reconhecimento' => 'Reconhecimento',
        'comunicacao'    => 'Comunicação',
        'conflitos'      => 'Conflitos interpessoais',
        'apoio_social'   => 'Apoio social',
    ];

    /**
     * Gera/atualiza os riscos de clima de uma pesquisa. Retorna o nº de setores gerados.
     */
    public static function gerarParaPesquisa(Pesquisa $pesquisa): int
    {
        $periodo = ($pesquisa->encerrado_em ?? $pesquisa->updated_at ?? now())->format('Y-m');

        // Somente perguntas com escala numerica.
        $perguntas = $pesquisa->perguntas()
            ->whereIn('tipo', ['likert', 'nps'])
            ->get(['id', 'tipo', 'dimensao']);

        if ($perguntas->isEmpty()) {
            return 0;
        }

        $tipoPorPergunta = $perguntas->pluck('tipo', 'id');
        $dimPorPergunta  = $perguntas->pluck('dimensao', 'id');

        $respostas = Resposta::whereIn('pergunta_id', $perguntas->pluck('id'))
            ->whereNotNull('valor_numerico')
            ->whereNotNull('colaborador_id')
            ->with('colaborador:id,setor_id')
            ->get();

        $porSetor = $respostas->groupBy(fn ($r) => optional($r->colaborador)->setor_id);

        $gerados = 0;
        foreach ($porSetor as $setorId => $rs) {
            if (!$setorId) {
                continue;
            }

            $respondentes = $rs->pluck('colaborador_id')->unique()->count();
            if ($respondentes < self::MIN_RESPONDENTES) {
                continue; // sigilo: recorte pequeno demais
            }

            $saudes = $rs
                ->map(fn ($r) => self::normalizar($tipoPorPergunta[$r->pergunta_id] ?? null, $r->valor_numerico))
                ->filter(fn ($x) => $x !== null);

            if ($saudes->isEmpty()) {
                continue;
            }

            $saudeGeral = $saudes->avg();
            $score = round(100 - $saudeGeral, 1);
            $nivel = self::nivelPorSaude($saudeGeral);

            // Quebra por dimensao ISO (apenas perguntas etiquetadas).
            $dimensoes = [];
            $rs->groupBy(fn ($r) => $dimPorPergunta[$r->pergunta_id] ?? null)
                ->each(function ($grupo, $dimKey) use (&$dimensoes, $tipoPorPergunta) {
                    if (!$dimKey || !array_key_exists($dimKey, self::DIMENSOES)) {
                        return;
                    }
                    $s = $grupo
                        ->map(fn ($r) => self::normalizar($tipoPorPergunta[$r->pergunta_id] ?? null, $r->valor_numerico))
                        ->filter(fn ($x) => $x !== null);
                    if ($s->isNotEmpty()) {
                        $dimensoes[$dimKey] = round(100 - $s->avg(), 1);
                    }
                });

            $rec = self::recomendacao($nivel);

            Risco::updateOrCreate(
                ['empresa_id' => $pesquisa->empresa_id, 'setor_id' => (int) $setorId, 'periodo' => $periodo],
                [
                    'nivel'               => $nivel,
                    'score'               => $score,
                    'dimensoes'           => $dimensoes ?: (object) [],
                    'recomendacao_titulo' => $rec['titulo'] ?? null,
                    'recomendacao_texto'  => $rec['texto'] ?? null,
                    'gerado_por_ia'       => false,
                ]
            );
            $gerados++;
        }

        return $gerados;
    }

    /**
     * Recalcula os riscos de clima de todas as pesquisas com respostas da empresa
     * (status ativa ou encerrada). Retorna o total de setores gerados.
     */
    public static function recalcularEmpresa(Empresa $empresa): int
    {
        $total = 0;
        $pesquisas = Pesquisa::where('empresa_id', $empresa->id)
            ->whereIn('status', ['ativa', 'encerrada'])
            ->get();

        foreach ($pesquisas as $pesquisa) {
            $total += self::gerarParaPesquisa($pesquisa);
        }

        return $total;
    }

    // ── Helpers ─────────────────────────────────────────────────────────
    private static function normalizar(?string $tipo, $valor): ?float
    {
        if ($valor === null) {
            return null;
        }
        $v = (float) $valor;

        return match ($tipo) {
            'likert' => max(0, min(100, (($v - 1) / 4) * 100)),  // 1..5
            'nps'    => max(0, min(100, ($v / 10) * 100)),        // 0..10
            default  => null,
        };
    }

    private static function nivelPorSaude(float $saude): string
    {
        return match (true) {
            $saude >= 80 => 'baixo',
            $saude >= 60 => 'moderado',
            $saude >= 40 => 'alto',
            default      => 'critico',
        };
    }

    private static function recomendacao(string $nivel): array
    {
        return match ($nivel) {
            'critico' => [
                'titulo' => 'Plano de ação prioritário recomendado',
                'texto'  => 'Indicadores de clima apontam risco psicossocial elevado neste setor. Priorize ações preventivas e acompanhe de perto.',
            ],
            'alto' => [
                'titulo' => 'Fatores psicossociais em atenção',
                'texto'  => 'Há sinais de deterioração do clima. Revise as dimensões mais críticas e defina ações de mitigação.',
            ],
            default => ['titulo' => null, 'texto' => null],
        };
    }
}
