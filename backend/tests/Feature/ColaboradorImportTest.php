<?php

use App\Models\Auditoria;
use App\Models\Colaborador;
use App\Models\Setor;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('importa colaboradores e cria setores por unidade', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);

    Sanctum::actingAs($admin, ['role:admin']);

    $csv = implode("\n", [
        'nome;email;cpf;cargo;unidade;setor;data_admissao',
        'Maria Silva;maria@example.com;111.111.111-11;Analista;Matriz SP;Financeiro;01/01/2024',
        'Joao Santos;joao@example.com;222.222.222-22;Coordenador;Filial RJ;Financeiro;2024-02-10',
    ]);

    $arquivo = UploadedFile::fake()->createWithContent('colaboradores.csv', $csv);

    $this->postJson('/api/admin/colaboradores/importar', [
        'arquivo' => $arquivo,
    ])->assertOk()
        ->assertJsonPath('importados', 2)
        ->assertJsonPath('setores_criados', 2);

    expect(Colaborador::where('empresa_id', $empresa->id)->count())->toBe(2)
        ->and(Setor::where('empresa_id', $empresa->id)->where('nome', 'Financeiro')->count())->toBe(2)
        ->and(Setor::where('empresa_id', $empresa->id)->where('unidade', 'Matriz SP')->exists())->toBeTrue()
        ->and(Setor::where('empresa_id', $empresa->id)->where('unidade', 'Filial RJ')->exists())->toBeTrue()
        ->and(Auditoria::where('acao', 'colaboradores.importar')->exists())->toBeTrue();
});
