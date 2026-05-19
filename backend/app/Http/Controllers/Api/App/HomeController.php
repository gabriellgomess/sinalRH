<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Comunicado;
use App\Models\Pesquisa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $colaborador = $request->user();
        $empresa     = $colaborador->empresa;
        $semanaAtual = CheckIn::semanaAtual();

        // Check-in desta semana
        $checkinFeito = $colaborador->checkins()
            ->where('semana', $semanaAtual)
            ->exists();

        // Pesquisas disponíveis para este colaborador
        $pesquisasAtivas = Pesquisa::where('empresa_id', $empresa->id)
            ->where('status', 'ativa')
            ->where(function ($q) use ($colaborador) {
                $q->whereNull('setor_id')
                  ->orWhere('setor_id', $colaborador->setor_id);
            })
            ->whereDoesntHave('respostas', function ($q) use ($colaborador) {
                $q->where('colaborador_id', $colaborador->id);
            })
            ->withCount('perguntas')
            ->get(['id', 'titulo', 'tipo', 'prazo']);

        // Comunicados não lidos
        $comunicados = Comunicado::where('empresa_id', $empresa->id)
            ->where('publicado', true)
            ->where(function ($q) use ($colaborador) {
                $q->whereNull('setor_id')
                  ->orWhere('setor_id', $colaborador->setor_id);
            })
            ->whereDoesntHave('leituras', fn ($q) => $q->where('colaborador_id', $colaborador->id))
            ->latest()
            ->take(3)
            ->get(['id', 'titulo', 'tipo', 'created_at']);

        // Streak de check-ins
        $streakSemanas = $colaborador->checkins()
            ->where('created_at', '>=', now()->subWeeks(12))
            ->distinct('semana')
            ->count('semana');

        return response()->json([
            'colaborador' => [
                'id'                  => $colaborador->id,
                'nome'                => $colaborador->nome,
                'iniciais'            => $colaborador->iniciais,
                'setor'               => $colaborador->setor?->nome,
                'streak_checkins'     => $streakSemanas,
                'pesquisas_concluidas'=> $colaborador->respostas()
                    ->join('perguntas', 'respostas.pergunta_id', '=', 'perguntas.id')
                    ->distinct('perguntas.pesquisa_id')
                    ->count('perguntas.pesquisa_id'),
            ],
            'semana_atual'     => $semanaAtual,
            'checkin_feito'    => $checkinFeito,
            'pesquisas_ativas' => $pesquisasAtivas,
            'comunicados'      => $comunicados,
        ]);
    }

    public function perfil(Request $request): JsonResponse
    {
        $colaborador = $request->user()->load('setor', 'empresa');

        return response()->json([
            'id'                  => $colaborador->id,
            'nome'                => $colaborador->nome,
            'email'               => $colaborador->email,
            'cargo'               => $colaborador->cargo,
            'setor'               => $colaborador->setor?->nome,
            'empresa'             => $colaborador->empresa->nome_fantasia,
            'iniciais'            => $colaborador->iniciais,
            'data_admissao'       => $colaborador->data_admissao?->format('d/m/Y'),
            'streak_checkins'     => $colaborador->streak_checkins,
            'pesquisas_concluidas'=> $colaborador->respostas()
                ->join('perguntas', 'respostas.pergunta_id', '=', 'perguntas.id')
                ->distinct('perguntas.pesquisa_id')
                ->count('perguntas.pesquisa_id'),
        ]);
    }
}
