<?php

namespace App\Support;

use App\Models\Empresa;
use App\Models\User;

/**
 * Matriz de permissoes por perfil.
 *
 * Modelo: a PLATAFORMA define o padrao de cada perfil (constante PADRAO
 * abaixo); a EMPRESA pode apenas RESTRINGIR o que foi liberado — nunca
 * ampliar. Assim um cliente nao consegue se dar acesso indevido.
 *
 * Permissao efetiva = PADRAO[perfil][modulo] && !restricao_da_empresa.
 */
class Permissoes
{
    /** Modulos do painel administrativo (chave => rotulo exibido). */
    public const MODULOS = [
        'dashboard'     => 'Dashboard e indicadores',
        'pessoas'       => 'Colaboradores',
        'mapa_riscos'   => 'Mapa de riscos',
        'pesquisas'     => 'Pesquisas e clima',
        'checkins'      => 'Check-ins',
        'nr1'           => 'NR-1 / PGR',
        'canal_escuta'  => 'Canal de escuta',
        'ead'           => 'Treinamentos (EAD)',
        'comunicados'   => 'Comunicados',
        'relatorios'    => 'Relatorios',
        'empresa'       => 'Dados da empresa e cobrancas',
        'configuracoes' => 'Configuracoes e usuarios',
    ];

    /** Perfis de usuario do painel (chave => rotulo). */
    public const PERFIS = [
        'admin'     => 'Administrador',
        'gestor'    => 'Gestor',
        'consultor' => 'Consultor',
        'leitura'   => 'Somente leitura',
    ];

    /**
     * Padrao definido pela Plataforma.
     * Observacoes:
     * - consultor nao acessa o Canal de Escuta (sigilo das denuncias).
     * - leitura enxerga indicadores, mas nunca grava (ver ehSomenteLeitura).
     */
    public const PADRAO = [
        'admin' => [
            'dashboard' => true, 'pessoas' => true, 'mapa_riscos' => true, 'pesquisas' => true,
            'checkins' => true, 'nr1' => true, 'canal_escuta' => true, 'ead' => true,
            'comunicados' => true, 'relatorios' => true, 'empresa' => true, 'configuracoes' => true,
        ],
        'gestor' => [
            'dashboard' => true, 'pessoas' => true, 'mapa_riscos' => true, 'pesquisas' => true,
            'checkins' => true, 'nr1' => true, 'canal_escuta' => true, 'ead' => true,
            'comunicados' => true, 'relatorios' => true, 'empresa' => false, 'configuracoes' => false,
        ],
        'consultor' => [
            'dashboard' => true, 'pessoas' => true, 'mapa_riscos' => true, 'pesquisas' => true,
            'checkins' => true, 'nr1' => true, 'canal_escuta' => false, 'ead' => true,
            'comunicados' => true, 'relatorios' => true, 'empresa' => false, 'configuracoes' => false,
        ],
        'leitura' => [
            'dashboard' => true, 'pessoas' => true, 'mapa_riscos' => true, 'pesquisas' => true,
            'checkins' => true, 'nr1' => true, 'canal_escuta' => false, 'ead' => true,
            'comunicados' => true, 'relatorios' => true, 'empresa' => false, 'configuracoes' => false,
        ],
    ];

    /**
     * Primeiro segmento da rota admin => modulo.
     * Segmento nao listado = rota neutra (sem exigencia de modulo).
     */
    public const ROTA_MODULO = [
        'dashboard'           => 'dashboard',
        'indicadores'         => 'dashboard',
        'alertas'             => 'dashboard',
        'colaboradores'       => 'pessoas',
        // 'setores' fica NEUTRO: e dado de referencia usado como filtro em
        // pesquisas, comunicados e escuta. Restringi-lo quebraria essas telas.
        'riscos'              => 'mapa_riscos',
        'pesquisas'           => 'pesquisas',
        'checkins'            => 'checkins',
        'nr1'                 => 'nr1',
        'escuta'              => 'canal_escuta',
        'ead'                 => 'ead',
        'comunicados'         => 'comunicados',
        'relatorios'          => 'relatorios',
        'empresas'            => 'empresa',
        'cobrancas'           => 'empresa',
        // 'produtos-contratados' fica NEUTRO de proposito: alimenta o menu de
        // todos os perfis (quais modulos a empresa contratou). Sem isso o
        // menu de gestor/consultor/leitura ficaria vazio.
        'configuracoes'       => 'configuracoes',
        'usuarios'            => 'configuracoes',
    ];

    /** Perfil que so pode visualizar (nenhuma escrita). */
    public static function ehSomenteLeitura(?User $user): bool
    {
        return $user?->perfil === 'leitura';
    }

    /** Restricoes definidas pela empresa: ['gestor' => ['pesquisas' => false]] */
    public static function restricoes(?Empresa $empresa): array
    {
        $config = $empresa?->configuracoes ?? [];

        return is_array($config['permissoes_restricoes'] ?? null)
            ? $config['permissoes_restricoes']
            : [];
    }

    /** Matriz efetiva (todos os perfis) da empresa. */
    public static function matriz(?Empresa $empresa): array
    {
        $restricoes = self::restricoes($empresa);
        $matriz = [];

        foreach (self::PADRAO as $perfil => $modulos) {
            foreach ($modulos as $modulo => $padrao) {
                $restrito = ($restricoes[$perfil][$modulo] ?? null) === false;
                $matriz[$perfil][$modulo] = $padrao && !$restrito;
            }
        }

        return $matriz;
    }

    /** Modulos liberados para o usuario (chaves com valor true). */
    public static function doUsuario(?User $user): array
    {
        if (!$user) {
            return [];
        }

        // super_admin opera pela Plataforma, sem restricao de empresa
        if ($user->perfil === 'super_admin') {
            return array_keys(self::MODULOS);
        }

        $matriz = self::matriz($user->empresa);
        $perfil = $matriz[$user->perfil] ?? [];

        return array_keys(array_filter($perfil));
    }

    public static function permitido(?User $user, string $modulo): bool
    {
        return in_array($modulo, self::doUsuario($user), true);
    }
}
