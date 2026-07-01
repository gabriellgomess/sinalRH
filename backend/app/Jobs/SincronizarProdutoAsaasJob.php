<?php

namespace App\Jobs;

/**
 * @deprecated Cobranca foi desacoplada de produto (jul/2026). Produtos = acesso, sem
 * cobranca. A sincronizacao financeira agora vive em App\Services\AsaasService::syncCobranca()
 * via CobrancaController. Esta classe virou no-op e pode ser removida do repositorio.
 */
class SincronizarProdutoAsaasJob
{
    public function __construct(...$args)
    {
        // no-op
    }

    public function handle(): void
    {
        // no-op — mantido apenas para compatibilidade de jobs eventualmente enfileirados.
    }
}
