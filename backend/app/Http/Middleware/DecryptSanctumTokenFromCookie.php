<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DecryptSanctumTokenFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->headers->has('Authorization') && $request->hasCookie('srh_token')) {
            $token = $request->cookie('srh_token');
            if (!empty($token)) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
