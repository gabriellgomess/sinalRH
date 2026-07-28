<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Support\Permissoes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissaoController extends Controller
{
    /**
     * Matriz efetiva da empresa + o que o usuario logado pode ver.
     * Consumido pelo menu e pelas telas.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'modulos'         => Permissoes::MODULOS,
            'perfis'          => Permissoes::PERFIS,
            'padrao'          => Permissoes::PADRAO,   // teto definido pela Plataforma
            'matriz'          => Permissoes::matriz($user->empresa),
            'meus_modulos'    => Permissoes::doUsuario($user),
            'meu_perfil'      => $user->perfil,
            'somente_leitura' => Permissoes::ehSomenteLeitura($user),
        ]);
    }

    /**
     * A empresa so pode RESTRINGIR o padrao. Qualquer tentativa de liberar
     * alem do teto da Plataforma e simplesmente ignorada.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'matriz'   => 'required|array',
            'matriz.*' => 'array',
        ]);

        $empresa = Empresa::findOrFail($request->user()->empresa_id);
        $restricoes = [];

        foreach (Permissoes::PADRAO as $perfil => $modulos) {
            // O admin nunca pode ser restringido (evita a empresa se trancar fora)
            if ($perfil === 'admin') {
                continue;
            }

            foreach ($modulos as $modulo => $padrao) {
                $desejado = (bool) ($validated['matriz'][$perfil][$modulo] ?? $padrao);

                if ($padrao && !$desejado) {
                    $restricoes[$perfil][$modulo] = false;
                }
            }
        }

        $config = $empresa->configuracoes ?? [];
        $config['permissoes_restricoes'] = $restricoes;
        $empresa->update(['configuracoes' => $config]);

        return response()->json([
            'matriz'  => Permissoes::matriz($empresa->fresh()),
            'message' => 'Permissoes atualizadas.',
        ]);
    }
}
