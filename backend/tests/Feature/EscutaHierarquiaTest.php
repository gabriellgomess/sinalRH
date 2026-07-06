<?php

use App\Models\Colaborador;
use App\Models\EscutaAcesso;
use App\Models\EscutaNota;
use App\Models\RelatoEscuta;
use App\Mail\EscutaComiteMail;
use App\Mail\EscutaNovoRelatoMail;
use App\Services\EscutaRoteamentoService;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

require_once __DIR__.'/Support/TestModels.php';

function colabEscuta(App\Models\Empresa $empresa, $setorId = null): Colaborador
{
    static $seq = 0;
    $seq++;
    return Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id'   => $setorId,
        'nome'       => "Denunciante {$seq}",
        'email'      => "denunciante{$seq}@teste.com",
        'password'   => 'secret123',
        'status'     => 'ativo',
    ]);
}

function enviarRelato(Colaborador $colab, array $extra = []): void
{
    Sanctum::actingAs($colab, ['role:colaborador']);
    test()->postJson('/api/app/escuta', array_merge([
        'modo'           => 'anonimo',
        'categoria'      => 'lideranca',
        'texto'          => 'Relato de teste com conteudo suficiente.',
        'tipo_envolvido' => 'colaborador_setor',
    ], $extra))->assertCreated();
}

// ── Roteamento (servico) ─────────────────────────────────────────────────
it('roteia pela escolha do colaborador com escalada de conflito', function () {
    $svc = new EscutaRoteamentoService();

    expect($svc->calcular('colaborador_setor')['grupo_destino'])->toBe('rh')
        ->and($svc->calcular('lideranca')['grupo_destino'])->toBe('rh')
        ->and($svc->calcular('rh')['grupo_destino'])->toBe('diretoria')
        ->and($svc->calcular('diretoria')['grupo_destino'])->toBe('presidencia')
        ->and($svc->calcular('presidencia')['grupo_destino'])->toBe('comite_externo')
        ->and($svc->calcular('nao_sabe')['grupo_destino'])->toBe('rh')
        ->and($svc->calcular('nao_informar')['grupo_destino'])->toBe('rh');

    // comite externo => sigilo maximo
    expect($svc->calcular('presidencia')['nivel_sigilo'])->toBe('maximo');
});

it('escala acima do grupo do usuario denunciado', function () {
    $svc = new EscutaRoteamentoService();
    // denuncia marcada como "colaborador" mas o denunciado e do RH => sobe p/ diretoria
    expect($svc->calcular('colaborador_setor', 'rh')['grupo_destino'])->toBe('diretoria');
});

it('grava grupo_destino ao enviar relato (rh -> diretoria)', function () {
    $empresa = criarEmpresa();
    $colab   = colabEscuta($empresa);

    enviarRelato($colab, ['tipo_envolvido' => 'rh']);

    expect(RelatoEscuta::first()->grupo_destino)->toBe('diretoria');
});

// ── Isolamento por grupo ─────────────────────────────────────────────────
it('usuario so ve relatos destinados ao seu grupo', function () {
    $empresa = criarEmpresa();
    $rh        = criarAdmin($empresa, ['grupo_escuta' => 'rh']);
    $diretoria = criarAdmin($empresa, ['grupo_escuta' => 'diretoria']);

    RelatoEscuta::create(['empresa_id' => $empresa->id, 'modo' => 'anonimo', 'categoria' => 'x', 'texto' => 'aaaaaaaaaa', 'grupo_destino' => 'rh', 'status' => 'pendente', 'prioridade' => 'media']);
    RelatoEscuta::create(['empresa_id' => $empresa->id, 'modo' => 'anonimo', 'categoria' => 'x', 'texto' => 'bbbbbbbbbb', 'grupo_destino' => 'diretoria', 'status' => 'pendente', 'prioridade' => 'media']);

    Sanctum::actingAs($rh, ['role:admin']);
    expect($this->getJson('/api/admin/escuta')->assertOk()->json('total'))->toBe(1);

    Sanctum::actingAs($diretoria, ['role:admin']);
    expect($this->getJson('/api/admin/escuta')->assertOk()->json('total'))->toBe(1);
});

it('usuario sem grupo de escuta nao ve nada', function () {
    $empresa = criarEmpresa();
    $admin   = criarAdmin($empresa); // sem grupo_escuta
    RelatoEscuta::create(['empresa_id' => $empresa->id, 'modo' => 'anonimo', 'categoria' => 'x', 'texto' => 'aaaaaaaaaa', 'grupo_destino' => 'rh', 'status' => 'pendente', 'prioridade' => 'media']);

    Sanctum::actingAs($admin, ['role:admin']);
    $this->getJson('/api/admin/escuta')->assertOk()->assertJsonPath('sem_grupo', true);
});

