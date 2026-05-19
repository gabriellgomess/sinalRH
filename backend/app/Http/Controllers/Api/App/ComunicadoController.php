<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Comunicado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComunicadoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $colaborador = $request->user();

        $comunicados = Comunicado::where('empresa_id', $colaborador->empresa_id)
            ->where('publicado', true)
            ->with(['leituras' => fn ($q) => $q->where('colaborador_id', $colaborador->id)])
            ->latest()
            ->get()
            ->map(fn ($c) => [
                'id'      => $c->id,
                'titulo'  => $c->titulo,
                'corpo'   => $c->corpo,
                'tipo'    => $c->tipo,
                'lido'    => $c->leituras->isNotEmpty(),
                'criado_em' => $c->created_at,
            ]);

        return response()->json($comunicados);
    }

    public function marcarLido(Request $request, Comunicado $comunicado): JsonResponse
    {
        $colaborador = $request->user();

        abort_if($comunicado->empresa_id !== $colaborador->empresa_id, 403);

        $comunicado->leituras()->syncWithoutDetaching([
            $colaborador->id => ['lido_em' => now()],
        ]);

        return response()->json(['message' => 'Marcado como lido.']);
    }
}
