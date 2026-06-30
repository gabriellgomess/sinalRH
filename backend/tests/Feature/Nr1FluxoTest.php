<?php

use App\Models\Auditoria;
use App\Models\Nr1Avaliacao;
use App\Models\Nr1Respondente;
use App\Models\Nr1Resposta;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

function respostasNr1(string $valor = '5'): array
{
    $itensPorSecao = [
        1 => 4,
        2 => 4,
        3 => 4,
        4 => 4,
        5 => 4,
        6 => 4,
        7 => 4,
        8 => 4,
        9 => 4,
        10 => 4,
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
        'faixa_etaria' => '19_34',
        'respostas' => respostasNr1('5'),
    ])->assertOk();

    $this->getJson("/api/admin/nr1/{$avaliacaoId}/resultados")
        ->assertOk()
        ->assertJsonPath('data.scores.total_respostas', 40)
        ->assertJsonPath('data.scores.total_respondentes', 1)
        ->assertJsonPath('data.scores.score_geral', 100);

    expect(Nr1Respondente::count())->toBe(1)
        ->and(Nr1Resposta::count())->toBe(40)
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
        'faixa_etaria' => '19_34',
        'respostas' => respostasNr1('5'),
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('setor_id');
});

it('exibe resultados da NR-1 mais recente no dashboard admin', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa, ['nome' => 'Operacao']);

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo' => 'Avaliacao NR-1 Critica',
        'aplicada_em' => '2026-05-18',
        'status' => 'encerrada',
    ]);

    for ($i = 0; $i < 5; $i++) {
        $respondente = Nr1Respondente::create([
            'avaliacao_id' => $avaliacao->id,
            'setor_id' => $setor->id,
            'sexo' => 'nao_informado',
            'faixa_etaria' => '19_34',
        ]);

        foreach (respostasNr1('1') as $resposta) {
            Nr1Resposta::create(array_merge($resposta, [
                'avaliacao_id' => $avaliacao->id,
                'respondente_id' => $respondente->id,
            ]));
        }
    }

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson('/api/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('indicadores.risco_psicossocial', 'Crítico')
        ->assertJsonPath('indicadores.nr1_score_geral', 0)
        ->assertJsonPath('indicadores.nr1_total_respondentes', 5)
        ->assertJsonPath('indicadores.setores_atencao', 1)
        ->assertJsonPath('nr1.id', $avaliacao->id)
        ->assertJsonPath('ranking_setores.0.nome', 'Operacao')
        ->assertJsonPath('ranking_setores.0.score', 0)
        ->assertJsonPath('ranking_setores.0.nivel', 'critico')
        ->assertJsonPath('alertas.0.link', '/admin/nr1');
});

it('exibe mapa de riscos a partir da NR-1 quando nao ha riscos materializados', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa, ['nome' => 'Operacao']);

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo' => 'Avaliacao NR-1 Critica',
        'aplicada_em' => '2026-05-18',
        'status' => 'encerrada',
    ]);

    for ($i = 0; $i < 5; $i++) {
        $respondente = Nr1Respondente::create([
            'avaliacao_id' => $avaliacao->id,
            'setor_id' => $setor->id,
            'sexo' => 'nao_informado',
            'faixa_etaria' => '19_34',
        ]);

        foreach (respostasNr1('1') as $resposta) {
            Nr1Resposta::create(array_merge($resposta, [
                'avaliacao_id' => $avaliacao->id,
                'respondente_id' => $respondente->id,
            ]));
        }
    }

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson('/api/admin/riscos')
        ->assertOk()
        ->assertJsonPath('fonte', 'nr1')
        ->assertJsonPath('resumo.total', 1)
        ->assertJsonPath('resumo.criticos', 1)
        ->assertJsonPath('riscos.0.setor', 'Operacao')
        ->assertJsonPath('riscos.0.nivel', 'critico')
        ->assertJsonPath('riscos.0.score', 100)
        ->assertJsonPath('riscos.0.recomendacao.titulo', 'Plano de ação prioritário recomendado');
});

