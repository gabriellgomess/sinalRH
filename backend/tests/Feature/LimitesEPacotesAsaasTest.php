<?php

use App\Models\Auditoria;
use App\Models\Colaborador;
use App\Models\EmpresaProduto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('nao sincroniza max_colaboradores com limite_colaboradores no store do produto', function () {
    $empresa = criarEmpresa(['max_colaboradores' => 5]);
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    $resp = $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'                => 'diagnostico_nr1',
        'tipo'                   => 'unica',
        'valor_unitario'         => 30.00,
        'quantidade_aplicacoes'  => 2,
        'limite_colaboradores'   => 10,
        'data_inicio'            => '2026-06-01',
    ])->assertCreated();

    expect($empresa->fresh()->max_colaboradores)->toBe(5);
});

it('bloqueia respostas do diagnostico nr1 quando o limite_colaboradores do produto e atingido', function () {
    $empresa = criarEmpresa(['max_colaboradores' => 100]);
    $admin = criarAdmin($empresa);
    $sa = criarSuperAdmin();
    $setor = criarSetor($empresa);

    // Contrata o produto diagnostico_nr1 com limite de 1 colaborador
    Sanctum::actingAs($sa, ['role:super_admin']);
    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'                => 'diagnostico_nr1',
        'tipo'                   => 'unica',
        'valor_unitario'         => 30.00,
        'quantidade_aplicacoes'  => 2,
        'limite_colaboradores'   => 1,
        'data_inicio'            => '2026-06-01',
        'status'                 => 'ativo',
    ])->assertCreated();

    // Cria a avaliação
    Sanctum::actingAs($admin, ['role:admin']);
    $response = $this->postJson('/api/admin/nr1', [
        'titulo' => 'Avaliacao NR-1 Teste Limite',
        'aplicada_em' => '2026-05-18',
    ])->assertCreated();

    $avaliacaoId = $response->json('data.id');
    $codigo = $response->json('data.codigo');

    $this->postJson("/api/admin/nr1/{$avaliacaoId}/publicar")->assertOk();

    // Helper para gerar as 40 respostas exigidas
    $respostas = [];
    for ($secao = 1; $secao <= 10; $secao++) {
        for ($item = 1; $item <= 4; $item++) {
            $respostas[] = [
                'secao' => $secao,
                'item' => $item,
                'valor' => '5',
            ];
        }
    }

    // Primeira resposta pública deve passar
    $this->postJson("/api/nr1/{$codigo}/responder", [
        'setor_id' => $setor->id,
        'sexo' => 'nao_informado',
        'faixa_etaria' => '19_34',
        'respostas' => $respostas,
    ])->assertOk();

    // Show público deve retornar bloqueado e sinalizar limite excedido
    $this->getJson("/api/nr1/{$codigo}")
        ->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('excedeu_limite', true);

    // Segunda resposta pública deve falhar (excedeu limite do diagnostico = 1)
    $this->postJson("/api/nr1/{$codigo}/responder", [
        'setor_id' => $setor->id,
        'sexo' => 'nao_informado',
        'faixa_etaria' => '19_34',
        'respostas' => $respostas,
    ])->assertStatus(422)
      ->assertJsonPath('success', false)
      ->assertJsonStructure(['message']);
});

it('bloqueia cadastro de colaborador quando o limite max_colaboradores da empresa e atingido', function () {
    $empresa = criarEmpresa(['max_colaboradores' => 2]);
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa);

    // Create 2 active collaborators
    Colaborador::create([
        'empresa_id' => $empresa->id,
        'nome' => 'Colab 1',
        'email' => 'colab1@test.com',
        'setor_id' => $setor->id,
        'status' => 'ativo',
        'password' => 'secret123',
    ]);
    Colaborador::create([
        'empresa_id' => $empresa->id,
        'nome' => 'Colab 2',
        'email' => 'colab2@test.com',
        'setor_id' => $setor->id,
        'status' => 'ativo',
        'password' => 'secret123',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    // Attempt to create a 3rd active collaborator
    $this->postJson('/api/admin/colaboradores', [
        'nome' => 'Colab 3',
        'email' => 'colab3@test.com',
        'setor_id' => $setor->id,
        'senha' => 'secret123',
    ])->assertStatus(422)
      ->assertJsonStructure(['message']);
});

it('respeita limite no fluxo de importacao por CSV', function () {
    $empresa = criarEmpresa(['max_colaboradores' => 1]);
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
        ->assertJsonPath('importados', 1)
        ->assertJsonCount(1, 'erros');
});
