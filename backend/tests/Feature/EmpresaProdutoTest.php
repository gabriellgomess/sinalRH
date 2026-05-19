<?php

use App\Models\Auditoria;
use App\Models\EmpresaProduto;
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