it('permite chaveamento explicito de fonte entre clima e nr1 via query param', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa, ['nome' => 'Operacao']);

    // 1. Criar dados de Clima
    \App\Models\Risco::create([
        'setor_id' => $setor->id,
        'empresa_id' => $empresa->id,
        'periodo' => '2026-05',
        'nivel' => 'alto',
        'score' => 75.0,
        'dimensoes' => ['autonomia' => 75.0],
        'recomendacao_titulo' => 'Recomendacao Clima',
    ]);

    // 2. Criar dados de NR-1
    $avaliacao = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo' => 'Avaliacao NR-1 Critica',
        'aplicada_em' => '2026-05-18',
        'status' => 'encerrada',
    ]);

    for ($i = 0; $i < 5; $i++) {
        $respondente = Nr1Respondente::create([
            'avaliacao_id' => $avaliacao->id,
            'setor_id' => $setor->id,
            'sexo' => 'nao_informado',
            'faixa_etaria' => '19_34',
        ]);

        foreach (respostasNr1('1') as $resposta) {
            Nr1Resposta::create(array_merge($resposta, [
                'avaliacao_id' => $avaliacao->id,
                'respondente_id' => $respondente->id,
            ]));
        }
    }

    Sanctum::actingAs($admin, ['role:admin']);

    // Testar index clima
    $this->getJson('/api/admin/riscos?fonte=clima')
        ->assertOk()
        ->assertJsonPath('fonte', 'clima')
        ->assertJsonPath('riscos.0.score', 75);

    // Testar index nr1
    $this->getJson('/api/admin/riscos?fonte=nr1')
        ->assertOk()
        ->assertJsonPath('fonte', 'nr1')
        ->assertJsonPath('riscos.0.score', 100);

    // Testar show clima
    $this->getJson('/api/admin/riscos/' . $setor->id . '?fonte=clima')
        ->assertOk()
        ->assertJsonPath('fonte', 'clima')
        ->assertJsonPath('score', 75);

    // Testar show nr1
    $this->getJson('/api/admin/riscos/' . $setor->id . '?fonte=nr1')
        ->assertOk()
        ->assertJsonPath('fonte', 'nr1')
        ->assertJsonPath('score', 100);
});

it('bloqueia acesso e resposta caso avaliacao esteja expirada', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa);

    $yesterday = now()->subDay();

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id'  => $empresa->id,
        'criado_por'  => $admin->id,
        'titulo'      => 'Avaliacao Expirada',
        'aplicada_em' => '2026-05-10',
        'expira_em'   => $yesterday->toDateString(),
        'status'      => 'ativa',
        'versao'      => '1.0',
    ]);

    $codigo = $avaliacao->codigo;

    // Acessar link público deve retornar 404 informando expiração
    $this->getJson("/api/nr1/{$codigo}")
        ->assertStatus(404)
        ->assertJsonPath('success', false)
        ->assertJsonFragment(['message' => 'Esta avaliação expirou em ' . $yesterday->format('d/m/Y') . ' e não está mais disponível.']);

    // Tentar responder deve retornar 404 informando expiração
    $this->postJson("/api/nr1/{$codigo}/responder", [
        'setor_id'     => $setor->id,
        'sexo'         => 'nao_informado',
        'faixa_etaria' => '19_34',
        'respostas'    => respostasNr1('5'),
    ])->assertStatus(404)
      ->assertJsonFragment(['message' => 'Esta avaliação expirou em ' . $yesterday->format('d/m/Y') . ' e não aceita mais respostas.']);
});

it('bloqueia geracao de ia caso avaliacao nao esteja encerrada', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id'  => $empresa->id,
        'criado_por'  => $admin->id,
        'titulo'      => 'Avaliacao Ativa',
        'aplicada_em' => '2026-05-10',
        'status'      => 'ativa',
        'versao'      => '1.0',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson("/api/admin/nr1/{$avaliacao->id}/gerar-ia")
        ->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A análise de IA só pode ser gerada após o encerramento da avaliação.');
});

it('bloqueia geracao de ia caso relatorio ja esteja pronto ou gerando', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);

    $avaliacaoPronto = Nr1Avaliacao::create([
        'empresa_id'          => $empresa->id,
        'criado_por'          => $admin->id,
        'titulo'              => 'Avaliacao Pronto',
        'aplicada_em'         => '2026-05-10',
        'status'              => 'encerrada',
        'versao'              => '1.0',
        'relatorio_ia_status' => 'pronto',
    ]);

    $avaliacaoGerando = Nr1Avaliacao::create([
        'empresa_id'          => $empresa->id,
        'criado_por'          => $admin->id,
        'titulo'              => 'Avaliacao Gerando',
        'aplicada_em'         => '2026-05-10',
        'status'              => 'encerrada',
        'versao'              => '1.0',
        'relatorio_ia_status' => 'gerando',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson("/api/admin/nr1/{$avaliacaoPronto->id}/gerar-ia")
        ->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A análise de IA já foi gerada ou está em andamento.');

    $this->postJson("/api/admin/nr1/{$avaliacaoGerando->id}/gerar-ia")
        ->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'A análise de IA já foi gerada ou está em andamento.');
});

