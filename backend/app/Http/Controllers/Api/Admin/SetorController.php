<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SetorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $setores = Setor::where('empresa_id', $request->user()->empresa_id)
            ->with('ultimoRisco')
            ->withCount(['colaboradores' => fn ($q) => $q->where('status', 'ativo')])
            ->orderBy('nome')
            ->get()
            ->map(fn ($s) => [
                'id'                 => $s->id,
                'nome'               => $s->nome,
                'unidade'            => $s->unidade,
                'responsavel'        => $s->responsavel,
                'nivel'              => $s->nivel,
                'colaboradores_count'=> $s->colaboradores_count,
                'nivel_risco'        => $s->ultimoRisco?->nivel ?? 'sem_dados',
                'score_risco'        => $s->ultimoRisco?->score,
            ]);

        return response()->json(['data' => $setores]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome'        => 'required|string|max:100',
            'unidade'     => 'nullable|string|max:100',
            'responsavel' => 'nullable|string|max:100',
            'nivel'       => 'in:unidade,setor,time',
            'setor_pai_id'=> 'nullable|integer|exists:setores,id',
        ]);

        $setor = Setor::create([
            ...$validated,
            'empresa_id' => $request->user()->empresa_id,
        ]);

        return response()->json($setor, 201);
    }

    public function show(Setor $setor): JsonResponse
    {
        return response()->json($setor->load('colaboradores', 'riscos', 'filhos'));
    }

    public function update(Request $request, Setor $setor): JsonResponse
    {
        $validated = $request->validate([
            'nome'        => 'sometimes|string|max:100',
            'unidade'     => 'nullable|string|max:100',
            'responsavel' => 'nullable|string|max:100',
            'nivel'       => 'in:unidade,setor,time',
        ]);

        $setor->update($validated);
        return response()->json($setor->fresh());
    }

    public function destroy(Setor $setor): JsonResponse
    {
        $setor->delete();
        return response()->json(['message' => 'Setor removido.']);
    }

    public function porEmpresa(Empresa $empresa, Request $request): JsonResponse
    {
        $setores = Setor::where('empresa_id', $empresa->id)
            ->orderBy('nome')
            ->get(['id', 'nome', 'unidade', 'nivel']);

        return response()->json(['data' => $setores]);
    }
}
