<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresa = Empresa::with([
            'setores' => fn ($q) => $q
                ->withCount(['colaboradores' => fn ($q) => $q->where('status', 'ativo')])
                ->orderBy('unidade')
                ->orderBy('nome'),
        ])->findOrFail($request->user()->empresa_id);

        return response()->json($empresa);
    }

    public function show(Request $request): JsonResponse
    {
        $empresa = Empresa::with('setores')->findOrFail($request->user()->empresa_id);

        return response()->json($empresa);
    }

    public function update(Request $request, Empresa $empresa): JsonResponse
    {
        abort_if($empresa->id !== $request->user()->empresa_id, 403);

        $validated = $request->validate([
            'nome_fantasia'       => 'sometimes|string|max:150',
            'razao_social'        => 'sometimes|string|max:200',
            'email_contato'       => 'sometimes|email|max:150',
            'telefone'            => 'sometimes|string|max:20',
            'total_colaboradores' => 'nullable|integer|min:0',
            'escuta_comite_email' => 'sometimes|nullable|email|max:150',
            'escuta_comite_nome'  => 'sometimes|nullable|string|max:150',
            'configuracoes'       => 'sometimes|array',
        ]);

        $empresa->update($validated);

        return response()->json($empresa->fresh());
    }
}
