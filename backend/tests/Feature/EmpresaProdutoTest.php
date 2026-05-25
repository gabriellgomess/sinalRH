<?php

use App\Jobs\SincronizarProdutoAsaasJob;
use App\Models\Auditoria;
use App\Models\EmpresaProduto;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('lista catalogo vazio para empresa sem produtos', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->getJson("/api/plataforma/empresas/{$empresa->id}/produtos")
        ->assertOk()
        ->assertJsonCount(0, 'data.produtos')
        ->assertJsonStructure(['data' => ['produtos', 'colaboradores_ativos', 'catalogo']]);
});

it('contrata Diagnostico NR-1 pontual com valor unitario', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $resp = $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'                => 'diagnostico_nr1',
        'tipo'                   => 'pontual',
        'valor_unitario'         => 30.00,
        'quantidade_aplicacoes'  => 2,
        'data_inicio'            => '2026-06-01',
        'numero_contrato'        => 'SLC-2026-001',
    ])->assertCreated()
      ->assertJsonPath('data.produto', 'diagnostico_nr1')
      ->assertJsonPath('data.tipo', 'pontual')
      ->assertJsonPath('data.quantidade_aplicacoes', 2);

    expect(EmpresaProduto::count())->toBe(1)
        ->and(Auditoria::where('acao', 'plataforma.produto.contratar')->exists())->toBeTrue();
});

it('contrata Plano de Acao recorrente mensal', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'plano_acao_nr1',
        'tipo'         => 'recorrente_mensal',
        'valor_mensal' => 2500.00,
        'data_inicio'  => '2026-06-01',
    ])->assertCreated()
      ->assertJsonPath('data.tipo', 'recorrente_mensal')
      ->assertJsonPath('data.valor_mensal', '2500.00');
});

it('gera numero de contrato automaticamente e sequencialmente', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $res1 = $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'plano_acao_nr1',
        'tipo'         => 'recorrente_mensal',
        'valor_mensal' => 1000.00,
        'data_inicio'  => '2026-06-01',
    ])->assertCreated();

    $res2 = $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'canal_escuta',
        'tipo'         => 'recorrente_mensal',
        'valor_mensal' => 500.00,
        'data_inicio'  => '2026-06-01',
    ])->assertCreated();

    expect($res1->json('data.numero_contrato'))->toBe('SLC-2026-001')
        ->and($res2->json('data.numero_contrato'))->toBe('SLC-2026-002');
});

it('altera status de contrato (ativo -> pausado)', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    $produto = EmpresaProduto::create([
        'empresa_id'    => $empresa->id,
        'produto'       => 'diagnostico_nr1',
        'tipo'          => 'pontual',
        'valor_unitario'=> 30,
        'data_inicio'   => '2026-01-01',
        'status'        => 'ativo',
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->putJson("/api/plataforma/empresas/{$empresa->id}/produtos/{$produto->id}", [
        'status' => 'pausado',
    ])->assertOk()
      ->assertJsonPath('data.status', 'pausado');

    expect(Auditoria::where('acao', 'plataforma.produto.atualizar')->exists())->toBeTrue();
});

it('remove contrato', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    $produto = EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'canal_escuta',
        'tipo'        => 'recorrente_mensal',
        'data_inicio' => '2026-01-01',
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->deleteJson("/api/plataforma/empresas/{$empresa->id}/produtos/{$produto->id}")
        ->assertOk();

    expect(EmpresaProduto::count())->toBe(0);
});

it('bloqueia admin comum de acessar rota da plataforma', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson("/api/plataforma/empresas/{$empresa->id}/produtos")
        ->assertForbidden();
});

it('admin comum ve seus proprios produtos contratados via /admin/produtos-contratados', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa);

    EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'diagnostico_nr1',
        'tipo'        => 'pontual',
        'valor_unitario' => 30,
        'quantidade_aplicacoes' => 2,
        'data_inicio' => '2026-01-01',
        'status'      => 'ativo',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson('/api/admin/produtos-contratados')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.produto', 'diagnostico_nr1');
});

