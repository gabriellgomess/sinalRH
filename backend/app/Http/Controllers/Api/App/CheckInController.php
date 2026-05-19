<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CheckInController extends Controller
{
    public function atual(Request $request): JsonResponse
    {
        $semana = CheckIn::semanaAtual();
        $checkin = $request->user()->checkins()
            ->where('semana', $semana)
            ->first();

        return response()->json([
            'semana'       => $semana,
            'feito'        => (bool) $checkin,
            'checkin'      => $checkin,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $colaborador = $request->user();
        $semana = CheckIn::semanaAtual();

        // Bloqueia duplicata
        if ($colaborador->checkins()->where('semana', $semana)->exists()) {
            throw ValidationException::withMessages([
                'semana' => 'Você já registrou seu check-in desta semana.',
            ]);
        }

        $validated = $request->validate([
            'humor'      => 'required|integer|min:1|max:5',
            'comentario' => 'nullable|string|max:500',
            'anonimo'    => 'boolean',
        ]);

        $checkin = CheckIn::create([
            ...$validated,
            'colaborador_id' => $colaborador->id,
            'empresa_id'     => $colaborador->empresa_id,
            'setor_id'       => $colaborador->setor_id,
            'semana'         => $semana,
        ]);

        return response()->json([
            'message' => 'Check-in registrado com sucesso!',
            'checkin' => $checkin,
            'humor_label' => $checkin->humor_label,
        ], 201);
    }

    public function historico(Request $request): JsonResponse
    {
        $historico = $request->user()->checkins()
            ->orderByDesc('created_at')
            ->take(12)
            ->get(['id', 'humor', 'semana', 'anonimo', 'created_at']);

        return response()->json([
            'historico' => $historico->map(fn ($c) => [
                ...$c->toArray(),
                'humor_label' => $c->humor_label,
            ]),
            'media' => round($historico->avg('humor'), 1),
        ]);
    }
}
