<?php

use App\Models\Colaborador;
use App\Models\Pergunta;
use App\Models\Pesquisa;
use App\Models\Resposta;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

function criarColaborador(App\Models\Empresa $empresa, array $overrides = []): Colaborador
{
    static $seq = 0;
    $seq++;
    return Colaborador::create(array_merge([
        'empresa_id' => $empresa->id,
        'setor_id'   => null,
        'nome'       => "Colab {$seq}",
        'email'      => "colab{$seq}@teste.com",
        'password'   => 'secret123',
        'status'     => 'ativo',
    ], $overrides));
}

function pesquisaAtivaCom(App\Models\Empresa $empresa, ?int $setorId = null): Pesquisa
{
    $p = Pesquisa::create([
        'empresa_id'  => $empresa->id,
        'setor_id'    => $setorId,
        'titulo'      => 'Clima Q3',
        'tipo'        => 'clima',
        'status'      => 'ativa',
        'publicado_em'=> now(),
    ]);
    Pergunta::create(['pesquisa_id' => $p->id, 'texto' => 'Como voce esta?', 'tipo' => 'likert', 'ordem' => 1]);
    return $p;
}

it('colaborador nao responde pesquisa de outra empresa (403)', function () {
    $empresaA = criarEmpresa();
    $empresaB = criarEmpresa(['cnpj' => null]);
    $colabA   = criarColaborador($empresaA);
    $pesquisaB = pesquisaAtivaCom($empresaB);
    $perguntaB = $pesquisaB->perguntas()->first();

    Sanctum::actingAs($colabA, ['role:colaborador']);

    $this->getJson("/api/app/pesquisas/{$pesquisaB->id}")->assertForbidden();
    $this->postJson("/api/app/pesquisas/{$pesquisaB->id}/responder", [
        'respostas' => [['pergunta_id' => $perguntaB->id, 'valor_numerico' => 5]],
    ])->assertForbidden();

    expect(Resposta::count())->toBe(0);
});

it('rejeita resposta com pergunta_id de outra pesquisa (422)', function () {
    $empresa = criarEmpresa();
    $colab   = criarColaborador($empresa);
    $pesquisa = pesquisaAtivaCom($empresa);
    $outra    = pesquisaAtivaCom($empresa);
    $perguntaOutra = $outra->perguntas()->first();

    Sanctum::actingAs($colab, ['role:colaborador']);

    $this->postJson("/api/app/pesquisas/{$pesquisa->id}/responder", [
        'respostas' => [['pergunta_id' => $perguntaOutra->id, 'valor_numerico' => 5]],
    ])->assertStatus(422);

    expect(Resposta::count())->toBe(0);
});

it('colaborador responde pesquisa da propria empresa (201)', function () {
    $empresa = criarEmpresa();
    $colab   = criarColaborador($empresa);
    $pesquisa = pesquisaAtivaCom($empresa);
    $pergunta = $pesquisa->perguntas()->first();

    Sanctum::actingAs($colab, ['role:colaborador']);

    $this->postJson("/api/app/pesquisas/{$pesquisa->id}/responder", [
        'respostas' => [['pergunta_id' => $pergunta->id, 'valor_numerico' => 4]],
    ])->assertCreated();

    expect(Resposta::count())->toBe(1);

    // Nao pode responder duas vezes
    $this->postJson("/api/app/pesquisas/{$pesquisa->id}/responder", [
        'respostas' => [['pergunta_id' => $pergunta->id, 'valor_numerico' => 4]],
    ])->assertStatus(422);
});

it('colaborador nao ve pesquisa destinada a outro setor (404)', function () {
    $empresa = criarEmpresa();
    $setorA  = criarSetor($empresa);
    $setorB  = criarSetor($empresa);
    $colab   = criarColaborador($empresa, ['setor_id' => $setorA->id]);
    $pesquisaSetorB = pesquisaAtivaCom($empresa, $setorB->id);

    Sanctum::actingAs($colab, ['role:colaborador']);

    $this->getJson("/api/app/pesquisas/{$pesquisaSetorB->id}")->assertNotFound();
});
