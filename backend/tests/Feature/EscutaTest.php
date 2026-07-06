<?php

use App\Models\Colaborador;
use App\Models\EscutaNota;
use App\Models\RelatoEscuta;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/Support/TestModels.php';

it('admin nao recebe id_colaborador ou nota_interna na listagem de relatos', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa, ['grupo_escuta' => 'rh']);
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
        'grupo_destino' => 'rh',
        'nota_interna' => 'Uma nota secreta do RH',
    ]);

    $response = $this->actingAs($admin)->getJson('/api/admin/escuta');

    $response->assertOk();
    // Deve listar o relato do grupo, mas nunca expor identidade/nota na listagem.
    $response->assertJsonCount(1, 'data');
    $response->assertJsonMissingPath('data.0.colaborador_id');
    $response->assertJsonMissingPath('data.0.nota_interna');
});

it('admin ve notas e dados do colaborador apenas se identificado (do seu grupo)', function () {
    $empresa = criarEmpresa();
    $admin = criarAdmin($empresa, ['grupo_escuta' => 'rh']);
    $setor = criarSetor($empresa);

    $colaborador = Colaborador::create([
        'nome' => 'Colaborador Test',
        'email' => 'colab@escuta.test',
        'password' => Hash::make('secret123'),
        'empresa_id' => $empresa->id,
        'setor_id' => $setor->id,
    ]);

    $relatoIdentificado = RelatoEscuta::create([
        'empresa_id' => $empresa->id,
        'colaborador_id' => $colaborador->id,
        'setor_id' => $setor->id,
        'modo' => 'identificado',
        'categoria' => 'sugestao',
        'texto' => 'Texto do relato de teste 1 com mais de dez caracteres.',
        'status' => 'pendente',
        'prioridade' => 'media',
        'grupo_destino' => 'rh',
    ]);
    EscutaNota::create(['relato_id' => $relatoIdentificado->id, 'autor_id' => $admin->id, 'nota' => 'Nota 1']);

    $relatoAnonimo = RelatoEscuta::create([
        'empresa_id' => $empresa->id,
        'colaborador_id' => null,
        'setor_id' => $setor->id,
        'modo' => 'anonimo',
        'categoria' => 'assedio',
        'texto' => 'Texto do relato de teste 2 com mais de dez caracteres.',
        'status' => 'pendente',
        'prioridade' => 'alta',
        'grupo_destino' => 'rh',
    ]);

    // Identificado: mostra colaborador + histórico de notas.
    $resIdentificado = $this->actingAs($admin)->getJson("/api/admin/escuta/{$relatoIdentificado->id}");
    $resIdentificado->assertOk();
    $resIdentificado->assertJsonPath('colaborador.nome', 'Colaborador Test');
    $resIdentificado->assertJsonPath('colaborador.email', 'colab@escuta.test');
    $resIdentificado->assertJsonPath('notas.0.nota', 'Nota 1');

    // Anônimo: identidade nunca exposta.
    $resAnonimo = $this->actingAs($admin)->getJson("/api/admin/escuta/{$relatoAnonimo->id}");
    $resAnonimo->assertOk();
    $resAnonimo->assertJsonPath('colaborador', null);
});
