<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AsaasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

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

        $produto = $asaas->applyWebhook($request->all());

        return response()->json([
            'success' => true,
            'processed' => (bool) $produto,
        ]);
    }
}
