<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $token = $request->user()?->currentAccessToken();
        if (!$token) {
            return response()->json(['error' => 'Não autenticado.'], 401);
        }

        $hasRole = collect($roles)->contains(function ($role) use ($token) {
            return $token->can("role:{$role}");
        });

        if (!$hasRole) {
            return response()->json(['error' => 'Acesso não autorizado.'], 403);
        }

        return $next($request);
    }
}
