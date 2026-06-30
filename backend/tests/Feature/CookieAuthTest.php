<?php

use App\Models\User;
use App\Models\Colaborador;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cookie;

require_once __DIR__.'/Support/TestModels.php';

it('recebe cookie srh_token no login de administrador e consegue autenticar com ele', function () {
    $empresa = criarEmpresa();
    $admin = User::create([
        'nome' => 'Test Admin',
        'email' => 'admin@cookie.test',
        'password' => Hash::make('password123'),
        'perfil' => 'admin',
        'empresa_id' => $empresa->id,
    ]);

    // 1. Login deve retornar o cookie
    $response = $this->postJson('/api/auth/admin/login', [
        'email' => 'admin@cookie.test',
        'senha' => 'password123',
    ]);

    $response->assertOk();
    $response->assertCookie('srh_token');

    $rawToken = $response->json('token');
    expect($rawToken)->not->toBeEmpty();

    // 2. Acessar rota protegida enviando apenas o cookie (não criptografado)
    $responseMe = $this->call('GET', '/api/auth/me', [], ['srh_token' => $rawToken]);

    $responseMe->assertOk();
    expect($responseMe->json('user.id'))->toBe($admin->id);
});

it('remove cookie srh_token no logout', function () {
    $empresa = criarEmpresa();
    $admin = User::create([
        'nome' => 'Test Admin',
        'email' => 'logout@cookie.test',
        'password' => Hash::make('password123'),
        'perfil' => 'admin',
        'empresa_id' => $empresa->id,
    ]);

    // Login para obter o token bruto
    $responseLogin = $this->postJson('/api/auth/admin/login', [
        'email' => 'logout@cookie.test',
        'senha' => 'password123',
    ]);

    $rawToken = $responseLogin->json('token');

    // Faz logout enviando o cookie
    $response = $this->call('POST', '/api/auth/logout', [], ['srh_token' => $rawToken]);

    $response->assertOk();
    
    // Cookie deve ter sido removido (expirado)
    $response->assertCookieExpired('srh_token');
});