it('nao chama Asaas ao contratar produto quando integracao esta desligada', function () {
    config(['services.asaas.enabled' => false]);
    Http::fake();

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto' => 'plano_acao_nr1',
        'tipo' => 'recorrente_mensal',
        'valor_mensal' => 2500.00,
        'data_inicio' => '2026-06-01',
    ])->assertCreated()
      ->assertJsonPath('data.asaas_subscription_id', null);

    Http::assertNothingSent();
});

it('cria cliente e assinatura no Asaas para produto recorrente', function () {
    config([
        'services.asaas.enabled' => true,
        'services.asaas.api_key' => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
        'services.asaas.default_billing_type' => 'UNDEFINED',
    ]);

    Http::fake([
        'sandbox.asaas.com/api/v3/customers' => Http::response(['id' => 'cus_123'], 200),
        'sandbox.asaas.com/api/v3/subscriptions' => Http::response([
            'id' => 'sub_123',
            'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_123',
        ], 200),
    ]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto' => 'plano_acao_nr1',
        'tipo' => 'recorrente_mensal',
        'valor_mensal' => 2500.00,
        'data_inicio' => '2026-06-01',
    ])->assertCreated()
      ->assertJsonPath('data.asaas_subscription_id', 'sub_123')
      ->assertJsonPath('data.asaas_invoice_url', 'https://sandbox.asaas.com/i/sub_123');

    expect($empresa->fresh()->asaas_customer_id)->toBe('cus_123');

    Http::assertSentCount(2);
});

it('contrato e criado e job de retry e despachado quando Asaas falha inline', function () {
    config([
        'services.asaas.enabled' => true,
        'services.asaas.api_key' => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
    ]);

    Queue::fake();
    Http::fake([
        'sandbox.asaas.com/api/v3/customers' => Http::response(['errors' => [['description' => 'CNPJ invalido']]], 400),
    ]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto' => 'plano_acao_nr1',
        'tipo' => 'recorrente_mensal',
        'valor_mensal' => 1500.00,
        'data_inicio' => '2026-06-01',
    ])->assertCreated()
      ->assertJsonPath('data.asaas_subscription_id', null)
      ->assertJsonPath('asaas_warning.mensagem', 'Produto criado. A cobrança no Asaas falhou e será tentada novamente em background. Use "Re-sincronizar" para tentar agora.');

    expect(EmpresaProduto::count())->toBe(1);

    Queue::assertPushed(SincronizarProdutoAsaasJob::class, 1);
});

it('cria assinatura Asaas com ciclo customizado quando produto define ciclo', function () {
    config([
        'services.asaas.enabled'  => true,
        'services.asaas.api_key'  => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
        'services.asaas.default_billing_type' => 'UNDEFINED',
    ]);

    Http::fake([
        'sandbox.asaas.com/api/v3/customers'     => Http::response(['id' => 'cus_q'], 200),
        'sandbox.asaas.com/api/v3/subscriptions' => Http::response([
            'id'         => 'sub_q',
            'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_q',
        ], 200),
    ]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'plano_acao_nr1',
        'tipo'         => 'recorrente_mensal',
        'valor_mensal' => 6000,
        'ciclo'        => 'QUARTERLY',
        'data_inicio'  => '2026-06-01',
    ])->assertCreated();

    Http::assertSent(function ($request) {
        return str_contains($request->url(), '/subscriptions')
            && $request->data()['cycle'] === 'QUARTERLY';
    });
});

it('rejeita ciclo invalido na contratacao', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'plano_acao_nr1',
        'tipo'         => 'recorrente_mensal',
        'valor_mensal' => 1500,
        'ciclo'        => 'DAILY',
        'data_inicio'  => '2026-06-01',
    ])->assertUnprocessable()
      ->assertJsonValidationErrors('ciclo');
});

