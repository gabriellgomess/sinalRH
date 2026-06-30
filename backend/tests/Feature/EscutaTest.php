<?php

use App\Models\User;
use App\Models\Colaborador;
use App\Models\RelatoEscuta;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/Support/TestModels.php';

it('admin nao recebe id_colaborador ou nota_interna na listagem de relatos', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa);

    $colaborador = Colaborador::create([
        'nome' => 'Colaborador Test',
        'email' => 'colab@escuta.test',
        'password' => Hash::make('secret123'),
        'empresa_id' => $empresa->id,
        'setor_id' => $setor->id,
    ]);

    RelatoEscuta::create([
        'empresa_id' => $empresa->id,
        'colaborador_id' => $colaborador->id,
        'setor_id' => $setor->id,
        'modo' => 'identificado',
        'categoria' => 'sugestao',
        'texto' => 'Texto do relato de teste com mais de dez caracteres.',
        'status' => 'pendente',
        'prioridade' => 'media',
        'nota_interna' => 'Uma nota secreta do RH',
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/escuta');

    $response->assertOk();
    $response->assertJsonMissingPath('data.0.colaborador_id');
    $response->assertJsonMissingPath('data.0.nota_interna');
});

it('admin consegue ver nota_interna de qualquer relato e dados do colaborador apenas se identificado', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa);
    $setor = criarSetor($empresa);

    $colaborador = Colaborador::create([
        'nome' => 'Colaborador Test',
        'email' => 'colab@escuta.test',
        'password' => Hash::make('secret123'),
        'empresa_id' => $empresa->id,
        'setor_id' => $setor->id,
    ]);

    // Relato 1: Identificado
    $relatoIdentificado = RelatoEscuta::create([
        'empresa_id' => $empresa->id,
        'colaborador_id' => $colaborador->id,
        'setor_id' => $setor->id,
        'modo' => 'identificado',
        'categoria' => 'sugestao',
        'texto' => 'Texto do relato de teste 1 com mais de dez caracteres.',
        'status' => 'pendente',
        'prioridade' => 'media',
        'nota_interna' => 'Nota 1',
    ]);

    // Relato 2: Anonimo
    $relatoAnonimo = RelatoEscuta::create([
        'empresa_id' => $empresa->id,
        'colaborador_id' => null,
        'setor_id' => $setor->id,
        'modo' => 'anonimo',
        'categoria' => 'assedio',
        'texto' => 'Texto do relato de teste 2 com mais de dez caracteres.',
        'status' => 'pendente',
        'prioridade' => 'alta',
        'nota_interna' => 'Nota 2',
    ]);

    // 1. Verificar relato identificado
    $resIdentificado = $this->actingAs($admin)
        ->getJson("/api/admin/escuta/{$relatoIdentificado->id}");

    $resIdentificado->assertOk();
    $resIdentificado->assertJsonPath('colaborador.nome', 'Colaborador Test');
    $resIdentificado->assertJsonPath('colaborador.email', 'colab@escuta.test');
    $resIdentificado->assertJsonPath('nota_interna', 'Nota 1');

    // 2. Verificar relato anonimo
    $resAnonimo = $this->actingAs($admin)
        ->getJson("/api/admin/escuta/{$relatoAnonimo->id}");

    $resAnonimo->assertOk();
    $resAnonimo->assertJsonPath('colaborador', null);
    $resAnonimo->assertJsonPath('nota_interna', 'Nota 2');
});
