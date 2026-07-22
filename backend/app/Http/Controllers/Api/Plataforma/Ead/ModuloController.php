<?php

namespace App\Http\Controllers\Api\Plataforma\Ead;

use App\Http\Controllers\Controller;
use App\Models\Ead\Curso;
use App\Models\Ead\Modulo;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuloController extends Controller
{
    public function store(Request $request, Curso $curso): JsonResponse
    {
        $validated = $request->validate([
            'titulo'    => 'required|string|max:200',
            'descricao' => 'nullable|string|max:2000',
            'ordem'     => 'nullable|integer|min:0',
        ]);

        $modulo = $curso->modulos()->create([
            'titulo'    => $validated['titulo'],
            'descricao' => $validated['descricao'] ?? null,
            'ordem'     => $validated['ordem'] ?? ($curso->modulos()->max('ordem') + 1),
        ]);

        AuditLogger::log($request, 'ead.modulo.criar', $curso,
            "Adicionou modulo '{$modulo->titulo}' ao curso {$curso->titulo}.");

        return response()->json(['success' => true, 'data' => $modulo], 201);
    }

    public function update(Request $request, Curso $curso, Modulo $modulo): JsonResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);

        $validated = $request->validate([
            'titulo'    => 'sometimes|string|max:200',
            'descricao' => 'nullable|string|max:2000',
            'ordem'     => 'nullable|integer|min:0',
        ]);

        $modulo->update($validated);

        return response()->json(['success' => true, 'data' => $modulo->fresh()]);
    }

    public function destroy(Request $request, Curso $curso, Modulo $modulo): JsonResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);

        $titulo = $modulo->titulo;
        $modulo->delete();

        AuditLogger::log($request, 'ead.modulo.excluir', $curso,
            "Removeu modulo '{$titulo}' do curso {$curso->titulo}.");

        return response()->json(['success' => true, 'message' => 'Módulo removido.']);
    }

    public function reordenar(Request $request, Curso $curso): JsonResponse
    {
        $validated = $request->validate([
            'ordem'   => 'required|array',
            'ordem.*' => 'integer',
        ]);

        foreach ($validated['ordem'] as $indice => $moduloId) {
            $curso->modulos()->where('id', $moduloId)->update(['ordem' => $indice]);
        }

        return response()->json(['success' => true]);
    }
}
