<?php

namespace App\Http\Controllers\Api\Plataforma;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\EmpresaProduto;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Produtos = ACESSO/funcionalidade contratada pela empresa.
 * NAO gera cobranca. O financeiro fica 100% nas Cobrancas (avulsas, por empresa).
 */
class EmpresaProdutoController extends Controller
{
    public function index(Empresa $empresa): JsonResponse
    {
        $produtos = $empresa->produtos()
            ->with('contratadoPor:id,nome')
            ->orderByDesc('data_inicio')
            ->get();

        $colaboradoresAtivos = $empresa->colaboradores()->where('status', 'ativo')->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'produtos'             => $produtos,
                'colaboradores_ativos' => $colaboradoresAtivos,
                'catalogo'             => EmpresaProduto::PRODUTOS,
            ],
        ]);
    }

    public function store(Request $request, Empresa $empresa): JsonResponse
    {
        $validated = $request->validate([
            'produto'                  => 'required|in:diagnostico_nr1,plano_acao_nr1,canal_escuta,mapa_riscos,pesquisas,checkins,feedback,pdi,ead',
            'limite_colaboradores'     => 'nullable|integer|min:1',
            'data_inicio'              => 'required|date',
            'data_fim'                 => 'nullable|date|after_or_equal:data_inicio',
            'status'                   => 'nullable|in:ativo,pausado,encerrado,inadimplente',
            'numero_contrato'          => 'nullable|string|max:50',
            'data_assinatura_contrato' => 'nullable|date',
            'observacoes'              => 'nullable|string|max:2000',
        ]);

        $produto = $empresa->produtos()->create(array_merge($validated, [
            'status'         => $validated['status'] ?? 'ativo',
            'contratado_por' => $request->user()->id,
        ]));

        AuditLogger::log(
            $request,
            'plataforma.produto.contratar',
            $produto,
            "Liberou acesso ao produto {$produto->titulo} para empresa {$empresa->nome_fantasia}.",
            null,
            $produto->only(['id', 'produto', 'limite_colaboradores', 'data_inicio'])
        );

        return response()->json([
            'success' => true,
            'data'    => $produto->load('contratadoPor:id,nome'),
        ], 201);
    }

    public function update(Request $request, Empresa $empresa, EmpresaProduto $produto): JsonResponse
    {
        abort_if((int) $produto->empresa_id !== (int) $empresa->id, 404);

        $validated = $request->validate([
            'limite_colaboradores'     => 'nullable|integer|min:1',
            'data_inicio'              => 'sometimes|date',
            'data_fim'                 => 'nullable|date',
            'status'                   => 'sometimes|in:ativo,pausado,encerrado,inadimplente',
            'numero_contrato'          => 'nullable|string|max:50',
            'data_assinatura_contrato' => 'nullable|date',
            'observacoes'              => 'nullable|string|max:2000',
        ]);

        $antes = $produto->only(['status', 'limite_colaboradores']);
        $produto->update($validated);

        AuditLogger::log(
            $request,
            'plataforma.produto.atualizar',
            $produto,
            "Atualizou acesso ao produto {$produto->titulo} de {$empresa->nome_fantasia}.",
            $antes,
            $produto->fresh()->only(['status', 'limite_colaboradores'])
        );

        return response()->json(['success' => true, 'data' => $produto->fresh('contratadoPor:id,nome')]);
    }

    public function destroy(Request $request, Empresa $empresa, EmpresaProduto $produto): JsonResponse
    {
        abort_if((int) $produto->empresa_id !== (int) $empresa->id, 404);

        $titulo = $produto->titulo;

        AuditLogger::log(
            $request,
            'plataforma.produto.remover',
            $produto,
            "Removeu acesso ao produto {$titulo} de {$empresa->nome_fantasia}."
        );

        $produto->delete();

        return response()->json(['success' => true, 'message' => 'Acesso removido.']);
    }
}
