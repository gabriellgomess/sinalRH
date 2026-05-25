<?php

namespace App\Jobs;

use App\Models\EmpresaProduto;
use App\Services\AsaasService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SincronizarProdutoAsaasJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public array $backoff = [60, 300, 1200]; // 1min, 5min, 20min

    public function __construct(public EmpresaProduto $produto) {}

    public function handle(AsaasService $asaas): void
    {
        if (!$asaas->enabled()) {
            Log::info('Asaas produto sync skipped (kill switch off)', [
                'produto_id' => $this->produto->id,
            ]);
            return;
        }

        $produto = $this->produto->fresh();

        // Ja sincronizado em retry anterior ou via re-sync manual
        if ($produto->asaas_subscription_id || $produto->asaas_payment_id) {
            return;
        }

        try {
            $asaas->syncProduto($produto);
            Log::info('Asaas produto sincronizado em retry', [
                'produto_id' => $produto->id,
                'tentativa'  => $this->attempts(),
            ]);
        } catch (Throwable $e) {
            Log::warning('Asaas produto sync falhou (job)', [
                'produto_id' => $produto->id,
                'tentativa'  => $this->attempts(),
                'erro'       => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
