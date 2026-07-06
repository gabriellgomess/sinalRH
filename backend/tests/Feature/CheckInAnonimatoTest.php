<?php

use App\Models\CheckIn;
use App\Models\Colaborador;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

function checkinPara(App\Models\Empresa $empresa, $setor, bool $anonimo): CheckIn
{
    static $seq = 0;
    $seq++;
    $colab = Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id'   => $setor->id,
        'nome'       => "Fulano {$seq}",
        'email'      => "fulano{$seq}@teste.com",
        'password'   => 'secret123',
        'status'     => 'ativo',
    ]);

    return CheckIn::create([
        'empresa_id'     => $empresa->id,
        'colaborador_id' => $colab->id,
        'setor_id'       => $setor->id,
        'humor'          => 4,
        'semana'         => CheckIn::semanaAtual(),
        'anonimo'        => $anonimo,
    ]);
}

it('esconde a identidade do colaborador em check-in anonimo (index)', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa);
    $setor   = criarSetor($empresa);

    checkinPara($empresa, $setor, true);   // anonimo
    checkinPara($empresa, $setor, false);  // identificado

    Sanctum::actingAs($admin, ['role:admin']);

    $resp = $this->getJson('/api/admin/checkins')->assertOk()->json('data');

    $anon = collect($resp)->firstWhere('anonimo', true);
    $ident = collect($resp)->firstWhere('anonimo', false);

    expect($anon['colaborador'])->toBeNull()
        ->and(array_key_exists('colaborador_id', $anon))->toBeFalse()
        ->and($ident['colaborador'])->not->toBeNull()
        ->and($ident['colaborador']['nome'])->not->toBeEmpty();
});

it('esconde a identidade em check-in anonimo (porSemana) mas mantem agregado por setor', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa);
    $setor   = criarSetor($empresa);

    checkinPara($empresa, $setor, true);

    Sanctum::actingAs($admin, ['role:admin']);
    $semana = CheckIn::semanaAtual();

    $resp = $this->getJson("/api/admin/checkins/semana/{$semana}")->assertOk();

    $resp->assertJsonPath('checkins.0.colaborador', null);
    expect($resp->json('por_setor'))->not->toBeEmpty();
});

it('resumo retorna evolucao e historico', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa);
    $setor   = criarSetor($empresa);

    checkinPara($empresa, $setor, false);

    Sanctum::actingAs($admin, ['role:admin']);

    $this->getJson('/api/admin/checkins/resumo')
        ->assertOk()
        ->assertJsonStructure([
            'semana', 'media_humor', 'participacao',
            'evolucao', 'historico', 'distribuicao',
        ]);
});
