<?php

/*
 * Cobrancas AVULSAS atreladas a EMPRESA (customer Asaas), desacopladas de produto.
 * (Arquivo mantido com nome legado CobrancaPorProdutoTest.php — pode ser renomeado
 *  para CobrancaEmpresaTest.php via git; o conteudo ja e o novo modelo.)
 */

use App\Models\Auditoria;
use App\Models\Cobranca;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

function asaasOn(): void
{
    config([
        'services.asaas.enabled'  => true,
        'services.asaas.api_key'  => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
    ]);
}

it('cobranca unica cria um Payment', function () {
    asaasOn();
    Http::fake([
        'sandbox.asaas.com/api/v3/customers' => Http::response(['id' => 'cus_u'], 200),
        'sandbox.asaas.com/api/v3/payments'  => Http::response(['id' => 'pay_u', 'invoiceUrl' => 'https://sandbox.asaas.com/i/pay_u'], 200),
    ]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();
    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/cobrancas", [
        'tipo'         => 'unica',
        'descricao'    => 'Diagnostico NR-1 (setup)',
        'valor'        => 2000.00,
        'billing_type' => 'BOLETO',
        'vencimento'   => '2026-07-15',
    ])->assertCreated()
      ->assertJsonPath('data.asaas_payment_id', 'pay_u')
      ->assertJsonPath('data.asaas_subscription_id', null)
      ->assertJsonPath('data.asaas_invoice_url', 'https://sandbox.asaas.com/i/pay_u');

    expect(Cobranca::count())->toBe(1)
        ->and(Auditoria::where('acao', 'plataforma.cobranca.criar')->exists())->toBeTrue();
});

it('cobranca recorrente cria uma Subscription com ciclo', function () {
    asaasOn();
    Http::fake([
        'sandbox.asaas.com/api/v3/customers'     => Http::response(['id' => 'cus_r'], 200),
        'sandbox.asaas.com/api/v3/subscriptions' => Http::response(['id' => 'sub_r', 'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_r'], 200),
    ]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();
    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/cobrancas", [
        'tipo'         => 'recorrente',
        'descricao'    => 'Plano de Acao NR-1',
        'valor'        => 500.00,
        'ciclo'        => 'QUARTERLY',
        'billing_type' => 'BOLETO',
        'vencimento'   => '2026-07-15',
    ])->assertCreated()
      ->assertJsonPath('data.asaas_subscription_id', 'sub_r')
      ->assertJsonPath('data.asaas_payment_id', null);

    Http::assertSent(function ($request) {
        return str_contains($request->url(), '/subscriptions')
            && $request->data()['cycle'] === 'QUARTERLY';
    });
});

it('cancelar cobranca remove Payment e Subscription no Asaas', function () {
    asaasOn();
    Http::fake([
        'sandbox.asaas.com/api/v3/payments/pay_del'      => Http::response([], 200),
        'sandbox.asaas.com/api/v3/subscriptions/sub_del' => Http::response([], 200),
    ]);

    $empresa = criarEmpresa(['asaas_customer_id' => 'cus_x']);
    $sa = criarSuperAdmin();

    $cobranca = Cobranca::create([
        'empresa_id'            => $empresa->id,
        'tipo'                  => 'recorrente',
        'descricao'             => 'Assinatura a cancelar',
        'valor'                 => 300,
        'ciclo'                 => 'MONTHLY',
        'status'                => 'ativa',
        'asaas_payment_id'      => 'pay_del',
        'asaas_subscription_id' => 'sub_del',
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->deleteJson("/api/plataforma/empresas/{$empresa->id}/cobrancas/{$cobranca->id}")
        ->assertOk();

    expect(Cobranca::count())->toBe(0);

    Http::assertSent(fn ($r) => str_contains($r->url(), '/payments/pay_del') && $r->method() === 'DELETE');
    Http::assertSent(fn ($r) => str_contains($r->url(), '/subscriptions/sub_del') && $r->method() === 'DELETE');
});

it('nao chama Asaas ao criar cobranca quando integracao esta desligada', function () {
    config(['services.asaas.enabled' => false]);
    Http::fake();

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();
    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/cobrancas", [
        'tipo'      => 'recorrente',
        'descricao' => 'Sem integracao',
        'valor'     => 900,
    ])->assertCreated()
      ->assertJsonPath('data.asaas_subscription_id', null);

    Http::assertNothingSent();
});

