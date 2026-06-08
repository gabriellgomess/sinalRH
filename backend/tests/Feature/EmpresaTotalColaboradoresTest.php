<?php

use App\Models\Empresa;
use App\Models\Colaborador;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('retorna a contagem tradicional de ativos se total_colaboradores for nulo', function () {
    $empresa = criarEmpresa(['total_colaboradores' => null]);

    // Criar colaboradores ativos e inativos
    Colaborador::create([
        'empresa_id' => $empresa->id,
        'nome' => 'Colaborador Ativo 1',
        'email' => 'ativo1@test.com',
        'password' => 'secret123',
        'status' => 'ativo',
    ]);

    Colaborador::create([
        'empresa_id' => $empresa->id,
        'nome' => 'Colaborador Ativo 2',
        'email' => 'ativo2@test.com',
        'password' => 'secret123',
        'status' => 'ativo',
    ]);

    Colaborador::create([
        'empresa_id' => $empresa->id,
        'nome' => 'Colaborador Inativo',
        'email' => 'inativo@test.com',
        'password' => 'secret123',
        'status' => 'desligado',
    ]);

    expect($empresa->total_colaboradores)->toBe(2);
    expect($empresa->total_colaboradores_custom)->toBeNull();
});

it('retorna o valor customizado se total_colaboradores estiver preenchido', function () {
    $empresa = criarEmpresa(['total_colaboradores' => 85]);

    // Criar colaboradores ativos
    Colaborador::create([
        'empresa_id' => $empresa->id,
        'nome' => 'Colaborador Ativo',
        'email' => 'ativo@test.com',
        'password' => 'secret123',
        'status' => 'ativo',
    ]);

    expect($empresa->total_colaboradores)->toBe(85);
    expect($empresa->total_colaboradores_custom)->toBe(85);
});

it('permite atualizar o total de colaboradores via endpoint admin', function () {
    $empresa = criarEmpresa(['total_colaboradores' => null]);
    $admin = criarAdmin($empresa);

    Sanctum::actingAs($admin, ['role:admin']);

    // Atualiza para um valor customizado
    $this->putJson("/api/admin/empresas/{$empresa->id}", [
        'nome_fantasia' => 'Novo Nome Fantasia',
        'razao_social' => 'Nova Razao Social',
        'total_colaboradores' => 120,
    ])->assertOk();

    $empresa->refresh();
    expect($empresa->total_colaboradores)->toBe(120);
    expect($empresa->total_colaboradores_custom)->toBe(120);

    // Permite voltar para nulo (auto-cálculo)
    $this->putJson("/api/admin/empresas/{$empresa->id}", [
        'nome_fantasia' => 'Novo Nome Fantasia',
        'razao_social' => 'Nova Razao Social',
        'total_colaboradores' => null,
    ])->assertOk();

    $empresa->refresh();
    expect($empresa->total_colaboradores)->toBe(0); // 0 colaboradores ativos cadastrados
    expect($empresa->total_colaboradores_custom)->toBeNull();
});
