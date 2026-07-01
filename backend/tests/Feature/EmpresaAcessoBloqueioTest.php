<?php

use App\Models\Colaborador;

require_once __DIR__.'/Support/TestModels.php';

it('permite login de admin de empresa ativa', function () {
    $empresa = criarEmpresa(['status' => 'ativo']);
    criarAdmin($empresa, ['email' => 'ativo@acesso.test', 'password' => 'secret123']);

    $this->postJson('/api/auth/admin/login', [
        'email' => 'ativo@acesso.test',
        'senha' => 'secret123',
    ])->assertOk()->assertJsonPath('tipo', 'admin');
});

it('bloqueia login de admin de empresa suspensa', function () {
    $empresa = criarEmpresa(['status' => 'suspenso']);
    criarAdmin($empresa, ['email' => 'suspenso@acesso.test', 'password' => 'secret123']);

    $this->postJson('/api/auth/admin/login', [
        'email' => 'suspenso@acesso.test',
        'senha' => 'secret123',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

it('bloqueia login de admin de empresa cancelada', function () {
    $empresa = criarEmpresa(['status' => 'cancelado']);
    criarAdmin($empresa, ['email' => 'cancelado@acesso.test', 'password' => 'secret123']);

    $this->postJson('/api/auth/admin/login', [
        'email' => 'cancelado@acesso.test',
        'senha' => 'secret123',
    ])->assertStatus(422);
});

it('permite login do super_admin sem empresa', function () {
    criarSuperAdmin(['email' => 'super@acesso.test', 'password' => 'secret123']);

    $this->postJson('/api/auth/admin/login', [
        'email' => 'super@acesso.test',
        'senha' => 'secret123',
    ])->assertOk()->assertJsonPath('tipo', 'super_admin');
});

it('bloqueia login de colaborador de empresa suspensa', function () {
    $empresa = criarEmpresa(['status' => 'suspenso']);
    $setor = criarSetor($empresa);
    Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id'   => $setor->id,
        'nome'       => 'Fulano Teste',
        'email'      => 'colab@acesso.test',
        'password'   => 'secret123',
        'status'     => 'ativo',
    ]);

    $this->postJson('/api/auth/colaborador/login', [
        'login' => 'colab@acesso.test',
        'senha' => 'secret123',
    ])->assertStatus(422)->assertJsonValidationErrors('login');
});
