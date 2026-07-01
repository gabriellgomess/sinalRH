<?php

use App\Models\AsaasEvento;
use App\Models\Cobranca;

require_once __DIR__.'/Support/TestModels.php';

it('persiste evento na primeira chegada e marca como processed', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $empresa = criarEmpresa();
    $cobranca = Cobranca::create([
        'empresa_id'            => $empresa->id,
        'tipo'                  => 'recorrente',
        'descricao'             => 'Mensal',
        'valor'                 => 1500,
        'ciclo'                 => 'MONTHLY',
        'status'                => 'ativa',
        'asaas_subscription_id' => 'sub_idem_1',
        'asaas_payment_id'      => 'pay_idem_1',
    ]);

    $this->postJson('/api/webhooks/asaas', [
        'id'      => 'evt_unique_1',
        'event'   => 'PAYMENT_RECEIVED',
        'payment' => [
            'id'                => 'pay_idem_1',
            'subscription'      => 'sub_idem_1',
            'externalReference' => "cobranca:{$cobranca->id}",
        ],
    ], ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('processed', true)
        ->assertJsonMissingPath('duplicate');

    expect(AsaasEvento::count())->toBe(1);
    $ev = AsaasEvento::first();
    expect($ev->resultado)->toBe('processed')
        ->and($ev->empresa_cobranca_id)->toBe($cobranca->id)
        ->and($ev->processado_em)->not->toBeNull();
});

it('nao reprocessa quando o mesmo evento chega novamente (idempotencia)', function () {
    config(['services.asaas.webhook_token' => 'webhook-secret']);

    $empresa = criarEmpresa();
    $cobranca = Cobranca::create([
        'empresa_id'            => $empresa->id,
        'tipo'                  => 'recorrente',
        'descricao'             => 'Mensal',
        'valor'                 => 1500,
        'ciclo'                 => 'MONTHLY',
        'status'                => 'ativa',
        'asaas_subscription_id' => 'sub_dup',
        'asaas_payment_id'      => 'pay_dup',
    ]);

    $payload = [
        'id'      => 'evt_duplicate_42',
        'event'   => 'PAYMENT_OVERDUE',
        'payment' => [
            'id'                => 'pay_dup',
            'subscription'      => 'sub_dup',
            'externalReference' => "cobranca:{$cobranca->id}",
        ],
    ];

    // 1a entrega: processa e marca atrasada
    $this->postJson('/api/webhooks/asaas', $payload, ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('processed', true)
        ->assertJsonMissingPath('duplicate');

    expect($cobranca->fresh()->status)->toBe('atrasada')
        ->and(AsaasEvento::count())->toBe(1);

    $eventoOriginal = AsaasEvento::first();
    $processadoOriginal = $eventoOriginal->processado_em;
    expect($processadoOriginal)->not->toBeNull();

    sleep(1);

    // 2a entrega do MESMO evento: deve responder duplicate sem reprocessar
    $this->postJson('/api/webhooks/asaas', $payload, ['asaas-access-token' => 'webhook-secret'])
        ->assertOk()
        ->assertJsonPath('duplicate', true);

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

it('registra evento mesmo sem cobranca correspondente (resultado=skipped)', function () {
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
        ->and($ev->empresa_cobranca_id)->toBeNull();
});
