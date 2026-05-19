<?php

use App\Models\Auditoria;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('registra e lista auditoria de configuracoes', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa, ['nome' => 'Admin Auditor']);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->putJson('/api/admin/configuracoes', [
        'nome_fantasia' => 'Empresa Auditada',
        'notif_alerta_email' => false,
    ])->assertOk();

    expect(Auditoria::where('empresa_id', $empresa->id)
        ->where('acao', 'configuracoes.atualizar')
        ->exists())->toBeTrue();

    $this->getJson('/api/admin/configuracoes')
        ->assertOk()
        ->assertJsonPath('empresa.nome_fantasia', 'Empresa Auditada')
        ->assertJsonCount(1, 'auditorias')
        ->assertJsonPath('auditorias.0.acao', 'configuracoes.atualizar')
        ->assertJsonPath('auditorias.0.usuario.nome', 'Admin Auditor');
});
