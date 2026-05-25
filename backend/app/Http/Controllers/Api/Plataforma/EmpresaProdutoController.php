<?php

namespace App\Http\Controllers\Api\Plataforma;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\EmpresaProduto;
use App\Jobs\SincronizarProdutoAsaasJob;
use App\Services\AsaasService;
use App\Support\AuditLogger;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

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

    public function store(Request $request, Empresa $empresa, AsaasService $asaas): JsonResponse
    {
        $validated = $request->validate([
            'produto'                => 'required|in:diagnostico_nr1,plano_acao_nr1,canal_escuta,mapa_riscos,pesquisas,checkins,feedback,pdi',
            'tipo'                   => 'required|in:pontual,recorrente_mensal',
            'valor_unitario'         => 'nullable|numeric|min:0',
            'valor_mensal'           => 'nullable|numeric|min:0',
            'ciclo'                  => 'nullable|in:WEEKLY,BIWEEKLY,MONTHLY,QUARTERLY,SEMIANNUALLY,YEARLY',
            'quantidade_aplicacoes'  => 'nullable|integer|min:1|max:12',
            'limite_colaboradores'   => 'nullable|integer|min:1',
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

        $asaasWarning = null;
        try {
            $produto = $asaas->syncProduto($produto);
        } catch (Throwable $e) {
            $asaasWarning = $this->logFalhaAsaas('store', $produto, $e);
            // Dispatch para retry em background — destrava UX
            SincronizarProdutoAsaasJob::dispatch($produto)->delay(now()->addSeconds(30));
            $asaasWarning['mensagem'] = 'Produto criado. A cobrança no Asaas falhou e será tentada novamente em background. Use "Re-sincronizar" para tentar agora.';
        }

        AuditLogger::log(
            $request,
            'plataforma.produto.contratar',
            $produto,
            "Contratou produto {$produto->titulo} para empresa {$empresa->nome_fantasia}."
                . ($asaasWarning ? ' (falha sync Asaas)' : ''),
            null,
            $produto->only(['id', 'produto', 'tipo', 'valor_unitario', 'valor_mensal', 'data_inicio'])
        );

        return response()->json([
            'success'       => true,
            'data'          => $produto->load('contratadoPor:id,nome'),
            'asaas_warning' => $asaasWarning,
        ], 201);
    }

    public function sincronizarAsaas(Request $request, Empresa $empresa, EmpresaProduto $produto, AsaasService $asaas): JsonResponse
    {
        abort_if((int) $produto->empresa_id !== (int) $empresa->id, 404);

        if (!$asaas->enabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Integração Asaas está desativada (ASAAS_ENABLED=false).',
            ], 422);
        }

        try {
            $produto = $asaas->syncProduto($produto);
        } catch (Throwable $e) {
            $warning = $this->logFalhaAsaas('sincronizar', $produto, $e);
            return response()->json([
                'success' => false,
                'message' => $warning['mensagem'],
                'detalhe' => $warning['detalhe'] ?? null,
            ], 502);
        }

        AuditLogger::log(
            $request,
            'plataforma.produto.sincronizar_asaas',
            $produto,
            "Re-sincronizou produto {$produto->titulo} com Asaas."
        );

        return response()->json([
            'success' => true,
            'data'    => $produto->load('contratadoPor:id,nome'),
        ]);
    }

    private function logFalhaAsaas(string $contexto, EmpresaProduto $produto, Throwable $e): array
    {
        $detalhe = null;
        if ($e instanceof RequestException) {
            $detalhe = [
                'status' => $e->response?->status(),
                'body'   => $e->response?->json() ?? $e->response?->body(),
            ];
        }

        Log::error("Asaas sync falhou em {$contexto}", [
            'produto_id' => $produto->id,
            'empresa_id' => $produto->empresa_id,
            'erro'       => $e->getMessage(),
            'detalhe'    => $detalhe,
        ]);

        return [
            'mensagem' => 'Produto criado, mas a cobrança no Asaas falhou. Use "Re-sincronizar" para tentar novamente.',
            'detalhe'  => $detalhe,
        ];
    }

    public function update(Request $request, Empresa $empresa, EmpresaProduto $produto, AsaasService $asaas): JsonResponse
    {
        abort_if((int) $produto->empresa_id !== (int) $empresa->id, 404);

        $validated = $request->validate([
            'tipo'                   => 'sometimes|in:pontual,recorrente_mensal',
            'valor_unitario'         => 'nullable|numeric|min:0',
            'valor_mensal'           => 'nullable|numeric|min:0',
            'ciclo'                  => 'nullable|in:WEEKLY,BIWEEKLY,MONTHLY,QUARTERLY,SEMIANNUALLY,YEARLY',
            'quantidade_aplicacoes'  => 'nullable|integer|min:1|max:12',
            'limite_colaboradores'   => 'nullable|integer|min:1',
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

        try {
            $asaas->syncAssinaturaConsolidada($empresa);
            $asaas->syncPagamentoConsolidado($empresa);
        } catch (\Throwable $e) {
            // Ignore or log to prevent breaking UI
        }

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

    public function destroy(Request $request, Empresa $empresa, EmpresaProduto $produto, AsaasService $asaas): JsonResponse
    {
        abort_if((int) $produto->empresa_id !== (int) $empresa->id, 404);

        $titulo = $produto->titulo;
        $tipo = $produto->tipo;

        AuditLogger::log(
            $request,
            'plataforma.produto.remover',
            $produto,
            "Removeu contrato de {$titulo} de {$empresa->nome_fantasia}."
        );

        $produto->delete();

        try {
            $asaas->syncAssinaturaConsolidada($empresa);
            $asaas->syncPagamentoConsolidado($empresa);
        } catch (\Throwable $e) {
            // Ignore or log
        }

        return response()->json(['success' => true, 'message' => 'Contrato removido.']);
    }
}
