<?php

use App\Mail\ColaboradorConviteMail;
use App\Models\Auditoria;
use App\Models\Colaborador;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

it('envia convite e permite o colaborador definir senha', function () {
    Mail::fake();

    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa);
    $colaborador = Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id' => $setor->id,
        'nome' => 'Maria Silva',
        'email' => 'maria@example.com',
        'cpf' => '000.000.000-00',
        'codigo_acesso' => 'MARIA001',
        'password' => 'senha-antiga',
        'status' => 'ativo',
    ]);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->postJson("/api/admin/colaboradores/{$colaborador->id}/convite")
        ->assertOk()
        ->assertJsonPath('message', 'Convite enviado por e-mail.');

    $colaborador->refresh();

    expect($colaborador->convite_token)->not->toBeNull()
        ->and($colaborador->convite_expira_em)->not->toBeNull();

    Mail::assertQueued(ColaboradorConviteMail::class);

    $this->getJson("/api/auth/colaborador/convite/{$colaborador->convite_token}")
        ->assertOk()
        ->assertJsonPath('email', 'maria@example.com');

    $this->postJson("/api/auth/colaborador/convite/{$colaborador->convite_token}", [
        'senha' => 'nova123',
        'senha_confirmation' => 'nova123',
    ])->assertOk();

    $colaborador->refresh();

    expect($colaborador->convite_token)->toBeNull()
        ->and($colaborador->convite_aceito_em)->not->toBeNull();

    $this->postJson('/api/auth/colaborador/login', [
        'login' => 'maria@example.com',
        'senha' => 'nova123',
    ])->assertOk()->assertJsonPath('tipo', 'colaborador');

    expect(Auditoria::where('acao', 'colaborador.convite')->exists())->toBeTrue();
});
