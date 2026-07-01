<?php

namespace App\Http\Controllers\Api\Plataforma;

use App\Http\Controllers\Controller;
use App\Models\Cobranca;
use App\Models\Empresa;
use App\Services\AsaasService;
use App\Support\AuditLogger;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Cobrancas avulsas atreladas a EMPRESA (customer Asaas), independentes de produto.
 *  - tipo 'unica'      => Payment (boleto/pix/cartao)
 *  - tipo 'recorrente' => Subscription (1 assinatura = 1 boleto por ciclo)
 */
class CobrancaController extends Controller
{
    public function index(Empresa $empresa): JsonResponse
    {
        $cobrancas = $empresa->cobrancas()
            ->with('criadoPor:id,nome')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'cobrancas'    => $cobrancas,
                'ciclos'       => Cobranca::CICLOS,
                'billing_types'=> Cobranca::BILLING_TYPES,
                'asaas_ativo'  => app(AsaasService::class)->enabled(),
                'customer_id'  => $empresa->asaas_customer_id,
            ],
        ]);
    }

    public function store(Request $request, Empresa $empresa, AsaasService $asaas): JsonResponse
    {
        $validated = $this->validar($request, true);

        $cobranca = $empresa->cobrancas()->create(array_merge($validated, [
            'status'     => 'pendente',
            'criado_por' => $request->user()->id,
        ]));

        $warning = $this->sincronizar($asaas, $cobranca, 'store');

        AuditLogger::log(
            $request,
            'plataforma.cobranca.criar',
            $cobranca,
            "Criou cobranca \"{$cobranca->descricao}\" ({$cobranca->tipo}) de R$ {$cobranca->valor} para {$empresa->nome_fantasia}."
                . ($warning ? ' (falha sync Asaas)' : ''),
            null,
            $cobranca->only(['id', 'tipo', 'valor', 'ciclo', 'vencimento', 'billing_type'])
        );

        return response()->json([
            'success'       => true,
            'data'          => $cobranca->fresh('criadoPor:id,nome'),
            'asaas_warning' => $warning,
        ], 201);
    }

    public function update(Request $request, Empresa $empresa, Cobranca $cobranca, AsaasService $asaas): JsonResponse
    {
        abort_if((int) $cobranca->empresa_id !== (int) $empresa->id, 404);

        $validated = $this->validar($request, false);

        $antes = $cobranca->only(['valor', 'vencimento', 'status', 'billing_type']);
        $cobranca->update($validated);

        $warning = $this->sincronizar($asaas, $cobranca, 'update');

        AuditLogger::log(
            $request,
            'plataforma.cobranca.atualizar',
            $cobranca,
            "Atualizou cobranca \"{$cobranca->descricao}\" de {$empresa->nome_fantasia}."
                . ($warning ? ' (falha sync Asaas)' : ''),
            $antes,
            $cobranca->fresh()->only(['valor', 'vencimento', 'status', 'billing_type'])
        );

        return response()->json([
            'success'       => true,
            'data'          => $cobranca->fresh('criadoPor:id,nome'),
            'asaas_warning' => $warning,
        ]);
    }

    public function sincronizarAsaas(Request $request, Empresa $empresa, Cobranca $cobranca, AsaasService $asaas): JsonResponse
    {
        abort_if((int) $cobranca->empresa_id !== (int) $empresa->id, 404);

        if (!$asaas->enabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Integracao Asaas esta desativada (ASAAS_ENABLED=false).',
            ], 422);
        }

        try {
            $cobranca = $asaas->syncCobranca($cobranca);
        } catch (Throwable $e) {
            $detalhe = $this->logFalha('sincronizar', $cobranca, $e);
            return response()->json([
                'success' => false,
                'message' => 'Falha ao sincronizar a cobranca no Asaas.',
                'detalhe' => $detalhe,
            ], 502);
        }

        AuditLogger::log(
            $request,
            'plataforma.cobranca.sincronizar_asaas',
            $cobranca,
            "Re-sincronizou cobranca \"{$cobranca->descricao}\" com Asaas."
        );

        return response()->json(['success' => true, 'data' => $cobranca->fresh('criadoPor:id,nome')]);
    }

    public function destroy(Request $request, Empresa $empresa, Cobranca $cobranca, AsaasService $asaas): JsonResponse
    {
        abort_if((int) $cobranca->empresa_id !== (int) $empresa->id, 404);

        $descricao = $cobranca->descricao;

        try {
            $asaas->removerCobranca($cobranca);
        } catch (Throwable $e) {
            Log::error("Falha ao cancelar cobranca {$cobranca->id} no Asaas (destroy)", ['erro' => $e->getMessage()]);
        }

        AuditLogger::log(
            $request,
            'plataforma.cobranca.remover',
            $cobranca,
            "Removeu cobranca \"{$descricao}\" de {$empresa->nome_fantasia}."
        );

        $cobranca->delete();

        return response()->json(['success' => true, 'message' => 'Cobranca removida.']);
    }

    // ── helpers ──────────────────────────────────────────────────────────
    private function validar(Request $request, bool $criando): array
    {
        $req = $criando ? 'required' : 'sometimes';

        return $request->validate([
            'tipo'         => "$req|in:unica,recorrente",
            'descricao'    => "$req|string|max:200",
            'valor'        => "$req|numeric|min:0.01",
            'ciclo'        => 'nullable|in:WEEKLY,BIWEEKLY,MONTHLY,QUARTERLY,SEMIANNUALLY,YEARLY',
            'billing_type' => 'nullable|in:BOLETO,PIX,CREDIT_CARD,UNDEFINED',
            'vencimento'   => 'nullable|date',
            'status'       => 'sometimes|in:pendente,ativa,paga,atrasada,cancelada',
            'observacoes'  => 'nullable|string|max:2000',
        ]);
    }

    private function sincronizar(AsaasService $asaas, Cobranca $cobranca, string $ctx): ?array
    {
        if (!$asaas->enabled()) {
            return null;
        }

        try {
            $asaas->syncCobranca($cobranca);
            return null;
        } catch (Throwable $e) {
            $detalhe = $this->logFalha($ctx, $cobranca, $e);
            return [
                'mensagem' => 'Cobranca salva, mas a sincronizacao com o Asaas falhou. Use "Re-sincronizar" para tentar novamente.',
                'detalhe'  => $detalhe,
            ];
        }
    }

    private function logFalha(string $ctx, Cobranca $cobranca, Throwable $e): ?array
    {
        $detalhe = null;
        if ($e instanceof RequestException) {
            $detalhe = [
                'status' => $e->response?->status(),
                'body'   => $e->response?->json() ?? $e->response?->body(),
            ];
        }

        Log::error("Asaas syncCobranca falhou em {$ctx}", [
            'cobranca_id' => $cobranca->id,
            'empresa_id'  => $cobranca->empresa_id,
            'erro'        => $e->getMessage(),
            'detalhe'     => $detalhe,
        ]);

        return $detalhe;
    }
}
