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

        $customerId = $this->ensureCustomer($produto->empresa);
        $response = $produto->tipo === 'recorrente_mensal'
            ? $this->createSubscription($produto, $customerId)
            : $this->createPayment($produto, $customerId);

        $produto->forceFill([
            'asaas_subscription_id' => $produto->tipo === 'recorrente_mensal' ? ($response['id'] ?? null) : null,
            'asaas_payment_id' => $produto->tipo === 'pontual' ? ($response['id'] ?? null) : ($response['lastPayment']['id'] ?? null),
            'asaas_invoice_url' => $response['invoiceUrl'] ?? $response['bankSlipUrl'] ?? null,
            'asaas_metadata' => $response,
            'asaas_ultima_sincronizacao_em' => now(),
        ])->save();

        return $produto->fresh();
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
        return $this->client()
            ->post('/subscriptions', [
                'customer' => $customerId,
                'billingType' => config('services.asaas.default_billing_type', 'UNDEFINED'),
                'value' => $this->paymentValue($produto),
                'nextDueDate' => $this->dueDate($produto),
                'cycle' => 'MONTHLY',
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
