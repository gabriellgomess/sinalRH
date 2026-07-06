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
        $this->garantirMesmaEmpresa($pesquisa);
        $validated = $request->validate([
            'texto'      => 'required|string',
            'tipo'       => 'required|in:likert,multipla_escolha,sim_nao,nps,texto_livre',
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
        $this->garantirMesmaEmpresa($pesquisa);
        abort_if((int) $pergunta->pesquisa_id !== (int) $pesquisa->id, 404);
        $validated = $request->validate([
            'texto'      => 'sometimes|string',
            'tipo'       => 'in:likert,multipla_escolha,sim_nao,nps,texto_livre',
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
        $this->garantirMesmaEmpresa($pesquisa);
        abort_if((int) $pergunta->pesquisa_id !== (int) $pesquisa->id, 404);
        $pergunta->delete();
        return response()->json(['message' => 'Pergunta removida.']);
    }
}
