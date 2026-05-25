<?php

use App\Jobs\SincronizarCustomerAsaasJob;
use App\Models\Empresa;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('despacha job de sync customer ao fazer cadastro self-service', function () {
    Queue::fake();

    $this->postJson('/api/cadastro', [
        'nome_fantasia'         => 'Acme Teste',
        'cnpj'                  => '12.345.678/0001-90',
        'admin_nome'            => 'Maria Admin',
        'admin_email'           => 'maria@acme.test',
        'admin_senha'           => 'segredo12345',
        'admin_senha_confirmation' => 'segredo12345',
    ])->assertCreated();

    Queue::assertPushed(SincronizarCustomerAsaasJob::class, function ($job) {
        return $job->empresa->nome_fantasia === 'Acme Teste';
    });
});

it('despacha job de sync customer ao plataforma criar empresa', function () {
    Queue::fake();

    $sa = criarSuperAdmin();
    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson('/api/plataforma/empresas', [
        'nome_fantasia' => 'Empresa Nova',
        'razao_social'  => 'Empresa Nova Ltda',
        'cnpj'          => '12.345.678/0001-91',
        'email_contato' => 'rh@nova.test',
        'plano'         => 'pleno',
        'admin_nome'    => 'Ana Admin',
        'admin_email'   => 'ana@nova.test',
    ])->assertCreated();

    Queue::assertPushed(SincronizarCustomerAsaasJob::class, 1);
});

it('permite a plataforma definir senha manual ao criar empresa', function () {
    Queue::fake();

    $sa = criarSuperAdmin();
    Sanctum::actingAs($sa, ['role:super_admin']);

    $res = $this->postJson('/api/plataforma/empresas', [
        'nome_fantasia' => 'Empresa Senha Manual',
        'razao_social'  => 'Empresa Senha Manual Ltda',
        'cnpj'          => '12.345.678/0001-92',
        'email_contato' => 'rh@manual.test',
        'plano'         => 'pleno',
        'admin_nome'    => 'Carla Admin',
        'admin_email'   => 'carla@manual.test',
        'admin_senha'   => 'minhasenha123',
    ]);

    $res->assertCreated();
    $res->assertJsonPath('acesso.senha', 'minhasenha123');

    $admin = \App\Models\User::where('email', 'carla@manual.test')->first();
    expect($admin)->not->toBeNull();
    expect(Hash::check('minhasenha123', $admin->password))->toBeTrue();
});

it('job de sync customer nao chama Asaas quando kill switch esta off', function () {
    config(['services.asaas.enabled' => false]);
    Http::fake();

    $empresa = criarEmpresa();

    (new SincronizarCustomerAsaasJob($empresa))->handle(app(\App\Services\AsaasService::class));

    Http::assertNothingSent();
    expect($empresa->fresh()->asaas_customer_id)->toBeNull();
});

it('job de sync customer cria cliente Asaas e salva o id', function () {
    config([
        'services.asaas.enabled'  => true,
        'services.asaas.api_key'  => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
    ]);

    Http::fake([
        'sandbox.asaas.com/api/v3/customers' => Http::response(['id' => 'cus_async'], 200),
    ]);

    $empresa = criarEmpresa();

    (new SincronizarCustomerAsaasJob($empresa))->handle(app(\App\Services\AsaasService::class));

    expect($empresa->fresh()->asaas_customer_id)->toBe('cus_async');
    Http::assertSentCount(1);
});

it('job de sync customer eh idempotente se empresa ja tem customer_id', function () {
    config([
        'services.asaas.enabled'  => true,
        'services.asaas.api_key'  => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
    ]);

    Http::fake();

    $empresa = criarEmpresa(['asaas_customer_id' => 'cus_existente']);

    (new SincronizarCustomerAsaasJob($empresa))->handle(app(\App\Services\AsaasService::class));

    Http::assertNothingSent();
    expect($empresa->fresh()->asaas_customer_id)->toBe('cus_existente');
});
