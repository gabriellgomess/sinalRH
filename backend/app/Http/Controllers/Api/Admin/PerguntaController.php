<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pergunta;
use App\Models\Pesquisa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerguntaController extends Controller
{
    public function store(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $validated = $request->validate([
            'texto'      => 'required|string',
            'tipo'       => 'required|in:likert,texto,multipla,sim_nao,nps',
            'dimensao'   => 'nullable|string',
            'ordem'      => 'nullable|integer',
            'obrigatoria'=> 'boolean',
            'opcoes'     => 'nullable|array',
        ]);

        $validated['pesquisa_id'] = $pesquisa->id;
        $validated['ordem'] ??= $pesquisa->perguntas()->max('ordem') + 1;

        $pergunta = Pergunta::create($validated);

        return response()->json($pergunta, 201);
    }

    public function update(Request $request, Pesquisa $pesquisa, Pergunta $pergunta): JsonResponse
    {
        $validated = $request->validate([
            'texto'      => 'sometimes|string',
            'tipo'       => 'in:likert,texto,multipla,sim_nao,nps',
            'dimensao'   => 'nullable|string',
            'ordem'      => 'nullable|integer',
            'obrigatoria'=> 'boolean',
            'opcoes'     => 'nullable|array',
        ]);

        $pergunta->update($validated);

        return response()->json($pergunta->fresh());
    }

    public function destroy(Pesquisa $pesquisa, Pergunta $pergunta): JsonResponse
    {
        $pergunta->delete();
        return response()->json(['message' => 'Pergunta removida.']);
    }
}
