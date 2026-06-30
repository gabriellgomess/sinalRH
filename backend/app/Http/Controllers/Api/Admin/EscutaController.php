<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RelatoEscuta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EscutaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $admin = $request->user();

        $relatos = RelatoEscuta::where('empresa_id', $admin->empresa_id)
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->prioridade, fn ($q) => $q->where('prioridade', $request->prioridade))
            ->when($request->setor_id, fn ($q) => $q->where('setor_id', $request->setor_id))
            ->with('setor:id,nome')
            ->latest()
            ->paginate(20);

        return response()->json($relatos);
    }

    public function show(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarEmpresa($request, $relato);

        $relato->load('setor:id,nome');
        if ($relato->modo === 'identificado') {
            $relato->load('colaborador:id,nome,email');
        }

        return response()->json([
            'id'         => $relato->id,
            'modo'       => $relato->modo,
            'categoria'  => $relato->categoria,
            'tag'        => $relato->tag,
            'texto'      => $relato->texto,
            'status'     => $relato->status,
            'prioridade' => $relato->prioridade,
            'setor'      => $relato->setor,
            'colaborador' => $relato->modo === 'identificado' ? $relato->colaborador : null,
            'nota_interna' => $relato->getRawOriginal('nota_interna'),
            'created_at' => $relato->created_at,
        ]);
    }

    public function atualizarStatus(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarEmpresa($request, $relato);

        $request->validate([
            'status' => 'required|in:pendente,em_analise,resolvido',
        ]);

        $relato->update(['status' => $request->status]);

        return response()->json(['status' => $relato->status]);
    }

    public function adicionarNota(Request $request, RelatoEscuta $relato): JsonResponse
    {
        $this->autorizarEmpresa($request, $relato);

        $request->validate([
            'nota' => 'required|string|max:2000',
        ]);

        $relato->update(['nota_interna' => $request->nota]);

        return response()->json(['message' => 'Nota salva com sucesso.']);
    }

    private function autorizarEmpresa(Request $request, RelatoEscuta $relato): void
    {
        abort_if($relato->empresa_id !== $request->user()->empresa_id, 403);
    }
}
