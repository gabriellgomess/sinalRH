<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comunicado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComunicadoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $comunicados = Comunicado::where('empresa_id', $request->user()->empresa_id)
            ->latest()
            ->paginate(20);

        return response()->json($comunicados);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo'   => 'required|string|max:200',
            'corpo'    => 'required|string',
            'tipo'     => 'required|in:info,alerta,urgente',
            'setor_id' => 'nullable|integer|exists:setores,id',
        ]);

        $comunicado = Comunicado::create([
            ...$validated,
            'empresa_id' => $request->user()->empresa_id,
            'criado_por' => $request->user()->id,
            'publicado'  => false,
        ]);

        return response()->json($comunicado, 201);
    }

    public function update(Request $request, Comunicado $comunicado): JsonResponse
    {
        $this->garantirMesmaEmpresa($comunicado);
        $this->autorizarEmpresa($request, $comunicado);

        $validated = $request->validate([
            'titulo'   => 'sometimes|string|max:200',
            'corpo'    => 'sometimes|string',
            'tipo'     => 'sometimes|in:info,alerta,urgente',
            'setor_id' => 'nullable|integer|exists:setores,id',
        ]);

        $comunicado->update($validated);

        return response()->json($comunicado->fresh());
    }

    public function destroy(Request $request, Comunicado $comunicado): JsonResponse
    {
        $this->garantirMesmaEmpresa($comunicado);
        $this->autorizarEmpresa($request, $comunicado);
        $comunicado->delete();

        return response()->json(null, 204);
    }

    public function publicar(Request $request, Comunicado $comunicado): JsonResponse
    {
        $this->autorizarEmpresa($request, $comunicado);
        $comunicado->update(['publicado' => true]);

        return response()->json($comunicado->fresh());
    }

    private function autorizarEmpresa(Request $request, Comunicado $comunicado): void
    {
        abort_if($comunicado->empresa_id !== $request->user()->empresa_id, 403);
    }
}