it('job de produto e idempotente se ja foi sincronizado em retry anterior', function () {
    config([
        'services.asaas.enabled'  => true,
        'services.asaas.api_key'  => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
    ]);

    Http::fake();

    $empresa = criarEmpresa(['asaas_customer_id' => 'cus_x']);
    $produto = EmpresaProduto::create([
        'empresa_id'            => $empresa->id,
        'produto'               => 'plano_acao_nr1',
        'tipo'                  => 'recorrente_mensal',
        'valor_mensal'          => 1500,
        'data_inicio'           => '2026-06-01',
        'status'                => 'ativo',
        'asaas_subscription_id' => 'sub_ja_sincronizada',
    ]);

    (new SincronizarProdutoAsaasJob($produto))->handle(app(\App\Services\AsaasService::class));

    Http::assertNothingSent();
});

it('endpoint sincronizar-asaas retenta criar a cobranca', function () {
    config([
        'services.asaas.enabled' => true,
        'services.asaas.api_key' => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
    ]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    $produto = EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'plano_acao_nr1',
        'tipo'        => 'recorrente_mensal',
        'valor_mensal'=> 1500,
        'data_inicio' => '2026-06-01',
        'status'      => 'ativo',
    ]);

    Http::fake([
        'sandbox.asaas.com/api/v3/customers'     => Http::response(['id' => 'cus_resync'], 200),
        'sandbox.asaas.com/api/v3/subscriptions' => Http::response([
            'id'         => 'sub_resync',
            'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_resync',
        ], 200),
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos/{$produto->id}/sincronizar-asaas")
        ->assertOk()
        ->assertJsonPath('data.asaas_subscription_id', 'sub_resync')
        ->assertJsonPath('data.asaas_invoice_url', 'https://sandbox.asaas.com/i/sub_resync');

    expect(Auditoria::where('acao', 'plataforma.produto.sincronizar_asaas')->exists())->toBeTrue();
});

it('sincronizar-asaas retorna 422 quando kill switch esta ligado', function () {
    config(['services.asaas.enabled' => false]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    $produto = EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'canal_escuta',
        'tipo'        => 'recorrente_mensal',
        'valor_mensal'=> 1500,
        'data_inicio' => '2026-06-01',
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos/{$produto->id}/sincronizar-asaas")
        ->assertStatus(422)
        ->assertJsonPath('message', 'Integração Asaas está desativada (ASAAS_ENABLED=false).');
});

it('admin ve asaas_invoice_url em /admin/produtos-contratados', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa);

    EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'plano_acao_nr1',
        'tipo'        => 'recorrente_mensal',
        'valor_mensal'=> 1500,
        'data_inicio' => '2026-01-01',
        'status'      => 'ativo',
        'asaas_subscription_id' => 'sub_999',
        'asaas_invoice_url'     => 'https://sandbox.asaas.com/i/sub_999',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson('/api/admin/produtos-contratados')
        ->assertOk()
        ->assertJsonPath('data.0.asaas_invoice_url', 'https://sandbox.asaas.com/i/sub_999')
        ->assertJsonPath('data.0.asaas_subscription_id', 'sub_999');
});

it('webhook do Asaas marca contrato como inadimplente', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $empresa = criarEmpresa();
    $produto = EmpresaProduto::create([
        'empresa_id' => $empresa->id,
        'produto' => 'canal_escuta',
        'tipo' => 'recorrente_mensal',
        'valor_mensal' => 1500,
        'data_inicio' => '2026-01-01',
        'status' => 'ativo',
        'asaas_subscription_id' => 'sub_123',
        'asaas_payment_id' => 'pay_123',
    ]);

    $this->postJson('/api/webhooks/asaas', [
        'event' => 'PAYMENT_OVERDUE',
        'payment' => [
            'id' => 'pay_123',
            'subscription' => 'sub_123',
            'externalReference' => "empresa_produto:{$produto->id}",
            'invoiceUrl' => 'https://sandbox.asaas.com/i/pay_123',
        ],
    ], ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('processed', true);

    expect($produto->fresh()->status)->toBe('inadimplente')
        ->and($produto->fresh()->asaas_invoice_url)->toBe('https://sandbox.asaas.com/i/pay_123');
});
