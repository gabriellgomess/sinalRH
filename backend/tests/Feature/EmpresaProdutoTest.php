<?php

use App\Models\Auditoria;
use App\Models\EmpresaProduto;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

// Produtos = ACESSO/funcionalidade. Nunca geram cobranca no Asaas.
// O financeiro fica 100% nas Cobrancas (ver CobrancaEmpresaTest).

it('lista catalogo vazio para empresa sem produtos', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->getJson("/api/plataforma/empresas/{$empresa->id}/produtos")
        ->assertOk()
        ->assertJsonCount(0, 'data.produtos')
        ->assertJsonStructure(['data' => ['produtos', 'colaboradores_ativos', 'catalogo']]);
});

it('libera acesso a um produto (sem valores de cobranca)', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'              => 'diagnostico_nr1',
        'limite_colaboradores' => 50,
        'data_inicio'          => '2026-06-01',
    ])->assertCreated()
      ->assertJsonPath('data.produto', 'diagnostico_nr1')
      ->assertJsonPath('data.limite_colaboradores', 50)
      ->assertJsonPath('data.status', 'ativo');

    expect(EmpresaProduto::count())->toBe(1)
        ->and(Auditoria::where('acao', 'plataforma.produto.contratar')->exists())->toBeTrue();
});

it('gera numero de contrato automaticamente e sequencialmente', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $res1 = $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'     => 'plano_acao_nr1',
        'data_inicio' => '2026-06-01',
    ])->assertCreated();

    $res2 = $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'     => 'canal_escuta',
        'data_inicio' => '2026-06-01',
    ])->assertCreated();

    expect($res1->json('data.numero_contrato'))->toBe('SLC-2026-001')
        ->and($res2->json('data.numero_contrato'))->toBe('SLC-2026-002');
});

it('altera status de acesso (ativo -> pausado)', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    $produto = EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'diagnostico_nr1',
        'data_inicio' => '2026-01-01',
        'status'      => 'ativo',
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->putJson("/api/plataforma/empresas/{$empresa->id}/produtos/{$produto->id}", [
        'status' => 'pausado',
    ])->assertOk()
      ->assertJsonPath('data.status', 'pausado');

    expect(Auditoria::where('acao', 'plataforma.produto.atualizar')->exists())->toBeTrue();
});

it('remove acesso a um produto', function () {
    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    $produto = EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'canal_escuta',
        'data_inicio' => '2026-01-01',
    ]);

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->deleteJson("/api/plataforma/empresas/{$empresa->id}/produtos/{$produto->id}")
        ->assertOk();

    expect(EmpresaProduto::count())->toBe(0)
        ->and(Auditoria::where('acao', 'plataforma.produto.remover')->exists())->toBeTrue();
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
        'data_inicio' => '2026-01-01',
        'status'      => 'ativo',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson('/api/admin/produtos-contratados')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.produto', 'diagnostico_nr1');
});

it('NUNCA chama o Asaas ao liberar acesso a produto, mesmo com integracao ligada', function () {
    config([
        'services.asaas.enabled'  => true,
        'services.asaas.api_key'  => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
    ]);
    Http::fake();

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'     => 'plano_acao_nr1',
        'data_inicio' => '2026-06-01',
    ])->assertCreated();

    // Produto e apenas acesso: nenhuma chamada de cobranca deve sair.
    Http::assertNothingSent();
});
