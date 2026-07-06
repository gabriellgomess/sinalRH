<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use AuthorizesRequests;

    /**
     * Isolamento multi-tenant: garante que cada model informado pertence à
     * empresa do usuário autenticado. Aborta 403 caso contrário.
     *
     * No-op quando o usuário não tem empresa (ex.: super_admin), pois esses
     * fluxos usam rotas próprias (plataforma) já restritas por papel.
     */
    protected function garantirMesmaEmpresa(...$models): void
    {
        $empresaId = request()->user()?->empresa_id;
        if (!$empresaId) {
            return;
        }

        foreach ($models as $model) {
            if ($model === null) {
                continue;
            }
            abort_if((int) ($model->empresa_id ?? 0) !== (int) $empresaId, 403);
        }
    }
}
