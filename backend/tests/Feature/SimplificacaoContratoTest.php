<?php

use App\Models\Empresa;
use App\Models\EmpresaProduto;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('cria empresa no formato simplificado com multiplos produtos e valor_mensal', function () {
    // Desativar Asaas para evitar chamadas de rede reais
    config(['services.asaas.enabled' => false]);

    $sa = criarSuperAdmin();
    Sanctum::actingAs($sa, ['role:super_admin']);

    $res = $this->postJson('/api/plataforma/empresas', [
        'nome_fantasia' => 'Empresa Simplificada',
        'razao_social'  => 'Empresa Simplificada Ltda',
        'cnpj'          => '12.345.678/0001-95',
        'email_contato' => 'rh@simplificada.test',
        'plano'         => 'pleno',
        'admin_nome'    => 'Carla Admin',
        'admin_email'   => 'carla@simplificada.test',
        'valor_mensal'  => 1200.00,
        'max_testes'    => 50,
        'produtos'      => ['diagnostico_nr1', 'pesquisas'],
    ]);

    $res->assertCreated();

    $empresa = Empresa::where('cnpj', '12345678000195')->first();
    expect($empresa)->not->toBeNull();
    expect($empresa->valor_mensal)->toBe("1200.00");

    // Verificar se os produtos foram criados
    $produtos = $empresa->produtos;
    expect($produtos->count())->toBe(2);

    $diagnostico = $produtos->where('produto', 'diagnostico_nr1')->first();
    expect($diagnostico)->not->toBeNull();
    expect($diagnostico->limite_colaboradores)->toBe(50);
    expect($diagnostico->valor_unitario)->toBeNull();
    expect($diagnostico->valor_mensal)->toBeNull();

    $pesquisas = $produtos->where('produto', 'pesquisas')->first();
    expect($pesquisas)->not->toBeNull();
    expect($pesquisas->limite_colaboradores)->toBe(50);
    expect($pesquisas->valor_unitario)->toBeNull();
    expect($pesquisas->valor_mensal)->toBeNull();
});

it('permite atualizar o valor_mensal da empresa', function () {
    config(['services.asaas.enabled' => false]);

    $empresa = criarEmpresa(['valor_mensal' => 1000.00]);
    $sa = criarSuperAdmin();
    Sanctum::actingAs($sa, ['role:super_admin']);

    $this->putJson("/api/plataforma/empresas/{$empresa->id}", [
        'nome_fantasia' => 'Novo Nome',
        'valor_mensal'  => 1500.00,
    ])->assertOk();

    expect($empresa->fresh()->valor_mensal)->toBe("1500.00");
});
