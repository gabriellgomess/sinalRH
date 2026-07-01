<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Colaborador;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── Login do Colaborador (PWA) ────────────────────────────────────────
    public function loginColaborador(Request $request): JsonResponse
    {
        $request->validate([
            'login'  => 'required|string', // email, cpf ou codigo_acesso
            'senha'  => 'required|string|min:4',
        ]);

        $login = trim($request->login);

        $colaborador = Colaborador::where(function ($query) use ($login) {
                $query->where('email', $login)
                    ->orWhere('cpf', $login)
                    ->orWhere('codigo_acesso', strtoupper($login));
            })
            ->where('status', 'ativo')
            ->first();

        if (!$colaborador || !Hash::check($request->senha, $colaborador->password)) {
            throw ValidationException::withMessages([
                'login' => 'Credenciais inválidas. Verifique seu e-mail, CPF ou código de acesso.',
            ]);
        }

        // Bloqueia acesso se a empresa do colaborador estiver suspensa/cancelada ou removida.
        if (($empresa = $colaborador->empresa) === null || $empresa->status !== 'ativo') {
            throw ValidationException::withMessages([
                'login' => 'Acesso indisponivel: a empresa esta suspensa ou encerrada. Fale com o suporte.',
            ]);
        }

        $token = $colaborador->createToken('pwa-mobile', ['role:colaborador'], now()->addDays(30));
        $plainToken = $token->plainTextToken;

        return response()->json([
            'token' => $plainToken,
            'tipo'  => 'colaborador',
            'user'  => [
                'id'                  => $colaborador->id,
                'nome'                => $colaborador->nome,
                'email'               => $colaborador->email,
                'cargo'               => $colaborador->cargo,
                'setor'               => $colaborador->setor?->nome,
                'empresa'             => $colaborador->empresa->nome_fantasia,
                'iniciais'            => $colaborador->iniciais,
                'checkins_streak'     => $colaborador->streak_checkins,
                'pesquisas_concluidas'=> $colaborador->respostas()
                        ->join('perguntas', 'perguntas.id', '=', 'respostas.pergunta_id')
                        ->distinct('perguntas.pesquisa_id')
                        ->count('perguntas.pesquisa_id'),
            ],
        ])->cookie('srh_token', $plainToken, 43200, null, null, request()->secure(), true, false, 'lax');
    }

    // ── Login do Admin / Gestor ────────────────────────────────────────────
    public function loginAdmin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'senha' => 'required|string|min:4',
        ]);

        $user = User::where('email', $request->email)
            ->where('ativo', true)
            ->first();

        if (!$user || !Hash::check($request->senha, $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Credenciais inválidas.',
            ]);
        }

        // Bloqueia acesso se a empresa do usuario estiver suspensa/cancelada ou removida.
        // super_admin nao possui empresa (empresa_id nulo) e passa direto.
        if ($user->empresa_id && (($empresa = $user->empresa) === null || $empresa->status !== 'ativo')) {
            throw ValidationException::withMessages([
                'email' => 'Acesso indisponivel: a empresa esta suspensa ou encerrada. Fale com o suporte.',
            ]);
        }

        $token = $user->createToken('admin-dashboard', ['role:' . $user->perfil]);
        $plainToken = $token->plainTextToken;

        return response()->json([
            'token' => $plainToken,
            'tipo'  => $user->perfil,
            'user'  => [
                'id'      => $user->id,
                'nome'    => $user->nome,
                'email'   => $user->email,
                'cargo'   => $user->cargo,
                'perfil'  => $user->perfil,
                'iniciais'=> $user->iniciais ?? mb_strtoupper(mb_substr($user->nome, 0, 2)),
                'empresa'              => $user->empresa?->nome_fantasia ?? 'Sara Linhar Consultoria',
                'onboarding_concluido' => (bool) ($user->empresa?->onboarding_concluido ?? true),
            ],
        ])->cookie('srh_token', $plainToken, 43200, null, null, request()->secure(), true, false, 'lax');
    }

    // ── Logout ────────────────────────────────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sessão encerrada.'])
            ->withoutCookie('srh_token');
    }

    // ── Usuário autenticado atual ─────────────────────────────────────────
    public function validarConviteColaborador(string $token): JsonResponse
    {
        $colaborador = Colaborador::with('empresa')
            ->where('convite_token', $token)
            ->whereNull('convite_aceito_em')
            ->where('convite_expira_em', '>', now())
            ->firstOrFail();

        return response()->json([
            'nome' => $colaborador->nome,
            'email' => $colaborador->email,
            'empresa' => $colaborador->empresa?->nome_fantasia,
        ]);
    }

    public function aceitarConviteColaborador(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'senha' => 'required|string|min:6|confirmed',
        ]);

        $colaborador = Colaborador::where('convite_token', $token)
            ->whereNull('convite_aceito_em')
            ->where('convite_expira_em', '>', now())
            ->firstOrFail();

        $colaborador->update([
            'password' => $validated['senha'],
            'convite_token' => null,
            'convite_expira_em' => null,
            'convite_aceito_em' => now(),
            'codigo_acesso' => $colaborador->codigo_acesso ?: Str::upper(Str::random(8)),
            'status' => 'ativo',
        ]);

        return response()->json(['message' => 'Senha definida com sucesso.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }
}
