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
        'tipo'                   => 'pontual',
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
        'tipo'                   => 'pontual',
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

it('sincroniza assinatura consolidada no Asaas quando produtos recorrentes sao adicionados, alterados ou removidos', function () {
    config([
        'services.asaas.enabled' => true,
        'services.asaas.api_key' => 'asaas_test_key',
        'services.asaas.base_url' => 'https://sandbox.asaas.com/api/v3',
    ]);

    Http::fake([
        'sandbox.asaas.com/api/v3/customers' => Http::response(['id' => 'cus_123'], 200),
        'sandbox.asaas.com/api/v3/subscriptions' => Http::response([
            'id' => 'sub_unified_999',
            'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_unified_999',
            'lastPayment' => ['id' => 'pay_111'],
        ], 200),
    ]);

    $empresa = criarEmpresa();
    $sa = criarSuperAdmin();

    Sanctum::actingAs($sa, ['role:super_admin']);

    // 1. Hire a recurring product: Plano de Ação (R$ 200)
    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'plano_acao_nr1',
        'tipo'         => 'recorrente_mensal',
        'valor_mensal' => 200.00,
        'data_inicio'  => '2026-06-01',
    ])->assertCreated();

    $empresa = $empresa->fresh();
    expect($empresa->asaas_unified_subscription_id)->toBe('sub_unified_999');

    $prod1 = EmpresaProduto::where('empresa_id', $empresa->id)->where('produto', 'plano_acao_nr1')->first();
    expect($prod1->asaas_subscription_id)->toBe('sub_unified_999')
        ->and((float) $prod1->valor_mensal)->toBe(200.00);

    // 2. Hire another recurring product: Pesquisas (R$ 150)
    // We mock Asaas update request for the unified subscription
    Http::fake([
        'sandbox.asaas.com/api/v3/subscriptions/sub_unified_999' => Http::response([
            'id' => 'sub_unified_999',
            'invoiceUrl' => 'https://sandbox.asaas.com/i/sub_unified_999_updated',
            'lastPayment' => ['id' => 'pay_222'],
        ], 200),
    ]);

    $this->postJson("/api/plataforma/empresas/{$empresa->id}/produtos", [
        'produto'      => 'pesquisas',
        'tipo'         => 'recorrente_mensal',
        'valor_mensal' => 150.00,
        'data_inicio'  => '2026-06-01',
    ])->assertCreated();

    // The active recurring products sum should be R$ 350.00
    // Let's check update body sent to Asaas
    Http::assertSent(function ($request) {
        return $request->url() === 'https://sandbox.asaas.com/api/v3/subscriptions/sub_unified_999'
            && (float) $request['value'] === 350.00;
    });

    // 3. Update status of the first product to paused
    $this->putJson("/api/plataforma/empresas/{$empresa->id}/produtos/{$prod1->id}", [
        'status' => 'pausado',
    ])->assertOk();

    // The active recurring products sum should regress to R$ 150.00
    Http::assertSent(function ($request) {
        return $request->url() === 'https://sandbox.asaas.com/api/v3/subscriptions/sub_unified_999'
            && (float) $request['value'] === 150.00;
    });
});

it('processa webhook unificado do Asaas atualizando o status de todos os produtos recorrentes correspondentes', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $empresa = criarEmpresa(['asaas_unified_subscription_id' => 'sub_unified_999']);
    
    $prod1 = EmpresaProduto::create([
        'empresa_id' => $empresa->id,
        'produto' => 'plano_acao_nr1',
        'tipo' => 'recorrente_mensal',
        'status' => 'ativo',
        'valor_mensal' => 200,
        'asaas_subscription_id' => 'sub_unified_999',
        'data_inicio' => '2026-06-01',
    ]);
    $prod2 = EmpresaProduto::create([
        'empresa_id' => $empresa->id,
        'produto' => 'pesquisas',
        'tipo' => 'recorrente_mensal',
        'status' => 'ativo',
        'valor_mensal' => 150,
        'asaas_subscription_id' => 'sub_unified_999',
        'data_inicio' => '2026-06-01',
    ]);

    // Send a webhook payload indicating subscription overdue (payment overdue)
    $payload = [
        'id' => 'evt_overdue_123',
        'event' => 'PAYMENT_OVERDUE',
        'payment' => [
            'id' => 'pay_999',
            'subscription' => 'sub_unified_999',
            'invoiceUrl' => 'https://sandbox.asaas.com/i/overdue',
            'customer' => $empresa->asaas_customer_id,
        ]
    ];

    $this->postJson('/api/webhooks/asaas', $payload, ['asaas-access-token' => 'webhook-secret'])
        ->assertOk();

    // Verify both products were marked as 'inadimplente'
    expect($prod1->fresh()->status)->toBe('inadimplente')
        ->and($prod2->fresh()->status)->toBe('inadimplente')
        ->and($prod1->fresh()->asaas_invoice_url)->toBe('https://sandbox.asaas.com/i/overdue')
        ->and($prod2->fresh()->asaas_invoice_url)->toBe('https://sandbox.asaas.com/i/overdue');
});
