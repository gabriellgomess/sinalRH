<?php

namespace App\Support;

use App\Models\Auditoria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogger
{
    public static function log(
        Request $request,
        string $acao,
        ?Model $entidade = null,
        ?string $descricao = null,
        ?array $antes = null,
        ?array $depois = null
    ): void {
        $user = $request->user();
        $empresaId = $user?->empresa_id ?? $entidade?->empresa_id;

        if (!$empresaId) {
            return;
        }

        Auditoria::create([
            'empresa_id' => $empresaId,
            'user_id' => $user?->id,
            'acao' => $acao,
            'entidade_tipo' => $entidade ? class_basename($entidade) : null,
            'entidade_id' => $entidade?->getKey(),
            'descricao' => $descricao,
            'antes' => $antes,
            'depois' => $depois,
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1000),
        ]);
    }
}