// ── Conflito de interesse ────────────────────────────────────────────────
it('denunciado nao ve o proprio relato mesmo sendo do grupo', function () {
    $empresa = criarEmpresa();
    $rhA = criarAdmin($empresa, ['grupo_escuta' => 'rh']);
    $rhB = criarAdmin($empresa, ['grupo_escuta' => 'rh']);

    $relato = RelatoEscuta::create([
        'empresa_id' => $empresa->id, 'modo' => 'anonimo', 'categoria' => 'x', 'texto' => 'aaaaaaaaaa',
        'grupo_destino' => 'rh', 'status' => 'pendente', 'prioridade' => 'media',
        'usuario_denunciado_id' => $rhA->id,
    ]);

    // rhA e o denunciado -> nao lista e nao abre
    Sanctum::actingAs($rhA, ['role:admin']);
    expect($this->getJson('/api/admin/escuta')->json('total'))->toBe(0);
    $this->getJson("/api/admin/escuta/{$relato->id}")->assertForbidden();

    // rhB (mesmo grupo, nao denunciado) ve normalmente
    Sanctum::actingAs($rhB, ['role:admin']);
    expect($this->getJson('/api/admin/escuta')->json('total'))->toBe(1);
    $this->getJson("/api/admin/escuta/{$relato->id}")->assertOk();
});

it('relato de comite externo nao e visivel a nenhum usuario interno', function () {
    $empresa = criarEmpresa();
    $presidencia = criarAdmin($empresa, ['grupo_escuta' => 'presidencia']);

    $relato = RelatoEscuta::create(['empresa_id' => $empresa->id, 'modo' => 'anonimo', 'categoria' => 'x', 'texto' => 'aaaaaaaaaa', 'grupo_destino' => 'comite_externo', 'status' => 'pendente', 'prioridade' => 'critica']);

    Sanctum::actingAs($presidencia, ['role:admin']);
    expect($this->getJson('/api/admin/escuta')->json('total'))->toBe(0);
    $this->getJson("/api/admin/escuta/{$relato->id}")->assertForbidden();
});

// ── Sigilo ───────────────────────────────────────────────────────────────
it('relato anonimo nunca grava colaborador_id', function () {
    $empresa = criarEmpresa();
    $colab   = colabEscuta($empresa);

    enviarRelato($colab, ['modo' => 'anonimo']);

    expect(RelatoEscuta::first()->colaborador_id)->toBeNull();
});

it('mostra identidade so quando identificado', function () {
    $empresa = criarEmpresa();
    $rh      = criarAdmin($empresa, ['grupo_escuta' => 'rh']);
    $colab   = colabEscuta($empresa);

    enviarRelato($colab, ['modo' => 'identificado', 'tipo_envolvido' => 'colaborador_setor']);
    $relato = RelatoEscuta::first();

    Sanctum::actingAs($rh, ['role:admin']);
    $this->getJson("/api/admin/escuta/{$relato->id}")
        ->assertOk()
        ->assertJsonPath('colaborador.id', $colab->id);
});

// ── Rastreabilidade + notas + assumir ────────────────────────────────────
it('registra auditoria de acesso e acoes', function () {
    $empresa = criarEmpresa();
    $rh      = criarAdmin($empresa, ['grupo_escuta' => 'rh']);
    $relato  = RelatoEscuta::create(['empresa_id' => $empresa->id, 'modo' => 'anonimo', 'categoria' => 'x', 'texto' => 'aaaaaaaaaa', 'grupo_destino' => 'rh', 'status' => 'pendente', 'prioridade' => 'media']);

    Sanctum::actingAs($rh, ['role:admin']);
    $this->getJson("/api/admin/escuta/{$relato->id}")->assertOk();
    $this->postJson("/api/admin/escuta/{$relato->id}/assumir")->assertOk();
    $this->postJson("/api/admin/escuta/{$relato->id}/nota", ['nota' => 'Primeira analise'])->assertCreated();
    $this->postJson("/api/admin/escuta/{$relato->id}/nota", ['nota' => 'Segunda analise'])->assertCreated();
    $this->putJson("/api/admin/escuta/{$relato->id}/status", ['status' => 'arquivado'])->assertOk();

    expect(EscutaNota::where('relato_id', $relato->id)->count())->toBe(2)
        ->and($relato->fresh()->atendido_por)->toBe($rh->id)
        ->and($relato->fresh()->status)->toBe('arquivado');

    expect(EscutaAcesso::where('relato_id', $relato->id)->pluck('acao')->all())
        ->toContain('visualizou', 'assumiu', 'adicionou_nota', 'arquivou');
});

// ── Notificacao por e-mail ────────────────────────────────────────────────
it('notifica o comite externo por e-mail quando o destino e comite', function () {
    Mail::fake();
    $empresa = criarEmpresa(['escuta_comite_email' => 'comite@externo.com']);
    $colab   = colabEscuta($empresa);

    enviarRelato($colab, ['tipo_envolvido' => 'presidencia']);

    expect(RelatoEscuta::first()->grupo_destino)->toBe('comite_externo');
    Mail::assertQueued(EscutaComiteMail::class);
});

it('notifica o grupo interno responsavel (sem conteudo)', function () {
    Mail::fake();
    $empresa = criarEmpresa();
    criarAdmin($empresa, ['grupo_escuta' => 'rh', 'email' => 'rh@empresa.test']);
    $colab   = colabEscuta($empresa);

    enviarRelato($colab, ['tipo_envolvido' => 'colaborador_setor']);

    Mail::assertQueued(EscutaNovoRelatoMail::class);
});
