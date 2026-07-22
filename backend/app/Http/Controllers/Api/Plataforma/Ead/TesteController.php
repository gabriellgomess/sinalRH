<?php

namespace App\Http\Controllers\Api\Plataforma\Ead;

use App\Http\Controllers\Controller;
use App\Models\Ead\Curso;
use App\Models\Ead\Teste;
use App\Models\Ead\TestePergunta;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TesteController extends Controller
{
    public function index(Curso $curso): JsonResponse
    {
        $testes = $curso->testes()->withCount('perguntas')->get();
        return response()->json(['success' => true, 'data' => $testes]);
    }

    public function show(Curso $curso, Teste $teste): JsonResponse
    {
        abort_if((int) $teste->curso_id !== (int) $curso->id, 404);
        $teste->load('perguntas');
        return response()->json(['success' => true, 'data' => $teste]);
    }

    public function store(Request $request, Curso $curso): JsonResponse
    {
        $validated = $request->validate([
            'titulo'                => 'required|string|max:200',
            'descricao'             => 'nullable|string|max:2000',
            'modulo_id'             => 'nullable|integer|exists:ead_modulos,id',
            'nota_minima'           => 'nullable|integer|min:0|max:100',
            'tentativas_max'        => 'nullable|integer|min:1|max:50',
            'embaralhar'            => 'nullable|boolean',
            'obrigatorio_aprovacao' => 'nullable|boolean',
        ]);

        $teste = $curso->testes()->create(array_merge($validated, [
            'nota_minima' => $validated['nota_minima'] ?? 70,
        ]));

        AuditLogger::log($request, 'ead.teste.criar', $curso,
            "Criou teste '{$teste->titulo}' no curso {$curso->titulo}.");

        return response()->json(['success' => true, 'data' => $teste], 201);
    }

    public function update(Request $request, Curso $curso, Teste $teste): JsonResponse
    {
        abort_if((int) $teste->curso_id !== (int) $curso->id, 404);

        $validated = $request->validate([
            'titulo'                => 'sometimes|string|max:200',
            'descricao'             => 'nullable|string|max:2000',
            'modulo_id'             => 'nullable|integer|exists:ead_modulos,id',
            'nota_minima'           => 'nullable|integer|min:0|max:100',
            'tentativas_max'        => 'nullable|integer|min:1|max:50',
            'embaralhar'            => 'nullable|boolean',
            'obrigatorio_aprovacao' => 'nullable|boolean',
        ]);

        $teste->update($validated);
        return response()->json(['success' => true, 'data' => $teste->fresh()]);
    }

    public function destroy(Request $request, Curso $curso, Teste $teste): JsonResponse
    {
        abort_if((int) $teste->curso_id !== (int) $curso->id, 404);
        $teste->delete();
        return response()->json(['success' => true, 'message' => 'Teste removido.']);
    }

    // ── Perguntas ─────────────────────────────────────────────────────────
    public function storePergunta(Request $request, Curso $curso, Teste $teste): JsonResponse
    {
        abort_if((int) $teste->curso_id !== (int) $curso->id, 404);
        $validated = $this->validarPergunta($request);

        $pergunta = $teste->perguntas()->create(array_merge($validated, [
            'ordem' => $validated['ordem'] ?? ($teste->perguntas()->max('ordem') + 1),
        ]));

        return response()->json(['success' => true, 'data' => $pergunta], 201);
    }

    public function updatePergunta(Request $request, Curso $curso, Teste $teste, TestePergunta $pergunta): JsonResponse
    {
        abort_if((int) $teste->curso_id !== (int) $curso->id, 404);
        abort_if((int) $pergunta->teste_id !== (int) $teste->id, 404);

        $validated = $this->validarPergunta($request, false);
        $pergunta->update($validated);

        return response()->json(['success' => true, 'data' => $pergunta->fresh()]);
    }

    public function destroyPergunta(Request $request, Curso $curso, Teste $teste, TestePergunta $pergunta): JsonResponse
    {
        abort_if((int) $teste->curso_id !== (int) $curso->id, 404);
        abort_if((int) $pergunta->teste_id !== (int) $teste->id, 404);
        $pergunta->delete();
        return response()->json(['success' => true, 'message' => 'Pergunta removida.']);
    }

    private function validarPergunta(Request $request, bool $criando = true): array
    {
        $req = $criando ? 'required' : 'sometimes';

        $data = $request->validate([
            'enunciado'          => "$req|string|max:1000",
            'tipo'               => "$req|in:multipla_escolha,verdadeiro_falso",
            'opcoes'             => 'nullable|array',
            'opcoes.*'           => 'string|max:500',
            'resposta_correta'   => "$req|array|min:1",
            'resposta_correta.*' => 'integer|min:0',
            'peso'               => 'nullable|integer|min:1|max:10',
            'ordem'              => 'nullable|integer|min:0',
        ]);

        // Verdadeiro/Falso normaliza opcoes.
        if (($data['tipo'] ?? null) === 'verdadeiro_falso') {
            $data['opcoes'] = ['Verdadeiro', 'Falso'];
        }

        return $data;
    }
}
