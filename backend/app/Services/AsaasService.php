<?php

namespace App\Services;

use App\Models\Cobranca;
use App\Models\Empresa;
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
     * Sincroniza UMA cobrança avulsa (atrelada à empresa) no Asaas:
     *  - tipo unica      => Payment
     *  - tipo recorrente => Subscription
     * externalReference = cobranca:{id}. Cancela se status = cancelada.
     */
    public function syncCobranca(Cobranca $cobranca): Cobranca
    {
        if (!$this->enabled()) {
            return $cobranca;
        }

        $cobranca->loadMissing('empresa');

        if ($cobranca->status === 'cancelada') {
            $this->removerCobranca($cobranca);
            return $cobranca->fresh();
        }

        $customerId = $this->ensureCustomer($cobranca->empresa);
        $updates = ['asaas_ultima_sincronizacao_em' => now()];

        if ($cobranca->tipo === 'unica') {
            $resp = $cobranca->asaas_payment_id
                ? $this->updatePayment($cobranca, $customerId)
                : $this->createPayment($cobranca, $customerId);
            if ($resp) {
                $updates['asaas_payment_id'] = $resp['id'] ?? $cobranca->asaas_payment_id;
                $updates['asaas_invoice_url'] = $resp['invoiceUrl'] ?? $resp['bankSlipUrl'] ?? $cobranca->asaas_invoice_url;
            }
        } else {
            $resp = $cobranca->asaas_subscription_id
                ? $this->updateSubscription($cobranca, $customerId)
                : $this->createSubscription($cobranca, $customerId);
            if ($resp) {
                $updates['asaas_subscription_id'] = $resp['id'] ?? $cobranca->asaas_subscription_id;
                $updates['asaas_invoice_url'] = $resp['invoiceUrl'] ?? $resp['bankSlipUrl'] ?? $cobranca->asaas_invoice_url;
            }
        }

        $cobranca->forceFill($updates)->save();

        return $cobranca->fresh();
    }

    public function removerCobranca(Cobranca $cobranca): void
    {
        if (!$this->enabled()) {
            return;
        }

        if ($cobranca->asaas_payment_id) {
            $this->deletePayment($cobranca->asaas_payment_id);
        }
        if ($cobranca->asaas_subscription_id) {
            $this->deleteSubscription($cobranca->asaas_subscription_id);
        }

        $cobranca->forceFill([
            'asaas_payment_id'              => null,
            'asaas_subscription_id'         => null,
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

    public function applyWebhook(array $payload): ?Cobranca
    {
        $event        = $payload['event'] ?? null;
        $payment      = $payload['payment'] ?? null;
        $subscription = $payload['subscription'] ?? null;

        $cobranca = $this->findCobranca($payment, $subscription);
        if (!$cobranca) {
            return null;
        }

        $metadata = $cobranca->asaas_metadata ?? [];
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
        if (isset($payment['id']) && !$cobranca->asaas_payment_id) {
            $updates['asaas_payment_id'] = $payment['id'];
        }
        $subId = $subscription['id'] ?? $payment['subscription'] ?? null;
        if ($subId && !$cobranca->asaas_subscription_id) {
            $updates['asaas_subscription_id'] = $subId;
        }

        $status = $this->statusFromEvent($cobranca, (string) $event);
        if ($status) {
            $updates['status'] = $status;
        }

        $cobranca->forceFill($updates)->save();

        return $cobranca->fresh();
    }

    private function findCobranca(?array $payment, ?array $subscription): ?Cobranca
    {
        $externalReference = $payment['externalReference'] ?? $subscription['externalReference'] ?? null;

        if (is_string($externalReference) && Str::startsWith($externalReference, 'cobranca:')) {
            $cobranca = Cobranca::find((int) Str::after($externalReference, 'cobranca:'));
            if ($cobranca) {
                return $cobranca;
            }
        }

        if (!empty($payment['id'])) {
            $cobranca = Cobranca::where('asaas_payment_id', $payment['id'])->first();
            if ($cobranca) {
                return $cobranca;
            }
        }

        $subId = $subscription['id'] ?? $payment['subscription'] ?? null;
        if ($subId) {
            return Cobranca::where('asaas_subscription_id', $subId)->first();
        }

        return null;
    }

    // ── Payments (cobrança única) ────────────────────────────────────────
    private function createPayment(Cobranca $cobranca, string $customerId): ?array
    {
        return $this->client()
            ->post('/payments', [
                'customer'          => $customerId,
                'billingType'       => $cobranca->billing_type ?: 'UNDEFINED',
                'value'             => (float) $cobranca->valor,
                'dueDate'           => $this->dueDate($cobranca),
                'description'       => $cobranca->descricao,
                'externalReference' => "cobranca:{$cobranca->id}",
            ])
            ->throw()
            ->json();
    }

    private function updatePayment(Cobranca $cobranca, string $customerId): ?array
    {
        try {
            return $this->client()
                ->post("/payments/{$cobranca->asaas_payment_id}", [
                    'value'   => (float) $cobranca->valor,
                    'dueDate' => $this->dueDate($cobranca),
                ])
                ->throw()
                ->json();
        } catch (\Throwable $e) {
            return $this->createPayment($cobranca, $customerId);
        }
    }

    private function deletePayment(string $id): void
    {
        try {
            $this->client()->delete("/payments/{$id}");
        } catch (\Throwable $e) {
            // Ignora.
        }
    }

    // ── Subscriptions (recorrente) ───────────────────────────────────────
    private function createSubscription(Cobranca $cobranca, string $customerId): ?array
    {
        return $this->client()
            ->post('/subscriptions', [
                'customer'          => $customerId,
                'billingType'       => $cobranca->billing_type ?: 'UNDEFINED',
                'value'             => (float) $cobranca->valor,
                'nextDueDate'       => $this->dueDate($cobranca),
                'cycle'             => $this->ciclo($cobranca),
                'description'       => $cobranca->descricao,
                'externalReference' => "cobranca:{$cobranca->id}",
            ])
            ->throw()
            ->json();
    }

    private function updateSubscription(Cobranca $cobranca, string $customerId): ?array
    {
        try {
            return $this->client()
                ->post("/subscriptions/{$cobranca->asaas_subscription_id}", [
                    'value' => (float) $cobranca->valor,
                    'cycle' => $this->ciclo($cobranca),
                ])
                ->throw()
                ->json();
        } catch (\Throwable $e) {
            return $this->createSubscription($cobranca, $customerId);
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

    private function ciclo(Cobranca $cobranca): string
    {
        return $cobranca->ciclo && array_key_exists($cobranca->ciclo, Cobranca::CICLOS)
            ? $cobranca->ciclo
            : 'MONTHLY';
    }

    private function dueDate(Cobranca $cobranca): string
    {
        $date = $cobranca->vencimento ?? Carbon::now();

        return Carbon::parse($date)->toDateString();
    }

    private function statusFromEvent(Cobranca $cobranca, string $event): ?string
    {
        return match ($event) {
            'PAYMENT_RECEIVED',
            'PAYMENT_CONFIRMED',
            'PAYMENT_RESTORED' => $cobranca->tipo === 'unica' ? 'paga' : 'ativa',
            'SUBSCRIPTION_CREATED',
            'SUBSCRIPTION_UPDATED' => 'ativa',
            'PAYMENT_OVERDUE' => 'atrasada',
            'PAYMENT_DELETED',
            'PAYMENT_REFUNDED',
            'SUBSCRIPTION_DELETED' => 'cancelada',
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
