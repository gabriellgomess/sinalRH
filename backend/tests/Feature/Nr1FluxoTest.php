<?php

use App\Models\Auditoria;
use App\Models\Nr1Avaliacao;
use App\Models\Nr1Respondente;
use App\Models\Nr1Resposta;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

function respostasNr1(string $valor = 'S'): array
{
    $itensPorSecao = [
        1 => 7,
        2 => 5,
        3 => 4,
        4 => 5,
        5 => 5,
        6 => 4,
        7 => 5,
    ];

    $respostas = [];
    foreach ($itensPorSecao as $secao => $totalItens) {
        for ($item = 1; $item <= $totalItens; $item++) {
            $respostas[] = [
                'secao' => $secao,
                'item' => $item,
                'valor' => $valor,
            ];
        }
    }

    return $respostas;
}

it('publica avaliacao nr1, recebe respostas publicas e calcula resultados', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa, ['nome' => 'Operacao']);

    Sanctum::actingAs($admin, ['role:admin']);

    $response = $this->postJson('/api/admin/nr1', [
        'titulo' => 'Avaliacao NR-1 Maio',
        'aplicada_em' => '2026-05-18',
    ])->assertCreated()
        ->assertJsonPath('data.status', 'rascunho');

    $avaliacaoId = $response->json('data.id');
    $codigo = $response->json('data.codigo');

    $this->postJson("/api/admin/nr1/{$avaliacaoId}/publicar")
        ->assertOk()
        ->assertJsonPath('data.status', 'ativa');

    $this->getJson("/api/nr1/{$codigo}")
        ->assertOk()
        ->assertJsonPath('data.titulo', 'Avaliacao NR-1 Maio')
        ->assertJsonCount(1, 'data.setores');

    $this->postJson("/api/nr1/{$codigo}/responder", [
        'setor_id' => $setor->id,
        'sexo' => 'nao_informado',
        'faixa_etaria' => '25_34',
        'respostas' => respostasNr1('S'),
    ])->assertOk();

    $this->getJson("/api/admin/nr1/{$avaliacaoId}/resultados")
        ->assertOk()
        ->assertJsonPath('data.scores.total_respostas', 35)
        ->assertJsonPath('data.scores.total_respondentes', 1)
        ->assertJsonPath('data.scores.score_geral', 100);

    expect(Nr1Respondente::count())->toBe(1)
        ->and(Nr1Resposta::count())->toBe(35)
        ->and(Auditoria::where('acao', 'nr1.criar')->exists())->toBeTrue()
        ->and(Auditoria::where('acao', 'nr1.publicar')->exists())->toBeTrue();
});

it('duplica avaliacao nr1 criando nova versao em rascunho', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);

    Sanctum::actingAs($admin, ['role:admin']);

    $original = Nr1Avaliacao::create([
        'empresa_id'           => $empresa->id,
        'criado_por'           => $admin->id,
        'titulo'               => 'Avaliacao PGR Anual',
        'aplicada_em'          => '2026-05-01',
        'status'               => 'encerrada',
        'versao'               => '1.0',
        'aprovado_por'         => 'Joao Silva',
        'aprovado_em'          => '2026-05-10',
        'proxima_avaliacao_em' => '2027-05-01',
    ]);

    $response = $this->postJson("/api/admin/nr1/{$original->id}/duplicar")
        ->assertCreated()
        ->assertJsonPath('data.versao', '2.0')
        ->assertJsonPath('data.versao_origem_id', $original->id)
        ->assertJsonPath('data.status', 'rascunho');

    $novaId = $response->json('data.id');

    expect(Nr1Avaliacao::find($novaId)->codigo)->not->toBe($original->codigo)
        ->and(Auditoria::where('acao', 'nr1.duplicar')->exists())->toBeTrue();
});

it('bloqueia duplicacao de avaliacao de outra empresa', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $outraEmpresa = criarEmpresa(['cnpj' => '77.777.777/7777-77']);

    $avaliacaoAlheia = Nr1Avaliacao::create([
        'empresa_id' => $outraEmpresa->id,
        'criado_por' => $admin->id,
        'titulo'     => 'Alheia',
        'aplicada_em'=> '2026-05-01',
        'status'     => 'encerrada',
        'versao'     => '1.0',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson("/api/admin/nr1/{$avaliacaoAlheia->id}/duplicar")
        ->assertForbidden();
});

it('bloqueia resposta nr1 com setor de outra empresa', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $outraEmpresa = criarEmpresa(['cnpj' => '88.888.888/8888-88']);
    $setorDeOutraEmpresa = criarSetor($outraEmpresa);

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo' => 'Avaliacao publica',
        'aplicada_em' => '2026-05-18',
        'status' => 'ativa',
    ]);

    $this->postJson("/api/nr1/{$avaliacao->codigo}/responder", [
        'setor_id' => $setorDeOutraEmpresa->id,
        'sexo' => 'nao_informado',
        'faixa_etaria' => '25_34',
        'respostas' => respostasNr1('S'),
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('setor_id');
});
