<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SincronizarCustomerAsaasJob;
use App\Mail\ColaboradorConviteMail;
use App\Mail\EmpresaCadastroMail;
use App\Models\Colaborador;
use App\Models\Empresa;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class CadastroController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome_fantasia' => 'required|string|max:150',
            'cnpj'          => 'nullable|string|max:20',
            'segmento'      => 'nullable|string|max:100',
            'porte'         => 'nullable|in:micro,pequeno,medio,grande',
            'admin_nome'    => 'required|string|max:150',
            'admin_cargo'   => 'nullable|string|max:150',
            'admin_email'   => 'required|email|max:150|unique:users,email',
            'admin_senha'   => ['required', 'confirmed', Password::min(8)],
        ]);

        $empresa = Empresa::create([
            'nome_fantasia'      => $validated['nome_fantasia'],
            'razao_social'       => '',
            'cnpj'               => $validated['cnpj'] ?? '',
            'segmento'           => $validated['segmento'] ?? null,
            'porte'              => $validated['porte'] ?? 'pequeno',
            'plano'              => 'free',
            'status'             => 'ativo',
            'max_colaboradores'  => 50,
            'onboarding_concluido' => false,
        ]);

        $admin = User::create([
            'nome'       => $validated['admin_nome'],
            'email'      => $validated['admin_email'],
            'password'   => $validated['admin_senha'],
            'perfil'     => 'admin',
            'empresa_id' => $empresa->id,
            'cargo'      => $validated['admin_cargo'] ?? null,
        ]);

        Mail::to($admin->email)->queue(new EmpresaCadastroMail($empresa, $admin));
        SincronizarCustomerAsaasJob::dispatch($empresa);

        $token = $admin->createToken('admin-dashboard', ['role:admin']);

        return response()->json([
            'token' => $token->plainTextToken,
            'tipo'  => 'admin',
            'user'  => [
                'id'                   => $admin->id,
                'nome'                 => $admin->nome,
                'email'                => $admin->email,
                'cargo'                => $admin->cargo,
                'perfil'               => $admin->perfil,
                'iniciais'             => mb_strtoupper(mb_substr($admin->nome, 0, 2)),
                'empresa'              => $empresa->nome_fantasia,
                'onboarding_concluido' => false,
            ],
        ], 201);
    }

    public function concluirOnboarding(Request $request): JsonResponse
    {
        $request->user()->empresa?->update(['onboarding_concluido' => true]);

        return response()->json(['success' => true]);
    }

    public function setoresOnboarding(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;
        abort_unless($empresa, 403);

        $validated = $request->validate([
            'setores'   => 'required|array|min:1|max:30',
            'setores.*' => 'required|string|max:100',
        ]);

        $criados = [];
        foreach ($validated['setores'] as $nome) {
            $nome = trim($nome);
            if ($nome === '') continue;
            $criados[] = Setor::firstOrCreate(
                ['empresa_id' => $empresa->id, 'nome' => $nome],
                ['unidade' => 'Matriz']
            );
        }

        return response()->json([
            'success' => true,
            'data'    => ['setores' => $criados, 'total' => count($criados)],
        ]);
    }

    public function convitesOnboarding(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;
        abort_unless($empresa, 403);

        $validated = $request->validate([
            'convites'         => 'required|array|min:1|max:20',
            'convites.*.nome'  => 'required|string|max:150',
            'convites.*.email' => 'required|email|max:150',
            'setor_id'         => 'nullable|integer|exists:setores,id',
        ]);

        $setorId = $validated['setor_id'] ?? Setor::where('empresa_id', $empresa->id)->value('id');
        if (!$setorId) {
            return response()->json([
                'success' => false,
                'message' => 'Cadastre pelo menos um setor antes de convidar empregados.',
            ], 422);
        }

        $enviados = 0;
        $ignorados = [];
        foreach ($validated['convites'] as $item) {
            $email = mb_strtolower(trim($item['email']));
            if (Colaborador::where('empresa_id', $empresa->id)->where('email', $email)->exists()) {
                $ignorados[] = $email;
                continue;
            }

            $colaborador = Colaborador::create([
                'empresa_id'        => $empresa->id,
                'setor_id'          => $setorId,
                'nome'              => trim($item['nome']),
                'email'             => $email,
                'cargo'             => '',
                'status'            => 'ativo',
                'convite_token'     => Str::random(48),
                'convite_expira_em' => now()->addDays(14),
            ]);

            Mail::to($colaborador->email)->queue(new ColaboradorConviteMail($colaborador, $empresa));
            $enviados++;
        }

        return response()->json([
            'success' => true,
            'data'    => ['enviados' => $enviados, 'ignorados' => $ignorados],
        ]);
    }
}
