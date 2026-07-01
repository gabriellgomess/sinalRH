<?php

use App\Models\AsaasEvento;
use App\Models\EmpresaProduto;

require_once __DIR__.'/Support/TestModels.php';

it('persiste evento na primeira chegada e marca como processed', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $empresa = criarEmpresa();
    $produto = EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'plano_acao_nr1',
        'tipo'        => 'recorrente',
        'valor_mensal'=> 1500,
        'data_inicio' => '2026-06-01',
        'status'      => 'ativo',
        'asaas_subscription_id' => 'sub_idem_1',
        'asaas_payment_id'      => 'pay_idem_1',
    ]);

    $this->postJson('/api/webhooks/asaas', [
        'id'      => 'evt_unique_1',
        'event'   => 'PAYMENT_RECEIVED',
        'payment' => [
            'id'                => 'pay_idem_1',
            'subscription'      => 'sub_idem_1',
            'externalReference' => "empresa_produto:{$produto->id}",
        ],
    ], ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('processed', true)
        ->assertJsonMissingPath('duplicate');

    expect(AsaasEvento::count())->toBe(1);
    $ev = AsaasEvento::first();
    expect($ev->resultado)->toBe('processed')
        ->and($ev->empresa_produto_id)->toBe($produto->id)
        ->and($ev->processado_em)->not->toBeNull();
});

it('nao reprocessa quando o mesmo evento chega novamente (idempotencia)', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $empresa = criarEmpresa();
    $produto = EmpresaProduto::create([
        'empresa_id'  => $empresa->id,
        'produto'     => 'plano_acao_nr1',
        'tipo'        => 'recorrente',
        'valor_mensal'=> 1500,
        'data_inicio' => '2026-06-01',
        'status'      => 'ativo',
        'asaas_subscription_id' => 'sub_dup',
        'asaas_payment_id'      => 'pay_dup',
    ]);

    $payload = [
        'id'      => 'evt_duplicate_42',
        'event'   => 'PAYMENT_OVERDUE',
        'payment' => [
            'id'                => 'pay_dup',
            'subscription'      => 'sub_dup',
            'externalReference' => "empresa_produto:{$produto->id}",
        ],
    ];

    // 1a entrega: processa e marca inadimplente
    $this->postJson('/api/webhooks/asaas', $payload, ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('processed', true)
        ->assertJsonMissingPath('duplicate');

    expect($produto->fresh()->status)->toBe('inadimplente')
        ->and(AsaasEvento::count())->toBe(1);

    $eventoOriginal = AsaasEvento::first();
    $processadoOriginal = $eventoOriginal->processado_em;
    expect($processadoOriginal)->not->toBeNull();

    // Espera um pouco para que um eventual re-processamento gere timestamp diferente
    sleep(1);

    // 2a entrega do MESMO evento: deve responder duplicate sem reprocessar
    $this->postJson('/api/webhooks/asaas', $payload, ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('duplicate', true);

    // Idempotencia: nao criou novo evento e nao tocou no original
    expect(AsaasEvento::count())->toBe(1)
        ->and(AsaasEvento::first()->processado_em->equalTo($processadoOriginal))->toBeTrue();
});

it('rejeita webhook com token invalido', function () {
    config(['services.asaas.webhook_token' => 'segredo']);

    $this->postJson('/api/webhooks/asaas', ['id' => 'evt_x', 'event' => 'PAYMENT_RECEIVED'], [
        'asaas-access-token' => 'errado',
    ])->assertUnauthorized();

    expect(AsaasEvento::count())->toBe(0);
});

it('registra evento mesmo sem produto correspondente (resultado=skipped)', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $this->postJson('/api/webhooks/asaas', [
        'id'      => 'evt_orphan',
        'event'   => 'PAYMENT_RECEIVED',
        'payment' => ['id' => 'pay_inexistente'],
    ], ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('processed', false);

    $ev = AsaasEvento::first();
    expect($ev->resultado)->toBe('skipped')
        ->and($ev->empresa_produto_id)->toBeNull();
});
