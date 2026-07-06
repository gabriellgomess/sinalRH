<?php

namespace App\Services;

/**
 * Roteamento hierarquico do Canal de Escuta (conflito de interesse).
 *
 * Regra (direcionamento pela escolha do colaborador):
 *   colaborador/setor/lideranca -> RH
 *   RH                          -> Diretoria
 *   Diretoria                   -> Presidencia
 *   Presidencia                 -> Comite externo (nenhum usuario interno ve)
 *   nao_sabe / nao_informar     -> RH (padrao)
 *
 * Se um usuario denunciado for informado e ele pertencer a um grupo de
 * tratamento, o destino escala acima desse grupo (evita o alvo se tratar).
 */
class EscutaRoteamentoService
{
    /** Ordem hierarquica dos grupos de tratamento. */
    public const CADEIA = ['rh', 'diretoria', 'presidencia', 'comite_externo'];

    private const MAPA_TIPO = [
        'colaborador_setor' => 'rh',
        'lideranca'         => 'rh',
        'rh'                => 'diretoria',
        'diretoria'         => 'presidencia',
        'presidencia'       => 'comite_externo',
        'nao_sabe'          => 'rh',
        'nao_informar'      => 'rh',
    ];

    /**
     * @return array{grupo_destino:string, nivel_sigilo:string}
     */
    public function calcular(?string $tipoEnvolvido, ?string $grupoDenunciado = null): array
    {
        $base = self::MAPA_TIPO[$tipoEnvolvido] ?? 'rh';

        // Se o denunciado pertence a um grupo de tratamento, escala acima dele.
        if ($grupoDenunciado && in_array($grupoDenunciado, self::CADEIA, true)) {
            $acima = $this->escalar($grupoDenunciado);
            $base = $this->maior($base, $acima);
        }

        return [
            'grupo_destino' => $base,
            'nivel_sigilo'  => $this->sigilo($base),
        ];
    }

    public function escalar(string $grupo): string
    {
        $i = array_search($grupo, self::CADEIA, true);
        if ($i === false) {
            return 'rh';
        }
        return self::CADEIA[min($i + 1, count(self::CADEIA) - 1)];
    }

    private function maior(string $a, string $b): string
    {
        return array_search($a, self::CADEIA, true) >= array_search($b, self::CADEIA, true) ? $a : $b;
    }

    private function sigilo(string $grupo): string
    {
        return match ($grupo) {
            'comite_externo' => 'maximo',
            'presidencia'    => 'alto',
            default          => 'padrao',
        };
    }
}