it('permite geracao de ia caso status seja nulo ou erro', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);

    $avaliacaoNula = Nr1Avaliacao::create([
        'empresa_id'  => $empresa->id,
        'criado_por'  => $admin->id,
        'titulo'      => 'Avaliacao Nula',
        'aplicada_em' => '2026-05-10',
        'status'      => 'encerrada',
        'versao'      => '1.0',
    ]);

    $avaliacaoErro = Nr1Avaliacao::create([
        'empresa_id'          => $empresa->id,
        'criado_por'          => $admin->id,
        'titulo'              => 'Avaliacao Erro',
        'aplicada_em'         => '2026-05-10',
        'status'              => 'encerrada',
        'versao'              => '1.0',
        'relatorio_ia_status' => 'erro',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->mock(\App\Services\Nr1RelatorioIAService::class, function ($mock) {
        $mock->shouldReceive('gerar')
            ->twice()
            ->andReturnUsing(function ($avaliacao) {
                $avaliacao->update([
                    'relatorio_ia_status' => 'pronto',
                    'relatorio_ia_dados' => ['foo' => 'bar'],
                ]);
            });
    });

    $this->postJson("/api/admin/nr1/{$avaliacaoNula->id}/gerar-ia")
        ->assertStatus(202)
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 'gerando');

    expect($avaliacaoNula->fresh()->relatorio_ia_status)->toBe('pronto');

    $this->postJson("/api/admin/nr1/{$avaliacaoErro->id}/gerar-ia")
        ->assertStatus(202)
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 'gerando');

    expect($avaliacaoErro->fresh()->relatorio_ia_status)->toBe('pronto');
});

it('permite geracao de ia caso avaliacao esteja expirada mesmo com status ativa', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id'  => $empresa->id,
        'criado_por'  => $admin->id,
        'titulo'      => 'Avaliacao Expirada Ativa',
        'aplicada_em' => '2026-05-10',
        'expira_em'   => now()->subDay()->toDateString(),
        'status'      => 'ativa',
        'versao'      => '1.0',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->mock(\App\Services\Nr1RelatorioIAService::class, function ($mock) use ($avaliacao) {
        $mock->shouldReceive('gerar')
            ->once()
            ->with(Mockery::on(fn($a) => $a->id === $avaliacao->id))
            ->andReturnUsing(function ($avaliacao) {
                $avaliacao->update([
                    'relatorio_ia_status' => 'pronto',
                    'relatorio_ia_dados' => ['foo' => 'bar'],
                ]);
            });
    });

    $this->postJson("/api/admin/nr1/{$avaliacao->id}/gerar-ia")
        ->assertStatus(202)
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 'gerando');

    expect($avaliacao->fresh()->relatorio_ia_status)->toBe('pronto');
});

it('retorna historico e benchmark das avaliacoes da empresa', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa, ['nome' => 'Operacoes']);

    // Criar avaliação 1
    $av1 = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo' => 'Avaliacao v1',
        'status' => 'encerrada',
        'versao' => '1.0',
    ]);

    // Criar avaliação 2
    $av2 = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo' => 'Avaliacao v2',
        'status' => 'encerrada',
        'versao' => '2.0',
    ]);

    // Responder av1 (5 respondentes para evitar trava de amostragem no teste)
    for ($i = 0; $i < 5; $i++) {
        $resp1 = Nr1Respondente::create([
            'avaliacao_id' => $av1->id,
            'setor_id' => $setor->id,
            'sexo' => 'masculino',
            'faixa_etaria' => '19_34',
        ]);
        foreach (respostasNr1('4') as $resposta) {
            Nr1Resposta::create(array_merge($resposta, [
                'avaliacao_id' => $av1->id,
                'respondente_id' => $resp1->id,
            ]));
        }
    }

    // Responder av2 (5 respondentes para evitar trava de amostragem no teste)
    for ($i = 0; $i < 5; $i++) {
        $resp2 = Nr1Respondente::create([
            'avaliacao_id' => $av2->id,
            'setor_id' => $setor->id,
            'sexo' => 'masculino',
            'faixa_etaria' => '19_34',
        ]);
        foreach (respostasNr1('5') as $resposta) {
            Nr1Resposta::create(array_merge($resposta, [
                'avaliacao_id' => $av2->id,
                'respondente_id' => $resp2->id,
            ]));
        }
    }

    Sanctum::actingAs($admin, ['role:admin']);

    $response = $this->getJson('/api/admin/nr1/benchmark');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'data' => [
                'historico_avaliacoes',
                'historico_setores',
            ]
        ]);
});