it('endpoint sincronizar-asaas cria a cobranca no Asaas', function () {
    asaasOn();

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    $cobranca = Cobranca::create([
        'empresa_id' => $empresa->id,
        'tipo'       => 'recorrente',
        'descricao'  => 'Assinatura pendente',
        'valor'      => 1500,
        'ciclo'      => 'MONTHLY',
        'status'     => 'pendente',
    ]);

    Http::fake([
        'sandbox.asaas.com/api/v3/customers'     => Http::response(['id' => 'cus_resync'], 200),
        'sandbox.asaas.com/api/v3/subscriptions' => Http::response(['id' => 'sub_resync', 'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_resync'], 200),
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/cobrancas/{$cobranca->id}/sincronizar-asaas")
        ->assertOk()
        ->assertJsonPath('data.asaas_subscription_id', 'sub_resync')
        ->assertJsonPath('data.asaas_invoice_url', 'https://sandbox.asaas.com/i/sub_resync');

    expect(Auditoria::where('acao', 'plataforma.cobranca.sincronizar_asaas')->exists())->toBeTrue();
});

it('sincronizar-asaas retorna 422 quando kill switch esta ligado', function () {
    config(['services.asaas.enabled' => false]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    $cobranca = Cobranca::create([
        'empresa_id' => $empresa->id,
        'tipo'       => 'recorrente',
        'descricao'  => 'X',
        'valor'      => 100,
        'status'     => 'pendente',
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/cobrancas/{$cobranca->id}/sincronizar-asaas")
        ->assertStatus(422);
});

it('webhook PAYMENT_RECEIVED marca cobranca unica como paga', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $empresa = criarEmpresa();
    $cobranca = Cobranca::create([
        'empresa_id'       => $empresa->id,
        'tipo'             => 'unica',
        'descricao'        => 'Setup',
        'valor'            => 2000,
        'status'           => 'pendente',
        'asaas_payment_id' => 'pay_123',
    ]);

    $this->postJson('/api/webhooks/asaas', [
        'event' => 'PAYMENT_RECEIVED',
        'payment' => [
            'id'                => 'pay_123',
            'externalReference' => "cobranca:{$cobranca->id}",
            'invoiceUrl'        => 'https://sandbox.asaas.com/i/pay_123',
        ],
    ], ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('processed', true);

    expect($cobranca->fresh()->status)->toBe('paga')
        ->and($cobranca->fresh()->asaas_invoice_url)->toBe('https://sandbox.asaas.com/i/pay_123');
});

it('webhook PAYMENT_OVERDUE marca cobranca como atrasada', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $empresa = criarEmpresa();
    $cobranca = Cobranca::create([
        'empresa_id'            => $empresa->id,
        'tipo'                  => 'recorrente',
        'descricao'             => 'Mensal',
        'valor'                 => 500,
        'ciclo'                 => 'MONTHLY',
        'status'                => 'ativa',
        'asaas_subscription_id' => 'sub_123',
    ]);

    $this->postJson('/api/webhooks/asaas', [
        'event' => 'PAYMENT_OVERDUE',
        'payment' => [
            'id'                => 'pay_over',
            'subscription'      => 'sub_123',
            'externalReference' => "cobranca:{$cobranca->id}",
        ],
    ], ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('processed', true);

    expect($cobranca->fresh()->status)->toBe('atrasada');
});
