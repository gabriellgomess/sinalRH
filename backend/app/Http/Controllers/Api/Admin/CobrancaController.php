<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cobranca;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Visão do CLIENTE (admin da empresa) sobre suas cobranças. Somente leitura:
 * o cliente vê o que deve, o status e o link da fatura para pagar. A gestão
 * (criar/editar/cancelar) é exclusiva da plataforma (super_admin).
 * Campos internos (observações, ids/metadata Asaas) NÃO são expostos.
 */
class CobrancaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;
        abort_unless($empresa, 403);

        $cobrancas = Cobranca::where('empresa_id', $empresa->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'cobrancas' => $cobrancas->map(fn ($c) => [
                    'id'                => $c->id,
                    'tipo'              => $c->tipo,
                    'descricao'         => $c->descricao,
                    'valor'             => $c->valor,
                    'ciclo'             => $c->ciclo,
                    'billing_type'      => $c->billing_type,
                    'vencimento'        => $c->vencimento?->toDateString(),
                    'status'            => $c->status,
                    'asaas_invoice_url' => $c->asaas_invoice_url,
                    'created_at'        => $c->created_at?->toIso8601String(),
                ]),
                'ciclos'        => Cobranca::CICLOS,
                'total_aberto'  => (float) $cobrancas
                    ->whereIn('status', ['pendente', 'ativa', 'atrasada'])
                    ->sum('valor'),
            ],
        ]);
    }
}
