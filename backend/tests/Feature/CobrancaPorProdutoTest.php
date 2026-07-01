<?php

use App\Models\EmpresaProduto;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

function asaasOn(): void
{
    config([
        'services.asaas.enabled'  => true,
        'services.asaas.api_key'  => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
        'services.asaas.default_billing_type' => 'UNDEFINED',
    ]);
}

it('cobranca unica cria um Payment com valor_unico', function () {
    asaasOn();
    Http::fake([
        'sandbox.asaas.com/api/v3/customers' => Http::response(['id' => 'cus_u'], 200),
        'sandbox.asaas.com/api/v3/payments'  => Http::response(['id' => 'pay_u', 'invoiceUrl' => 'https://sandbox.asaas.com/i/pay_u'], 200),
    ]);

    $empresa = criarEmpresa();
    Sanctum::actingAs(criarSuperAdmin(), ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'     => 'diagnostico_nr1',
        'tipo'        => 'unica',
        'valor_unico' => 2000.00,
        'data_inicio' => '2026-06-01',
    ])->assertCreated()
      ->assertJsonPath('data.asaas_payment_id', 'pay_u')
      ->assertJsonPath('data.asaas_subscription_id', null);

    Http::assertSent(fn ($req) => str_contains($req->url(), '/payments') && (float) $req['value'] === 2000.00);
});

it('cobranca recorrente cria uma Subscription com valor_mensal', function () {
    asaasOn();
    Http::fake([
        'sandbox.asaas.com/api/v3/customers'     => Http::response(['id' => 'cus_r'], 200),
        'sandbox.asaas.com/api/v3/subscriptions' => Http::response(['id' => 'sub_r', 'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_r'], 200),
    ]);

    $empresa = criarEmpresa();
    Sanctum::actingAs(criarSuperAdmin(), ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'plano_acao_nr1',
        'tipo'         => 'recorrente',
        'valor_mensal' => 500.00,
        'data_inicio'  => '2026-06-01',
    ])->assertCreated()
      ->assertJsonPath('data.asaas_subscription_id', 'sub_r')
      ->assertJsonPath('data.asaas_payment_id', null);

    Http::assertSent(fn ($req) => str_contains($req->url(), '/subscriptions') && (float) $req['value'] === 500.00);
});

it('cobranca ambas cria Payment e Subscription no mesmo produto', function () {
    asaasOn();
    Http::fake([
        'sandbox.asaas.com/api/v3/customers'     => Http::response(['id' => 'cus_a'], 200),
        'sandbox.asaas.com/api/v3/payments'      => Http::response(['id' => 'pay_a', 'invoiceUrl' => 'https://sandbox.asaas.com/i/pay_a'], 200),
        'sandbox.asaas.com/api/v3/subscriptions' => Http::response(['id' => 'sub_a', 'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_a'], 200),
    ]);

    $empresa = criarEmpresa();
    Sanctum::actingAs(criarSuperAdmin(), ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'plano_acao_nr1',
        'tipo'         => 'ambas',
        'valor_unico'  => 2000.00,
        'valor_mensal' => 500.00,
        'data_inicio'  => '2026-06-01',
    ])->assertCreated()
      ->assertJsonPath('data.asaas_payment_id', 'pay_a')
      ->assertJsonPath('data.asaas_subscription_id', 'sub_a');

    Http::assertSent(fn ($req) => str_contains($req->url(), '/payments') && (float) $req['value'] === 2000.00);
    Http::assertSent(fn ($req) => str_contains($req->url(), '/subscriptions') && (float) $req['value'] === 500.00);
});

it('remover produto cancela as cobrancas no Asaas', function () {
    asaasOn();
    Http::fake([
        'sandbox.asaas.com/api/v3/payments/pay_del'      => Http::response([], 200),
        'sandbox.asaas.com/api/v3/subscriptions/sub_del' => Http::response([], 200),
    ]);

    $empresa = criarEmpresa();
    $produto = EmpresaProduto::create([
        'empresa_id'            => $empresa->id,
        'produto'               => 'plano_acao_nr1',
        'tipo'                  => 'ambas',
        'valor_unico'           => 1000,
        'valor_mensal'          => 300,
        'data_inicio'           => '2026-06-01',
        'status'                => 'ativo',
        'asaas_payment_id'      => 'pay_del',
        'asaas_subscription_id' => 'sub_del',
    ]);

    Sanctum::actingAs(criarSuperAdmin(), ['role:super_admin']);

    $this->deleteJson("/api/plataforma/empresas/{$empresa->id}/produtos/{$produto->id}")->assertOk();

    expect(EmpresaProduto::count())->toBe(0);
    Http::assertSent(fn ($req) => str_contains($req->url(), '/payments/pay_del') && $req->method() === 'DELETE');
    Http::assertSent(fn ($req) => str_contains($req->url(), '/subscriptions/sub_del') && $req->method() === 'DELETE');
});
