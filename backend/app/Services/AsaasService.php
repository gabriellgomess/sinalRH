<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\EmpresaProduto;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AsaasService
{
    public function enabled(): bool
    {
        return (bool) config('services.asaas.enabled');
    }

    public function syncProduto(EmpresaProduto $produto): EmpresaProduto
    {
        if (!$this->enabled()) {
            return $produto;
        }

        $produto->loadMissing('empresa');

        if ($produto->tipo === 'recorrente_mensal') {
            $this->syncAssinaturaConsolidada($produto->empresa);
            return $produto->fresh();
        }

        if ($produto->tipo === 'pontual') {
            $this->syncPagamentoConsolidado($produto->empresa);
            return $produto->fresh();
        }

        $customerId = $this->ensureCustomer($produto->empresa);
        $response = $this->createPayment($produto, $customerId);

        $produto->forceFill([
            'asaas_subscription_id' => null,
            'asaas_payment_id' => $response['id'] ?? null,
            'asaas_invoice_url' => $response['invoiceUrl'] ?? $response['bankSlipUrl'] ?? null,
            'asaas_metadata' => $response,
            'asaas_ultima_sincronizacao_em' => now(),
        ])->save();

        return $produto->fresh();
    }

    public function syncPagamentoConsolidado(Empresa $empresa): void
    {
        if (!$this->enabled()) {
            return;
        }

        $customerId = $this->ensureCustomer($empresa);

        $produtosPontuais = $empresa->produtos()
            ->where('tipo', 'pontual')
            ->where('status', 'ativo')
            ->get();

        $valorConsolidado = 0.0;
        foreach ($produtosPontuais as $prod) {
            $valorConsolidado += $this->paymentValue($prod);
        }

        if ($valorConsolidado <= 0) {
            foreach ($produtosPontuais as $prod) {
                if ($prod->asaas_payment_id) {
                    try {
                        $this->client()->delete("/payments/{$prod->asaas_payment_id}");
                    } catch (\Throwable $e) {
                        // Ignore
                    }
                }
                $prod->forceFill([
                    'asaas_payment_id' => null,
                    'asaas_invoice_url' => null,
                ])->save();
            }
            return;
        }

        $existingPaymentId = null;
        foreach ($produtosPontuais as $prod) {
            if ($prod->asaas_payment_id) {
                $existingPaymentId = $prod->asaas_payment_id;
                break;
            }
        }

        $response = null;
        if ($existingPaymentId) {
            try {
                $response = $this->client()
                    ->post("/payments/{$existingPaymentId}", [
                        'value' => $valorConsolidado,
                    ])
                    ->throw()
                    ->json();
            } catch (\Throwable $e) {
                $response = null;
            }
        }

        if (!$response) {
            $firstPontual = $produtosPontuais->first();
            $dueDate = $firstPontual ? $this->dueDate($firstPontual) : Carbon::now()->toDateString();
            $description = "Cobrança Única Consolidada - Sinal RH";

            $response = $this->client()
                ->post('/payments', [
                    'customer' => $customerId,
                    'billingType' => config('services.asaas.default_billing_type', 'UNDEFINED'),
                    'value' => $valorConsolidado,
                    'dueDate' => $dueDate,
                    'description' => $description,
                    'externalReference' => "empresa_consolidada_cobranca_unica:{$empresa->id}",
                ])
                ->throw()
                ->json();
        }

        foreach ($produtosPontuais as $prod) {
            $prod->forceFill([
                'asaas_subscription_id' => null,
                'asaas_payment_id' => $response['id'],
                'asaas_invoice_url' => $response['invoiceUrl'] ?? $response['bankSlipUrl'] ?? null,
                'asaas_metadata' => $response,
                'asaas_ultima_sincronizacao_em' => now(),
            ])->save();
        }
    }

    public function syncAssinaturaConsolidada(Empresa $empresa): void
    {
        if (!$this->enabled()) {
            return;
        }

        $customerId = $this->ensureCustomer($empresa);

        $valorMensalConsolidado = (float) ($empresa->valor_mensal !== null
            ? $empresa->valor_mensal
            : $empresa->produtos()
                ->where('tipo', 'recorrente_mensal')
                ->where('status', 'ativo')
                ->sum('valor_mensal'));

        if ($valorMensalConsolidado <= 0) {
            if ($empresa->asaas_unified_subscription_id) {
                try {
                    $this->client()->delete("/subscriptions/{$empresa->asaas_unified_subscription_id}");
                } catch (\Throwable $e) {
                    // Ignore or log
                }
                $empresa->forceFill([
                    'asaas_unified_subscription_id' => null,
                ])->save();
            }
            return;
        }

        if ($empresa->asaas_unified_subscription_id) {
            try {
                $response = $this->client()
                    ->post("/subscriptions/{$empresa->asaas_unified_subscription_id}", [
                        'value' => $valorMensalConsolidado,
                    ])
                    ->throw()
                    ->json();
            } catch (\Throwable $e) {
                $response = $this->createUnifiedSubscription($empresa, $customerId, $valorMensalConsolidado);
            }
        } else {
            $response = $this->createUnifiedSubscription($empresa, $customerId, $valorMensalConsolidado);
        }

        $empresa->forceFill([
            'asaas_unified_subscription_id' => $response['id'],
        ])->save();

        $activeProducts = $empresa->produtos()
            ->where('tipo', 'recorrente_mensal')
            ->where('status', 'ativo')
            ->get();

        foreach ($activeProducts as $prod) {
            $prod->forceFill([
                'asaas_subscription_id' => $response['id'],
                'asaas_payment_id' => $response['lastPayment']['id'] ?? null,
                'asaas_invoice_url' => $response['invoiceUrl'] ?? $response['bankSlipUrl'] ?? null,
                'asaas_metadata' => $response,
                'asaas_ultima_sincronizacao_em' => now(),
            ])->save();
        }
    }

    private function createUnifiedSubscription(Empresa $empresa, string $customerId, float $valor): array
    {
        $firstRecorrente = $empresa->produtos()
            ->where('tipo', 'recorrente_mensal')
            ->where('status', 'ativo')
            ->first();

        $dueDate = $firstRecorrente
            ? $this->dueDate($firstRecorrente)
            : Carbon::now()->toDateString();

        $cycle = $firstRecorrente && $firstRecorrente->ciclo && array_key_exists($firstRecorrente->ciclo, EmpresaProduto::CICLOS)
            ? $firstRecorrente->ciclo
            : 'MONTHLY';

        return $this->client()
            ->post('/subscriptions', [
                'customer' => $customerId,
                'billingType' => config('services.asaas.default_billing_type', 'UNDEFINED'),
                'value' => $valor,
                'nextDueDate' => $dueDate,
                'cycle' => $cycle,
                'description' => "Assinatura Unificada - Sinal RH",
                'externalReference' => "empresa_consolidada:{$empresa->id}",
            ])
            ->throw()
            ->json();
    }

    public function ensureCustomer(Empresa $empresa): string
    {
        if ($empresa->asaas_customer_id) {
            return $empresa->asaas_customer_id;
        }

        $response = $this->client()
            ->post('/customers', array_filter([
                'name' => $empresa->razao_social ?: $empresa->nome_fantasia,
                'cpfCnpj' => $this->onlyDigits($empresa->cnpj),
                'email' => $empresa->email_contato,
                'mobilePhone' => $this->onlyDigits($empresa->telefone),
                'externalReference' => "empresa:{$empresa->id}",
                'notificationDisabled' => true,
            ], fn ($value) => filled($value)))
            ->throw()
            ->json();

        $empresa->forceFill([
            'asaas_customer_id' => $response['id'],
            'asaas_sincronizado_em' => now(),
        ])->save();

        return $response['id'];
    }

    public function applyWebhook(array $payload): ?EmpresaProduto
    {
        $event = $payload['event'] ?? null;
        $payment = $payload['payment'] ?? null;
        $subscription = $payload['subscription'] ?? null;

        $empresa = $this->findEmpresaPorWebhook($payment, $subscription);

        if ($empresa) {
            $isPontualConsolidado = false;
            $externalReference = $payment['externalReference'] ?? $subscription['externalReference'] ?? null;

            if (is_string($externalReference) && Str::startsWith($externalReference, 'empresa_consolidada_cobranca_unica:')) {
                $isPontualConsolidado = true;
            } else {
                if (!empty($payment['id'])) {
                    $produtoByPayment = EmpresaProduto::where('asaas_payment_id', $payment['id'])->first();
                    if ($produtoByPayment && $produtoByPayment->tipo === 'pontual') {
                        $isPontualConsolidado = true;
                    }
                }
            }

            $tipoFiltro = $isPontualConsolidado ? 'pontual' : 'recorrente_mensal';
            $produtos = $empresa->produtos()
                ->where('tipo', $tipoFiltro)
                ->where('status', '!=', 'encerrado')
                ->get();

            if ($produtos->isNotEmpty()) {
                $status = $this->statusFromEvent((string) $event);

                foreach ($produtos as $produto) {
                    $metadata = $produto->asaas_metadata ?? [];
                    $metadata['ultimo_webhook'] = [
                        'event' => $event,
                        'payment' => $payment,
                        'subscription' => $subscription,
                        'received_at' => now()->toISOString(),
                    ];

                    $updates = [
                        'asaas_metadata' => $metadata,
                        'asaas_ultima_sincronizacao_em' => now(),
                    ];

                    if (isset($payment['invoiceUrl'])) {
                        $updates['asaas_invoice_url'] = $payment['invoiceUrl'];
                    }

                    if (isset($payment['id'])) {
                        $updates['asaas_payment_id'] = $payment['id'];
                    }

                    if (!$isPontualConsolidado) {
                        if (isset($subscription['id']) || isset($payment['subscription'])) {
                            $updates['asaas_subscription_id'] = $subscription['id'] ?? $payment['subscription'];
                        }
                    } else {
                        $updates['asaas_subscription_id'] = null;
                    }

                    if ($status) {
                        $updates['status'] = $status;
                    }

                    $produto->forceFill($updates)->save();
                }

                return $produtos->first();
            }
        }

        $produto = $this->findProduto($payment, $subscription);

        if (!$produto) {
            return null;
        }

        $metadata = $produto->asaas_metadata ?? [];
        $metadata['ultimo_webhook'] = [
            'event' => $event,
            'payment' => $payment,
            'subscription' => $subscription,
            'received_at' => now()->toISOString(),
        ];

        $updates = [
            'asaas_metadata' => $metadata,
            'asaas_ultima_sincronizacao_em' => now(),
        ];

        if (isset($payment['invoiceUrl'])) {
            $updates['asaas_invoice_url'] = $payment['invoiceUrl'];
        }

        if (isset($payment['id']) && !$produto->asaas_payment_id) {
            $updates['asaas_payment_id'] = $payment['id'];
        }

        if (isset($subscription['id']) && !$produto->asaas_subscription_id) {
            $updates['asaas_subscription_id'] = $subscription['id'];
        }

        $status = $this->statusFromEvent((string) $event);
        if ($status) {
            $updates['status'] = $status;
        }

        $produto->forceFill($updates)->save();

        return $produto->fresh();
    }

    private function findEmpresaPorWebhook(?array $payment, ?array $subscription): ?Empresa
    {
        $externalReference = $payment['externalReference'] ?? $subscription['externalReference'] ?? null;

        if (is_string($externalReference)) {
            if (Str::startsWith($externalReference, 'empresa_consolidada_cobranca_unica:')) {
                return Empresa::find((int) Str::after($externalReference, 'empresa_consolidada_cobranca_unica:'));
            }
            if (Str::startsWith($externalReference, 'empresa_consolidada:')) {
                return Empresa::find((int) Str::after($externalReference, 'empresa_consolidada:'));
            }
        }

        $subscriptionId = $subscription['id'] ?? $payment['subscription'] ?? null;
        if ($subscriptionId) {
            $empresa = Empresa::where('asaas_unified_subscription_id', $subscriptionId)->first();
            if ($empresa) {
                return $empresa;
            }
        }

        $customerId = $payment['customer'] ?? $subscription['customer'] ?? null;
        if ($customerId) {
            $empresa = Empresa::where('asaas_customer_id', $customerId)->first();
            if ($empresa) {
                return $empresa;
            }
        }

        return null;
    }

    private function createPayment(EmpresaProduto $produto, string $customerId): array
    {
        return $this->client()
            ->post('/payments', [
                'customer' => $customerId,
                'billingType' => config('services.asaas.default_billing_type', 'UNDEFINED'),
                'value' => $this->paymentValue($produto),
                'dueDate' => $this->dueDate($produto),
                'description' => $produto->titulo,
                'externalReference' => "empresa_produto:{$produto->id}",
            ])
            ->throw()
            ->json();
    }

    private function createSubscription(EmpresaProduto $produto, string $customerId): array
    {
        $ciclo = $produto->ciclo && array_key_exists($produto->ciclo, EmpresaProduto::CICLOS)
            ? $produto->ciclo
            : 'MONTHLY';

        return $this->client()
            ->post('/subscriptions', [
                'customer' => $customerId,
                'billingType' => config('services.asaas.default_billing_type', 'UNDEFINED'),
                'value' => $this->paymentValue($produto),
                'nextDueDate' => $this->dueDate($produto),
                'cycle' => $ciclo,
                'description' => $produto->titulo,
                'externalReference' => "empresa_produto:{$produto->id}",
            ])
            ->throw()
            ->json();
    }

    private function paymentValue(EmpresaProduto $produto): float
    {
        if ($produto->tipo === 'recorrente_mensal') {
            return (float) $produto->valor_mensal;
        }

        // TODO (decisao de negocio da Sara):
        // Hoje o Diagnostico vira UMA cobranca anual (R$ valor_unitario x colab x aplicacoes).
        // Para virar 2 cobrancas semestrais separadas, mudar para Subscription com
        // ciclo SEMIANNUALLY e endDate apos 2 ciclos. Infra ja preparada (campo `ciclo`).
        $colaboradoresAtivos = $produto->empresa->colaboradores()->where('status', 'ativo')->count();
        $value = $produto->valorProjetadoAnual($colaboradoresAtivos) ?? $produto->valor_unitario;

        return (float) $value;
    }

    private function dueDate(EmpresaProduto $produto): string
    {
        $date = $produto->proxima_cobranca_em ?? $produto->data_inicio ?? Carbon::now();

        return Carbon::parse($date)->toDateString();
    }

    private function findProduto(?array $payment, ?array $subscription): ?EmpresaProduto
    {
        $externalReference = $payment['externalReference'] ?? $subscription['externalReference'] ?? null;

        if (is_string($externalReference) && Str::startsWith($externalReference, 'empresa_produto:')) {
            return EmpresaProduto::find((int) Str::after($externalReference, 'empresa_produto:'));
        }

        if (!empty($payment['id'])) {
            $produto = EmpresaProduto::where('asaas_payment_id', $payment['id'])->first();
            if ($produto) {
                return $produto;
            }
        }

        if (!empty($subscription['id'])) {
            return EmpresaProduto::where('asaas_subscription_id', $subscription['id'])->first();
        }

        return null;
    }

    private function statusFromEvent(string $event): ?string
    {
        return match ($event) {
            'PAYMENT_RECEIVED',
            'PAYMENT_CONFIRMED',
            'PAYMENT_RESTORED',
            'SUBSCRIPTION_CREATED',
            'SUBSCRIPTION_UPDATED' => 'ativo',
            'PAYMENT_OVERDUE' => 'inadimplente',
            'PAYMENT_DELETED',
            'PAYMENT_REFUNDED',
            'PAYMENT_REFUND_DENIED',
            'PAYMENT_CHARGEBACK_REQUESTED',
            'PAYMENT_CHARGEBACK_DISPUTE',
            'PAYMENT_AWAITING_CHARGEBACK_REVERSAL' => 'pausado',
            'SUBSCRIPTION_DELETED' => 'encerrado',
            default => null,
        };
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) config('services.asaas.base_url'), '/'))
            ->acceptJson()
            ->asJson()
            ->timeout((int) config('services.asaas.timeout', 15))
            ->withHeaders([
                'access_token' => config('services.asaas.api_key'),
            ]);
    }

    private function onlyDigits(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        return preg_replace('/\D+/', '', $value) ?: null;
    }
}
