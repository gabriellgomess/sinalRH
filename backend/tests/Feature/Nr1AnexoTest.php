<?php

use App\Models\Auditoria;
use App\Models\Nr1Avaliacao;
use App\Models\Nr1PlanoAcao;
use App\Models\Nr1AcaoAnexo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('faz upload, lista, baixa e exclui anexo de acao do plano', function () {
    Storage::fake('local');

    $empresa = criarEmpresa();
    $empresa->produtos()->create([
        'produto'              => 'plano_acao_nr1',
        'tipo'                 => 'recorrente',
        'valor_mensal'         => 1500,
        'limite_colaboradores' => 100,
        'status'               => 'ativo',
        'data_inicio'          => now()->toDateString(),
    ]);
    $admin   = criarAdmin($empresa);
    $setor   = criarSetor($empresa);

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo'     => 'PGR 2026',
        'aplicada_em'=> '2026-05-01',
        'status'     => 'ativa',
        'versao'     => '1.0',
    ]);

    $acao = Nr1PlanoAcao::create([
        'avaliacao_id'    => $avaliacao->id,
        'setor_id'        => $setor->id,
        'risco_descricao' => 'Carga excessiva',
        'acao'            => 'Redistribuir tarefas',
        'responsavel'     => 'Gestor X',
        'prioridade'      => 'alta',
        'status'          => 'planejada',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $arquivo = UploadedFile::fake()->create('ata-reuniao.pdf', 120, 'application/pdf');

    $upload = $this->postJson("/api/admin/nr1/{$avaliacao->id}/plano-acao/{$acao->id}/anexos", [
        'arquivo'   => $arquivo,
        'descricao' => 'Ata da reuniao de redistribuicao',
    ])->assertCreated()
      ->assertJsonPath('data.nome_original', 'ata-reuniao.pdf');

    $anexoId = $upload->json('data.id');
    $caminho = $upload->json('data.caminho_storage');

    Storage::disk('local')->assertExists($caminho);

    $this->getJson("/api/admin/nr1/{$avaliacao->id}/plano-acao/{$acao->id}/anexos")
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->get("/api/admin/nr1/{$avaliacao->id}/plano-acao/{$acao->id}/anexos/{$anexoId}")
        ->assertOk();

    $this->deleteJson("/api/admin/nr1/{$avaliacao->id}/plano-acao/{$acao->id}/anexos/{$anexoId}")
        ->assertOk();

    expect(Nr1AcaoAnexo::count())->toBe(0)
        ->and(Auditoria::where('acao', 'nr1.acao.anexo_upload')->exists())->toBeTrue()
        ->and(Auditoria::where('acao', 'nr1.acao.anexo_excluir')->exists())->toBeTrue();

    Storage::disk('local')->assertMissing($caminho);
});

it('bloqueia upload de anexo em avaliacao de outra empresa', function () {
    Storage::fake('local');

    $empresa = criarEmpresa();
    $empresa->produtos()->create([
        'produto'              => 'plano_acao_nr1',
        'tipo'                 => 'recorrente',
        'valor_mensal'         => 1500,
        'limite_colaboradores' => 100,
        'status'               => 'ativo',
        'data_inicio'          => now()->toDateString(),
    ]);
    $admin   = criarAdmin($empresa);
    $outra   = criarEmpresa(['cnpj' => '55.555.555/5555-55']);
    $outra->produtos()->create([
        'produto'              => 'plano_acao_nr1',
        'tipo'                 => 'recorrente',
        'valor_mensal'         => 1500,
        'limite_colaboradores' => 100,
        'status'               => 'ativo',
        'data_inicio'          => now()->toDateString(),
    ]);
    $setor   = criarSetor($outra);

    $avaliacaoAlheia = Nr1Avaliacao::create([
        'empresa_id' => $outra->id,
        'criado_por' => $admin->id,
        'titulo'     => 'PGR Alheio',
        'aplicada_em'=> '2026-05-01',
        'status'     => 'ativa',
        'versao'     => '1.0',
    ]);

    $acao = Nr1PlanoAcao::create([
        'avaliacao_id'    => $avaliacaoAlheia->id,
        'setor_id'        => $setor->id,
        'risco_descricao' => 'X',
        'acao'            => 'Y',
        'responsavel'     => 'Z',
        'prioridade'      => 'media',
        'status'          => 'planejada',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson("/api/admin/nr1/{$avaliacaoAlheia->id}/plano-acao/{$acao->id}/anexos", [
        'arquivo' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf'),
    ])->assertForbidden();
});

it('retorna historico de versoes com scores por dimensao', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa);

    $v1 = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo'     => 'PGR Inaugural',
        'aplicada_em'=> '2025-05-01',
        'status'     => 'encerrada',
        'versao'     => '1.0',
    ]);

    $v2 = Nr1Avaliacao::create([
        'empresa_id'       => $empresa->id,
        'criado_por'       => $admin->id,
        'titulo'           => 'PGR Inaugural (v2.0)',
        'aplicada_em'      => '2026-05-01',
        'status'           => 'ativa',
        'versao'           => '2.0',
        'versao_origem_id' => $v1->id,
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson("/api/admin/nr1/{$v2->id}/historico")
        ->assertOk()
        ->assertJsonPath('data.atual_id', $v2->id)
        ->assertJsonCount(2, 'data.versoes')
        ->assertJsonPath('data.versoes.0.versao', '1.0')
        ->assertJsonPath('data.versoes.1.versao', '2.0');
});

it('exporta plano de acao em formato CSV', function () {
    $empresa = criarEmpresa();
    $empresa->produtos()->create([
        'produto'              => 'plano_acao_nr1',
        'tipo'                 => 'recorrente',
        'valor_mensal'         => 1500,
        'limite_colaboradores' => 100,
        'status'               => 'ativo',
        'data_inicio'          => now()->toDateString(),
    ]);
    $admin   = criarAdmin($empresa);
    $setor   = criarSetor($empresa);

    $avaliacao = Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo'     => 'PGR 2026',
        'aplicada_em'=> '2026-05-01',
        'status'     => 'ativa',
        'versao'     => '1.0',
    ]);

    $acao = Nr1PlanoAcao::create([
        'avaliacao_id'    => $avaliacao->id,
        'setor_id'        => $setor->id,
        'secao'           => 1,
        'risco_descricao' => 'Risco ergonomico',
        'acao'            => 'Nova cadeira',
        'responsavel'     => 'Dr. Silva',
        'prioridade'      => 'alta',
        'status'          => 'planejada',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $response = $this->get("/api/admin/nr1/{$avaliacao->id}/plano-acao/exportar")
        ->assertOk()
        ->assertHeader('Content-Type', 'text/csv; charset=UTF-8')
        ->assertHeader('Content-Disposition', 'attachment; filename="plano-de-acao.csv"');

    $content = $response->streamedContent();
    
    expect($content)->toContain('Prioridade (Nível de Risco)');
    expect($content)->toContain('Risco ergonomico');
    expect($content)->toContain('Nova cadeira');
});