it('retorna os dados de adesao de uma avaliacao', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor1 = criarSetor($empresa, ['nome' => 'Setor A']);
    $setor2 = criarSetor($empresa, ['nome' => 'Setor B']);

    // Colaboradores ativos no setor 1
    \App\Models\Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id' => $setor1->id,
        'nome' => 'Colaborador 1',
        'email' => 'colab1@empresa.test',
        'status' => 'ativo',
        'password' => 'secret123',
    ]);
    \App\Models\Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id' => $setor1->id,
        'nome' => 'Colaborador 2',
        'email' => 'colab2@empresa.test',
        'status' => 'ativo',
        'password' => 'secret123',
    ]);

    // Colaborador ativo no setor 2
    \App\Models\Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id' => $setor2->id,
        'nome' => 'Colaborador 3',
        'email' => 'colab3@empresa.test',
        'status' => 'ativo',
        'password' => 'secret123',
    ]);

    // Colaborador inativo (desligado) no setor 2
    \App\Models\Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id' => $setor2->id,
        'nome' => 'Colaborador 4',
        'email' => 'colab4@empresa.test',
        'status' => 'desligado',
        'password' => 'secret123',
    ]);

    // Criar avaliação
    $avaliacao = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo' => 'Avaliacao Adesao',
        'status' => 'ativa',
        'versao' => '1.0',
    ]);

    // Um respondente no setor 1
    Nr1Respondente::create([
        'avaliacao_id' => $avaliacao->id,
        'setor_id' => $setor1->id,
        'sexo' => 'nao_informado',
        'faixa_etaria' => '19_34',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $response = $this->getJson("/api/admin/nr1/{$avaliacao->id}/adesao");

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.global.total_ativos', 3) // 2 do setor 1 + 1 do setor 2
        ->assertJsonPath('data.global.total_respondentes', 1)
        ->assertJsonPath('data.global.taxa_adesao', 33.3) // 1/3
        ->assertJsonPath('data.setores.0.setor_nome', 'Setor A')
        ->assertJsonPath('data.setores.0.total_ativos', 2)
        ->assertJsonPath('data.setores.0.total_respondentes', 1)
        ->assertJsonPath('data.setores.0.taxa_adesao', 50);
});

it('dispara lembretes de coleta para colaboradores do setor ou empresa', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor1 = criarSetor($empresa, ['nome' => 'Setor A']);
    $setor2 = criarSetor($empresa, ['nome' => 'Setor B']);

    // Colaboradores ativos no setor 1
    \App\Models\Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id' => $setor1->id,
        'nome' => 'Colaborador 1',
        'email' => 'colab1@empresa.test',
        'status' => 'ativo',
        'password' => 'secret123',
    ]);

    // Colaborador ativo no setor 2
    \App\Models\Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id' => $setor2->id,
        'nome' => 'Colaborador 2',
        'email' => 'colab2@empresa.test',
        'status' => 'ativo',
        'password' => 'secret123',
    ]);

    // Colaborador inativo (desligado) no setor 1
    \App\Models\Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id' => $setor1->id,
        'nome' => 'Colaborador 3',
        'email' => 'colab3@empresa.test',
        'status' => 'desligado',
        'password' => 'secret123',
    ]);

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo' => 'Avaliacao Lembrete',
        'status' => 'ativa',
        'versao' => '1.0',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    // Fake the Mail facade to assert emails are queued
    \Illuminate\Support\Facades\Mail::fake();

    // 1. Enviar lembrete geral (deve enfileirar para Colaborador 1 e Colaborador 2, mas não Colaborador 3)
    $response = $this->postJson("/api/admin/nr1/{$avaliacao->id}/lembrete");
    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('total_enviados', 2);

    \Illuminate\Support\Facades\Mail::assertQueued(\App\Mail\Nr1LembreteMail::class, 2);

    // 2. Enviar lembrete apenas para o setor 1 (deve enfileirar apenas para Colaborador 1)
    $responseSetor = $this->postJson("/api/admin/nr1/{$avaliacao->id}/lembrete", [
        'setor_id' => $setor1->id,
    ]);
    $responseSetor->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('total_enviados', 1);

    expect(Auditoria::where('acao', 'nr1.lembrete')->count())->toBe(2);
});



