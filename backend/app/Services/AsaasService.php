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

    /**
     * Sincroniza as cobranças do produto no Asaas, por produto:
     *  - tipo unica/ambas  => Payment (valor_unico)
     *  - tipo recorrente/ambas => Subscription (valor_mensal + ciclo)
     * Tudo vinculado ao customer_id da empresa. Cancela o que não se aplica mais.
     */
    public function syncProduto(EmpresaProduto $produto): EmpresaProduto
    {
        if (!$this->enabled()) {
            return $produto;
        }

        $produto->loadMissing('empresa');

        $ativo          = $produto->status === 'ativo';
        $querUnica      = $ativo && in_array($produto->tipo, ['unica', 'ambas'], true) && (float) $produto->valor_unico > 0;
        $querRecorrente = $ativo && in_array($produto->tipo, ['recorrente', 'ambas'], true) && (float) $produto->valor_mensal > 0;

        // Só garante o cliente no Asaas quando há cobrança a criar (evita cliente
        // duplicado ao conceder produtos sem valor no cadastro).
        $customerId = ($querUnica || $querRecorrente) ? $this->ensureCustomer($produto->empresa) : null;

        $updates = ['asaas_ultima_sincronizacao_em' => now()];
        $invoiceUrl = null;

        // ── Cobrança única (Payment) ─────────────────────────────────────
        if ($querUnica) {
            $resp = $produto->asaas_payment_id
                ? $this->updatePayment($produto, $customerId)
                : $this->createPayment($produto, $customerId);
            if ($resp) {
                $updates['asaas_payment_id'] = $resp['id'] ?? $produto->asaas_payment_id;
                $invoiceUrl = $resp['invoiceUrl'] ?? $resp['bankSlipUrl'] ?? null;
            }
        } elseif ($produto->asaas_payment_id) {
            $this->deletePayment($produto->asaas_payment_id);
            $updates['asaas_payment_id'] = null;
        }

        // ── Cobrança recorrente (Subscription) ───────────────────────────
        if ($querRecorrente) {
            $resp = $produto->asaas_subscription_id
                ? $this->updateSubscription($produto, $customerId)
                : $this->createSubscription($produto, $customerId);
            if ($resp) {
                $updates['asaas_subscription_id'] = $resp['id'] ?? $produto->asaas_subscription_id;
                $invoiceUrl = $invoiceUrl ?? ($resp['invoiceUrl'] ?? $resp['bankSlipUrl'] ?? null);
            }
        } elseif ($produto->asaas_subscription_id) {
            $this->deleteSubscription($produto->asaas_subscription_id);
            $updates['asaas_subscription_id'] = null;
        }

        if ($invoiceUrl) {
            $updates['asaas_invoice_url'] = $invoiceUrl;
        }

        $produto->forceFill($updates)->save();

        return $produto->fresh();
    }

    /**
     * Cancela todas as cobranças do produto no Asaas (usar ao remover/encerrar).
     */
    public function removerCobrancas(EmpresaProduto $produto): void
    {
        if (!$this->enabled()) {
            return;
        }

        if ($produto->asaas_payment_id) {
            $this->deletePayment($produto->asaas_payment_id);
        }
        if ($produto->asaas_subscription_id) {
            $this->deleteSubscription($produto->asaas_subscription_id);
        }

        $produto->forceFill([
            'asaas_payment_id'              => null,
            'asaas_subscription_id'         => null,
            'asaas_invoice_url'             => null,
            'asaas_ultima_sincronizacao_em' => now(),
        ])->save();
    }

    public function ensureCustomer(Empresa $empresa): string
    {
        if ($empresa->asaas_customer_id) {
            return $empresa->asaas_customer_id;
        }

        $response = $this->client()
            ->post('/customers', array_filter([
                'name'                 => $empresa->razao_social ?: $empresa->nome_fantasia,
                'cpfCnpj'              => $this->onlyDigits($empresa->cnpj),
                'email'                => $empresa->email_contato,
                'mobilePhone'          => $this->onlyDigits($empresa->telefone),
                'externalReference'    => "empresa:{$empresa->id}",
                'notificationDisabled' => true,
            ], fn ($value) => filled($value)))
            ->throw()
            ->json();

        $empresa->forceFill([
            'asaas_customer_id'     => $response['id'],
            'asaas_sincronizado_em' => now(),
        ])->save();

        return $response['id'];
    }

    /**
     * Aplica um evento de webhook a UM produto (identificado por externalReference
     * empresa_produto:{id}, ou pelo payment/subscription id).
     */
    public function applyWebhook(array $payload): ?EmpresaProduto
    {
        $event        = $payload['event'] ?? null;
        $payment      = $payload['payment'] ?? null;
        $subscription = $payload['subscription'] ?? null;

        $produto = $this->findProduto($payment, $subscription);
        if (!$produto) {
            return null;
        }

        $metadata = $produto->asaas_metadata ?? [];
        $metadata['ultimo_webhook'] = [
            'event'        => $event,
            'payment'      => $payment,
            'subscription' => $subscription,
            'received_at'  => now()->toISOString(),
        ];

        $updates = [
            'asaas_metadata'                => $metadata,
            'asaas_ultima_sincronizacao_em' => now(),
        ];

        if (isset($payment['invoiceUrl'])) {
            $updates['asaas_invoice_url'] = $payment['invoiceUrl'];
        }
        if (isset($payment['id']) && !$produto->asaas_payment_id) {
            $updates['asaas_payment_id'] = $payment['id'];
        }
        $subId = $subscription['id'] ?? $payment['subscription'] ?? null;
        if ($subId && !$produto->asaas_subscription_id) {
            $updates['asaas_subscription_id'] = $subId;
        }

        $status = $this->statusFromEvent((string) $event);
        if ($status) {
            $updates['status'] = $status;
        }

        $produto->forceFill($updates)->save();

        return $produto->fresh();
    }

    private function findProduto(?array $payment, ?array $subscription): ?EmpresaProduto
    {
        $externalReference = $payment['externalReference'] ?? $subscription['externalReference'] ?? null;

        if (is_string($externalReference) && Str::startsWith($externalReference, 'empresa_produto:')) {
            $produto = EmpresaProduto::find((int) Str::after($externalReference, 'empresa_produto:'));
            if ($produto) {
                return $produto;
            }
        }

        if (!empty($payment['id'])) {
            $produto = EmpresaProduto::where('asaas_payment_id', $payment['id'])->first();
            if ($produto) {
                return $produto;
            }
        }

        $subId = $subscription['id'] ?? $payment['subscription'] ?? null;
        if ($subId) {
            return EmpresaProduto::where('asaas_subscription_id', $subId)->first();
        }

        return null;
    }

    // ── Payments (cobrança única) ────────────────────────────────────────
    private function createPayment(EmpresaProduto $produto, string $customerId): ?array
    {
        return $this->client()
            ->post('/payments', [
                'customer'          => $customerId,
                'billingType'       => config('services.asaas.default_billing_type', 'UNDEFINED'),
                'value'             => (float) $produto->valor_unico,
                'dueDate'           => $this->dueDate($produto),
                'description'       => $produto->titulo . ' (cobrança única)',
                'externalReference' => "empresa_produto:{$produto->id}",
            ])
            ->throw()
            ->json();
    }

    private function updatePayment(EmpresaProduto $produto, string $customerId): ?array
    {
        try {
            return $this->client()
                ->post("/payments/{$produto->asaas_payment_id}", [
                    'value'   => (float) $produto->valor_unico,
                    'dueDate' => $this->dueDate($produto),
                ])
                ->throw()
                ->json();
        } catch (\Throwable $e) {
            // Cobrança provavelmente já paga / não editável — recria.
            return $this->createPayment($produto, $customerId);
        }
    }

    private function deletePayment(string $id): void
    {
        try {
            $this->client()->delete("/payments/{$id}");
        } catch (\Throwable $e) {
            // Ignora (pode já ter sido removida no Asaas).
        }
    }

    // ── Subscriptions (recorrente) ───────────────────────────────────────
    private function createSubscription(EmpresaProduto $produto, string $customerId): ?array
    {
        return $this->client()
            ->post('/subscriptions', [
                'customer'          => $customerId,
                'billingType'       => config('services.asaas.default_billing_type', 'UNDEFINED'),
                'value'             => (float) $produto->valor_mensal,
                'nextDueDate'       => $this->dueDate($produto),
                'cycle'             => $this->ciclo($produto),
                'description'       => $produto->titulo . ' (recorrente)',
                'externalReference' => "empresa_produto:{$produto->id}",
            ])
            ->throw()
            ->json();
    }

    private function updateSubscription(EmpresaProduto $produto, string $customerId): ?array
    {
        try {
            return $this->client()
                ->post("/subscriptions/{$produto->asaas_subscription_id}", [
                    'value' => (float) $produto->valor_mensal,
                    'cycle' => $this->ciclo($produto),
                ])
                ->throw()
                ->json();
        } catch (\Throwable $e) {
            return $this->createSubscription($produto, $customerId);
        }
    }

    private function deleteSubscription(string $id): void
    {
        try {
            $this->client()->delete("/subscriptions/{$id}");
        } catch (\Throwable $e) {
            // Ignora.
        }
    }

    private function ciclo(EmpresaProduto $produto): string
    {
        return $produto->ciclo && array_key_exists($produto->ciclo, EmpresaProduto::CICLOS)
            ? $produto->ciclo
            : 'MONTHLY';
    }

    private function dueDate(EmpresaProduto $produto): string
    {
        $date = $produto->proxima_cobranca_em ?? $produto->data_inicio ?? Carbon::now();

        return Carbon::parse($date)->toDateString();
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
