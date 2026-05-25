<?php

namespace App\Jobs;

use App\Models\Empresa;
use App\Services\AsaasService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SincronizarCustomerAsaasJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public array $backoff = [30, 120, 600]; // 30s, 2min, 10min

    public function __construct(public Empresa $empresa) {}

    public function handle(AsaasService $asaas): void
    {
        if (!$asaas->enabled()) {
            Log::info('Asaas customer sync skipped (kill switch off)', [
                'empresa_id' => $this->empresa->id,
            ]);
            return;
        }

        if ($this->empresa->asaas_customer_id) {
            return;
        }

        try {
            $customerId = $asaas->ensureCustomer($this->empresa->fresh());
            Log::info('Asaas customer sincronizado', [
                'empresa_id'  => $this->empresa->id,
                'customer_id' => $customerId,
            ]);
        } catch (Throwable $e) {
            Log::error('Asaas customer sync falhou', [
                'empresa_id' => $this->empresa->id,
                'tentativa'  => $this->attempts(),
                'erro'       => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
