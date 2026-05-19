<?php

namespace App\Http\Controllers\Api\Plataforma;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\EmpresaProduto;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmpresaProdutoController extends Controller
{
    public function index(Empresa $empresa): JsonResponse
    {
        $produtos = $empresa->produtos()
            ->with('contratadoPor:id,nome')
            ->orderByDesc('data_inicio')
            ->get();

        $colaboradoresAtivos = $empresa->colaboradores()->where('status', 'ativo')->count();
        $produtos->each(fn ($p) => $p->valor_projetado_anual = $p->valorProjetadoAnual($colaboradoresAtivos));

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
            'produto'                => 'required|in:diagnostico_nr1,plano_acao_nr1,canal_escuta',
            'tipo'                   => 'required|in:pontual,recorrente_mensal',
            'valor_unitario'         => 'nullable|numeric|min:0',
            'valor_mensal'           => 'nullable|numeric|min:0',
            'quantidade_aplicacoes'  => 'nullable|integer|min:1|max:12',
            'data_inicio'            => 'required|date',
            'data_fim'               => 'nullable|date|after_or_equal:data_inicio',
            'proxima_cobranca_em'    => 'nullable|date',
            'status'                 => 'nullable|in:ativo,pausado,encerrado,inadimplente',
            'numero_contrato'        => 'nullable|string|max:50',
            'data_assinatura_contrato' => 'nullable|date',
            'observacoes'            => 'nullable|string|max:2000',
        ]);

        $produto = $empresa->produtos()->create(array_merge($validated, [
            'status'         => $validated['status'] ?? 'ativo',
            'contratado_por' => $request->user()->id,
        ]));

        AuditLogger::log(
            $request,
            'plataforma.produto.contratar',
            $produto,
            "Contratou produto {$produto->titulo} para empresa {$empresa->nome_fantasia}.",
            null,
            $produto->only(['id', 'produto', 'tipo', 'valor_unitario', 'valor_mensal', 'data_inicio'])
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
            'tipo'                   => 'sometimes|in:pontual,recorrente_mensal',
            'valor_unitario'         => 'nullable|numeric|min:0',
            'valor_mensal'           => 'nullable|numeric|min:0',
            'quantidade_aplicacoes'  => 'nullable|integer|min:1|max:12',
            'data_inicio'            => 'sometimes|date',
            'data_fim'               => 'nullable|date',
            'proxima_cobranca_em'    => 'nullable|date',
            'status'                 => 'sometimes|in:ativo,pausado,encerrado,inadimplente',
            'numero_contrato'        => 'nullable|string|max:50',
            'data_assinatura_contrato' => 'nullable|date',
            'observacoes'            => 'nullable|string|max:2000',
        ]);

        $antes = $produto->only(['status', 'valor_unitario', 'valor_mensal']);
        $produto->update($validated);

        AuditLogger::log(
            $request,
            'plataforma.produto.atualizar',
            $produto,
            "Atualizou produto {$produto->titulo} de {$empresa->nome_fantasia}.",
            $antes,
            $produto->fresh()->only(['status', 'valor_unitario', 'valor_mensal'])
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
            "Removeu contrato de {$titulo} de {$empresa->nome_fantasia}."
        );

        $produto->delete();

        return response()->json(['success' => true, 'message' => 'Contrato removido.']);
    }
}
