<?php

use App\Models\Empresa;
use App\Models\Setor;
use App\Models\User;

function criarEmpresa(array $overrides = []): Empresa
{
    return Empresa::create(array_merge([
        'razao_social' => 'Empresa Teste LTDA',
        'nome_fantasia' => 'Empresa Teste',
        'cnpj' => fake()->numerify('##.###.###/####-##'),
        'email_contato' => 'rh@empresa.test',
        'plano' => 'pleno',
        'status' => 'ativo',
    ], $overrides));
}

function criarAdmin(Empresa $empresa, array $overrides = []): User
{
    return User::create(array_merge([
        'empresa_id' => $empresa->id,
        'nome' => 'Admin Teste',
        'email' => fake()->unique()->safeEmail(),
        'password' => 'secret123',
        'perfil' => 'admin',
        'ativo' => true,
    ], $overrides));
}

function criarSetor(Empresa $empresa, array $overrides = []): Setor
{
    return Setor::create(array_merge([
        'empresa_id' => $empresa->id,
        'nome' => 'Financeiro',
        'unidade' => 'Matriz',
    ], $overrides));
}

function criarSuperAdmin(array $overrides = []): User
{
    return User::create(array_merge([
        'empresa_id' => null,
        'nome' => 'Super Admin',
        'email' => fake()->unique()->safeEmail(),
        'password' => 'secret123',
        'perfil' => 'super_admin',
        'ativo' => true,
    ], $overrides));
}
