<?php

use App\Models\Auditoria;
use App\Models\Nr1Avaliacao;
use App\Models\Nr1DossieArquivo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

function criarAvaliacaoPgr($empresa, $admin): Nr1Avaliacao
{
    return Nr1Avaliacao::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'titulo'     => 'PGR Teste',
        'aplicada_em'=> '2026-05-01',
        'status'     => 'ativa',
        'versao'     => '1.0',
    ]);
}

it('lista arvore completa do dossie com as 11 pastas', function () {
    $empresa  = criarEmpresa();
    $admin    = criarAdmin($empresa);
    $avaliacao = criarAvaliacaoPgr($empresa, $admin);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson("/api/admin/nr1/{$avaliacao->id}/dossie")
        ->assertOk()
        ->assertJsonCount(11, 'data.arvore')
        ->assertJsonPath('data.arvore.0.codigo', '00')
        ->assertJsonPath('data.arvore.10.codigo', '10');
});

it('faz upload em pasta especifica e lista', function () {
    Storage::fake('local');

    $empresa  = criarEmpresa();
    $admin    = criarAdmin($empresa);
    $avaliacao = criarAvaliacaoPgr($empresa, $admin);

    Sanctum::actingAs($admin, ['role:admin']);

    $arquivo = UploadedFile::fake()->create('contrato.pdf', 200, 'application/pdf');

    $resp = $this->postJson("/api/admin/nr1/{$avaliacao->id}/dossie/00", [
        'arquivo' => $arquivo,
    ])->assertCreated()
      ->assertJsonPath('data.pasta_codigo', '00')
      ->assertJsonPath('data.nome_original', 'contrato.pdf');

    $arquivoId = $resp->json('data.id');
    Storage::disk('local')->assertExists($resp->json('data.caminho_storage'));

    $this->getJson("/api/admin/nr1/{$avaliacao->id}/dossie/00")
        ->assertOk()
        ->assertJsonCount(1, 'data.arquivos');

    $this->get("/api/admin/nr1/{$avaliacao->id}/dossie/arquivos/{$arquivoId}")
        ->assertOk();

    expect(Auditoria::where('acao', 'nr1.dossie.upload')->exists())->toBeTrue();
});

it('aceita subpasta apenas em 06_ACOES_MENSAIS', function () {
    Storage::fake('local');

    $empresa  = criarEmpresa();
    $admin    = criarAdmin($empresa);
    $avaliacao = criarAvaliacaoPgr($empresa, $admin);

    Sanctum::actingAs($admin, ['role:admin']);

    // OK em 06
    $this->postJson("/api/admin/nr1/{$avaliacao->id}/dossie/06", [
        'arquivo'  => UploadedFile::fake()->create('ata.pdf', 50, 'application/pdf'),
        'subpasta' => 'Mes_3',
    ])->assertCreated()
      ->assertJsonPath('data.subpasta', 'Mes_3');

    // Bloqueado em outra pasta
    $this->postJson("/api/admin/nr1/{$avaliacao->id}/dossie/02", [
        'arquivo'  => UploadedFile::fake()->create('q.pdf', 50, 'application/pdf'),
        'subpasta' => 'Mes_X',
    ])->assertUnprocessable();
});

it('excluir arquivo remove storage e registro', function () {
    Storage::fake('local');

    $empresa  = criarEmpresa();
    $admin    = criarAdmin($empresa);
    $avaliacao = criarAvaliacaoPgr($empresa, $admin);

    Sanctum::actingAs($admin, ['role:admin']);

    $upload = $this->postJson("/api/admin/nr1/{$avaliacao->id}/dossie/02", [
        'arquivo' => UploadedFile::fake()->create('q.pdf', 50, 'application/pdf'),
    ])->assertCreated();

    $arquivoId = $upload->json('data.id');
    $caminho   = $upload->json('data.caminho_storage');

    $this->deleteJson("/api/admin/nr1/{$avaliacao->id}/dossie/arquivos/{$arquivoId}")
        ->assertOk();

    Storage::disk('local')->assertMissing($caminho);
    expect(Nr1DossieArquivo::count())->toBe(0)
        ->and(Auditoria::where('acao', 'nr1.dossie.excluir')->exists())->toBeTrue();
});

it('bloqueia upload em pasta inexistente', function () {
    Storage::fake('local');

    $empresa  = criarEmpresa();
    $admin    = criarAdmin($empresa);
    $avaliacao = criarAvaliacaoPgr($empresa, $admin);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson("/api/admin/nr1/{$avaliacao->id}/dossie/99", [
        'arquivo' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf'),
    ])->assertNotFound();
});

it('bloqueia acesso a dossie de outra empresa', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa);
    $outra   = criarEmpresa(['cnpj' => '11.222.333/4444-55']);
    $alheia  = criarAvaliacaoPgr($outra, $admin);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson("/api/admin/nr1/{$alheia->id}/dossie")
        ->assertForbidden();
});

it('gera ZIP do dossie com indice e estrutura', function () {
    Storage::fake('local');

    $empresa  = criarEmpresa();
    $admin    = criarAdmin($empresa);
    $avaliacao = criarAvaliacaoPgr($empresa, $admin);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson("/api/admin/nr1/{$avaliacao->id}/dossie/00", [
        'arquivo' => UploadedFile::fake()->create('contrato.pdf', 30, 'application/pdf'),
    ])->assertCreated();

    $this->postJson("/api/admin/nr1/{$avaliacao->id}/dossie/06", [
        'arquivo'  => UploadedFile::fake()->create('ata-mes1.pdf', 20, 'application/pdf'),
        'subpasta' => 'Mes_1',
    ])->assertCreated();

    $resp = $this->get("/api/admin/nr1/{$avaliacao->id}/dossie/zip");
    $resp->assertOk();
    expect($resp->headers->get('content-type'))->toContain('zip');
    expect(Auditoria::where('acao', 'nr1.dossie.export_zip')->exists())->toBeTrue();
});
