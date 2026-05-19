<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\RelatoEscuta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EscutaController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $colaborador = $request->user();

        $validated = $request->validate([
            'modo'      => 'required|in:anonimo,identificado',
            'categoria' => 'required|string|max:100',
            'tag'       => 'nullable|string|max:50',
            'texto'     => 'required|string|min:10|max:3000',
        ]);

        $relato = RelatoEscuta::create([
            ...$validated,
            'empresa_id'     => $colaborador->empresa_id,
            'colaborador_id' => $validated['modo'] === 'identificado' ? $colaborador->id : null,
            'setor_id'       => $colaborador->setor_id,
            'status'         => 'pendente',
            'prioridade'     => $this->calcularPrioridade($validated['categoria'], $validated['texto']),
        ]);

        return response()->json([
            'message' => 'Relato enviado com segurança. Sua mensagem chegará ao time de cuidado.',
        ], 201);
    }

    private function calcularPrioridade(string $categoria, string $texto): string
    {
        $palavrasCriticas = ['assédio', 'violência', 'ameaça', 'discriminação', 'urgente'];
        $textoLower = mb_strtolower($texto);

        foreach ($palavrasCriticas as $palavra) {
            if (str_contains($textoLower, $palavra)) return 'alta';
        }

        if (str_contains($categoria, 'assedio') || str_contains($categoria, 'discriminacao')) {
            return 'alta';
        }

        return 'media';
    }
}
