<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AsaasEvento;
use App\Services\AsaasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AsaasWebhookController extends Controller
{
    public function __invoke(Request $request, AsaasService $asaas): JsonResponse
    {
        $expectedToken = config('services.asaas.webhook_token');

        if ($expectedToken) {
            $receivedToken = $request->header('asaas-access-token')
                ?? $request->header('access_token')
                ?? $request->input('token');

            abort_unless(hash_equals((string) $expectedToken, (string) $receivedToken), Response::HTTP_UNAUTHORIZED);
        }

        $payload  = $request->all();
        $eventId  = $payload['id'] ?? $payload['event']['id'] ?? null;
        $eventTyp = $payload['event'] ?? null;

        // Idempotencia: se nao tiver event id, processa mesmo assim (logica fallback)
        if ($eventId) {
            $existing = AsaasEvento::where('asaas_event_id', $eventId)->first();
            if ($existing && $existing->resultado === 'processed') {
                return response()->json([
                    'success'   => true,
                    'processed' => true,
                    'duplicate' => true,
                ]);
            }
        }

        $evento = AsaasEvento::updateOrCreate(
            ['asaas_event_id' => $eventId ?? 'no-id:' . md5(json_encode($payload))],
            [
                'event_type' => (string) $eventTyp,
                'payload'    => $payload,
                'resultado'  => 'skipped',
            ]
        );

        try {
            $cobranca = $asaas->applyWebhook($payload);

            $evento->update([
                'empresa_cobranca_id' => $cobranca?->id,
                'resultado'           => $cobranca ? 'processed' : 'skipped',
                'processado_em'      => now(),
                'erro'               => null,
            ]);

            return response()->json([
                'success'   => true,
                'processed' => (bool) $cobranca,
            ]);
        } catch (Throwable $e) {
            Log::error('Asaas webhook processing failed', [
                'asaas_event_id' => $eventId,
                'event_type'     => $eventTyp,
                'erro'           => $e->getMessage(),
            ]);

            $evento->update([
                'resultado'     => 'failed',
                'erro'          => $e->getMessage(),
                'processado_em' => now(),
            ]);

            // Retorna 200 mesmo assim para nao gerar reentrega excessiva.
            // Falha fica registrada em asaas_eventos para retry manual.
            return response()->json([
                'success'   => false,
                'processed' => false,
                'error'     => 'Falha ao processar evento (registrado para retry manual).',
            ]);
        }
    }
}
