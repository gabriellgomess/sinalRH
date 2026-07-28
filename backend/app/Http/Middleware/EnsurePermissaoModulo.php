<?php

namespace App\Http\Middleware;

use App\Support\Permissoes;
use Closure;
use Illuminate\Http\Request;

/**
 * Aplica a matriz de permissoes as rotas do painel admin.
 *
 * O modulo e inferido pelo primeiro segmento da rota (api/admin/<segmento>),
 * evitando ter de anotar cada rota individualmente. Segmento nao mapeado em
 * Permissoes::ROTA_MODULO e considerado neutro e passa direto.
 *
 * Tambem barra qualquer escrita do perfil "leitura" — esconder o botao no
 * front nao protege nada; o bloqueio precisa estar aqui.
 */
class EnsurePermissaoModulo
{
    private const METODOS_LEITURA = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        if (Permissoes::ehSomenteLeitura($user) && !in_array($request->method(), self::METODOS_LEITURA, true)) {
            return response()->json([
                'error'   => 'Seu perfil e somente leitura.',
                'message' => 'Seu perfil permite apenas visualizar. Peca a um administrador para alterar seu acesso.',
            ], 403);
        }

        $segmento = $this->segmentoAposAdmin($request);
        $modulo   = Permissoes::ROTA_MODULO[$segmento] ?? null;

        if ($modulo && !Permissoes::permitido($user, $modulo)) {
            return response()->json([
                'error'   => 'Acesso nao autorizado.',
                'message' => 'Seu perfil nao tem acesso a este modulo. Fale com um administrador.',
                'modulo'  => $modulo,
            ], 403);
        }

        return $next($request);
    }

    private function segmentoAposAdmin(Request $request): ?string
    {
        $segmentos = $request->segments(); // ex.: ['api', 'admin', 'pesquisas', '3']
        $indice    = array_search('admin', $segmentos, true);

        if ($indice === false) {
            return null;
        }

        return $segmentos[$indice + 1] ?? null;
    }
}
