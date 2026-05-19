<?php

use App\Mail\RelatorioMail;
use App\Models\Auditoria;
use App\Models\Relatorio;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('envia relatorio pronto por email e registra auditoria', function () {
    Mail::fake();

    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);

    $relatorio = Relatorio::create([
        'empresa_id' => $empresa->id,
        'criado_por' => $admin->id,
        'periodo' => '2026-Q2',
        'tipo' => 'executivo',
        'status' => 'pronto',
        'resumo_executivo' => 'Resumo executivo de teste.',
        'pontos_positivos' => ['Boa comunicacao'],
        'pontos_atencao' => ['Carga de trabalho'],
        'recomendacoes' => ['Revisar prioridades'],
        'plano_acao' => [
            [
                'acao' => 'Reuniao com liderancas',
                'responsavel' => 'RH',
                'prazo' => '30 dias',
            ],
        ],
        'gerado_por_ia' => true,
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson("/api/admin/relatorios/{$relatorio->id}/enviar", [
        'emails' => ['diretoria@example.com', 'rh@example.com'],
    ])->assertOk()
        ->assertJsonPath('message', 'Relatorio enviado por e-mail.');

    Mail::assertQueued(RelatorioMail::class, 2);

    expect(Auditoria::where('acao', 'relatorio.enviar_email')->exists())->toBeTrue();
});
