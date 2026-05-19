<?php

use App\Models\Auditoria;
use App\Models\Pesquisa;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('cria publica e duplica pesquisa com auditoria', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa);

    Sanctum::actingAs($admin, ['role:admin']);

    $response = $this->postJson('/api/admin/pesquisas', [
        'titulo' => 'Pesquisa de clima',
        'descricao' => 'Ciclo mensal',
        'tipo' => 'clima',
        'setor_id' => $setor->id,
        'anonima' => true,
        'perguntas' => [
            [
                'texto' => 'Como esta a carga de trabalho?',
                'tipo' => 'likert',
                'dimensao' => 'carga_trabalho',
                'obrigatoria' => true,
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('status', 'rascunho')
        ->assertJsonCount(1, 'perguntas');

    $pesquisaId = $response->json('id');

    $this->postJson("/api/admin/pesquisas/{$pesquisaId}/publicar")
        ->assertOk()
        ->assertJsonPath('pesquisa.status', 'ativa');

    $this->postJson("/api/admin/pesquisas/{$pesquisaId}/duplicar")
        ->assertCreated()
        ->assertJsonPath('status', 'rascunho')
        ->assertJsonCount(1, 'perguntas');

    expect(Pesquisa::where('empresa_id', $empresa->id)->count())->toBe(2)
        ->and(Auditoria::where('acao', 'pesquisa.criar')->exists())->toBeTrue()
        ->and(Auditoria::where('acao', 'pesquisa.publicar')->exists())->toBeTrue()
        ->and(Auditoria::where('acao', 'pesquisa.duplicar')->exists())->toBeTrue();
});

it('bloqueia pesquisa vinculada a setor de outra empresa', function () {
    $empresa = criarEmpresa();
    $outraEmpresa = criarEmpresa(['cnpj' => '99.999.999/9999-99']);
    $admin = criarAdmin($empresa);
    $setorDeOutraEmpresa = criarSetor($outraEmpresa);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson('/api/admin/pesquisas', [
        'titulo' => 'Pesquisa invalida',
        'tipo' => 'clima',
        'setor_id' => $setorDeOutraEmpresa->id,
        'perguntas' => [
            [
                'texto' => 'Pergunta',
                'tipo' => 'likert',
            ],
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('setor_id');
});
