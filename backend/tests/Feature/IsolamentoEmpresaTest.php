<?php

use App\Models\Comunicado;
use App\Models\Pesquisa;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

// Garante isolamento multi-tenant: admin da empresa A nao pode ler/alterar/excluir
// recursos da empresa B via {id} na rota.

it('bloqueia admin de ver setor de outra empresa (403)', function () {
    $empresaA = criarEmpresa();
    $empresaB = criarEmpresa(['cnpj' => null]);
    $adminA   = criarAdmin($empresaA);
    $setorB   = criarSetor($empresaB);

    Sanctum::actingAs($adminA, ['role:admin']);

    $this->getJson("/api/admin/setores/{$setorB->id}")->assertForbidden();
    $this->putJson("/api/admin/setores/{$setorB->id}", ['nome' => 'Hack'])->assertForbidden();
    $this->deleteJson("/api/admin/setores/{$setorB->id}")->assertForbidden();
});

it('permite admin ver setor da propria empresa', function () {
    $empresaA = criarEmpresa();
    $adminA   = criarAdmin($empresaA);
    $setorA   = criarSetor($empresaA);

    Sanctum::actingAs($adminA, ['role:admin']);

    $this->getJson("/api/admin/setores/{$setorA->id}")->assertOk();
});

it('bloqueia admin de ver detalhe de risco de setor de outra empresa (403)', function () {
    $empresaA = criarEmpresa();
    $empresaB = criarEmpresa(['cnpj' => null]);
    $adminA   = criarAdmin($empresaA);
    $setorB   = criarSetor($empresaB);

    Sanctum::actingAs($adminA, ['role:admin']);

    $this->getJson("/api/admin/riscos/{$setorB->id}")->assertForbidden();
});

it('bloqueia admin de acessar pesquisa de outra empresa (403)', function () {
    $empresaA = criarEmpresa();
    $empresaB = criarEmpresa(['cnpj' => null]);
    $adminA   = criarAdmin($empresaA);

    $pesquisaB = Pesquisa::create([
        'empresa_id' => $empresaB->id,
        'titulo'     => 'Pesquisa B',
        'tipo'       => 'clima',
        'status'     => 'rascunho',
    ]);

    Sanctum::actingAs($adminA, ['role:admin']);

    $this->getJson("/api/admin/pesquisas/{$pesquisaB->id}")->assertForbidden();
    $this->deleteJson("/api/admin/pesquisas/{$pesquisaB->id}")->assertForbidden();
});

it('bloqueia admin de alterar comunicado de outra empresa (403)', function () {
    $empresaA = criarEmpresa();
    $empresaB = criarEmpresa(['cnpj' => null]);
    $adminA   = criarAdmin($empresaA);

    $comunicadoB = Comunicado::create([
        'empresa_id' => $empresaB->id,
        'titulo'     => 'Comunicado B',
        'corpo'      => 'Conteudo',
        'tipo'       => 'info',
    ]);

    Sanctum::actingAs($adminA, ['role:admin']);

    $this->putJson("/api/admin/comunicados/{$comunicadoB->id}", ['titulo' => 'X'])->assertForbidden();
    $this->deleteJson("/api/admin/comunicados/{$comunicadoB->id}")->assertForbidden();
});
