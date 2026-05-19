<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auditoria;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfiguracaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;
        $config  = $empresa->configuracoes ?? [];

        return response()->json([
            'empresa' => [
                'id'                => $empresa->id,
                'nome_fantasia'     => $empresa->nome_fantasia,
                'razao_social'      => $empresa->razao_social,
                'cnpj'              => $empresa->cnpj,
                'email_contato'     => $empresa->email_contato,
                'telefone'          => $empresa->telefone,
                'plano'             => $empresa->plano,
                'status'            => $empresa->status,
                'max_colaboradores' => $empresa->max_colaboradores,
            ],
            'notificacoes' => [
                'alerta_email'       => $config['notif_alerta_email']       ?? true,
                'alerta_critico'     => $config['notif_alerta_critico']     ?? true,
                'relatorio_semanal'  => $config['notif_relatorio_semanal']  ?? false,
                'resumo_checkin'     => $config['notif_resumo_checkin']     ?? true,
            ],
            'modulos' => [
                'checkin'    => true,
                'pesquisas'  => true,
                'escuta'     => true,
                'riscos'     => true,
                'relatorios' => true,
            ],
            'auditorias' => Auditoria::where('empresa_id', $empresa->id)
                ->with('usuario:id,nome,email')
                ->orderByDesc('created_at')
                ->limit(30)
                ->get()
                ->map(fn ($auditoria) => [
                    'id' => $auditoria->id,
                    'acao' => $auditoria->acao,
                    'entidade_tipo' => $auditoria->entidade_tipo,
                    'entidade_id' => $auditoria->entidade_id,
                    'descricao' => $auditoria->descricao,
                    'usuario' => $auditoria->usuario?->only(['id', 'nome', 'email']),
                    'created_at' => $auditoria->created_at,
                    'ip' => $auditoria->ip,
                ]),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;

        $validated = $request->validate([
            'nome_fantasia'             => 'sometimes|string|max:150',
            'email_contato'             => 'sometimes|email|max:150',
            'telefone'                  => 'nullable|string|max:20',
            'notif_alerta_email'        => 'sometimes|boolean',
            'notif_alerta_critico'      => 'sometimes|boolean',
            'notif_relatorio_semanal'   => 'sometimes|boolean',
            'notif_resumo_checkin'      => 'sometimes|boolean',
        ]);

        $empresaFields = array_filter(
            $validated,
            fn ($key) => in_array($key, ['nome_fantasia', 'email_contato', 'telefone'], true),
            ARRAY_FILTER_USE_KEY
        );

        $notifFields = array_filter(
            $validated,
            fn ($key) => str_starts_with($key, 'notif_'),
            ARRAY_FILTER_USE_KEY
        );

        if (!empty($empresaFields)) {
            $empresa->update($empresaFields);
        }

        if (!empty($notifFields)) {
            $config = $empresa->configuracoes ?? [];
            foreach ($notifFields as $key => $value) {
                $config[$key] = $value;
            }
            $empresa->update(['configuracoes' => $config]);
        }

        AuditLogger::log(
            $request,
            'configuracoes.atualizar',
            $empresa,
            'Atualizou configuracoes da empresa.',
            null,
            $validated
        );

        return response()->json(['message' => 'Configuracoes salvas.']);
    }

    public function concluirOnboarding(Request $request): JsonResponse
    {
        $request->user()->empresa?->update(['onboarding_concluido' => true]);

        return response()->json(['success' => true]);
    }
}
