<?php

namespace App\Http\Controllers\Api\Plataforma;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmpresaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresas = Empresa::withCount([
                'colaboradores' => fn ($q) => $q->where('status', 'ativo'),
                'setores',
            ])
            ->with(['users' => fn ($q) => $q->where('perfil', 'admin')->select('id', 'nome', 'email', 'empresa_id')])
            ->when($request->search, fn ($q) => $q->where('nome_fantasia', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->plano,  fn ($q) => $q->where('plano', $request->plano))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($empresas);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome_fantasia'    => 'required|string|max:150',
            'razao_social'     => 'nullable|string|max:200',
            'cnpj'             => 'nullable|string|max:20',
            'email_contato'    => 'nullable|email|max:150',
            'telefone'         => 'nullable|string|max:20',
            'plano'            => 'required|in:free,starter,pleno,enterprise',
            'max_colaboradores'=> 'nullable|integer|min:1',
            'admin_nome'       => 'required|string|max:150',
            'admin_email'      => 'required|email|unique:users,email',
        ]);

        $empresa = Empresa::create([
            'nome_fantasia'     => $validated['nome_fantasia'],
            'razao_social'      => $validated['razao_social'] ?? '',
            'cnpj'              => $validated['cnpj'] ?? '',
            'email_contato'     => $validated['email_contato'] ?? '',
            'telefone'          => $validated['telefone'] ?? '',
            'plano'             => $validated['plano'],
            'status'            => 'ativo',
            'max_colaboradores' => $validated['max_colaboradores'] ?? 100,
        ]);

        $senha = Str::password(12, true, true, false);

        $admin = User::create([
            'nome'       => $validated['admin_nome'],
            'email'      => $validated['admin_email'],
            'password'   => Hash::make($senha),
            'perfil'     => 'admin',
            'empresa_id' => $empresa->id,
        ]);

        return response()->json([
            'empresa' => $empresa,
            'acesso'  => [
                'nome'  => $admin->nome,
                'email' => $admin->email,
                'senha' => $senha,
            ],
        ], 201);
    }

    public function show(Empresa $empresa): JsonResponse
    {
        $empresa->load([
            'users' => fn ($q) => $q->whereIn('perfil', ['admin', 'gestor', 'consultor'])
                                    ->select('id', 'nome', 'email', 'perfil', 'cargo', 'empresa_id'),
            'setores:id,empresa_id,nome,unidade',
        ]);

        $empresa->loadCount([
            'colaboradores' => fn ($q) => $q->where('status', 'ativo'),
            'setores',
            'pesquisas',
        ]);

        return response()->json($empresa);
    }

    public function update(Request $request, Empresa $empresa): JsonResponse
    {
        $validated = $request->validate([
            'nome_fantasia'    => 'sometimes|string|max:150',
            'razao_social'     => 'sometimes|string|max:200',
            'cnpj'             => 'sometimes|string|max:20',
            'email_contato'    => 'sometimes|email|max:150',
            'telefone'         => 'sometimes|string|max:20',
            'plano'            => 'sometimes|in:free,starter,pleno,enterprise',
            'status'           => 'sometimes|in:ativo,suspenso,cancelado',
            'max_colaboradores'=> 'sometimes|integer|min:1',
        ]);

        $empresa->update($validated);

        return response()->json($empresa->fresh());
    }

    public function destroy(Empresa $empresa): JsonResponse
    {
        $empresa->update(['status' => 'cancelado']);
        return response()->json(['message' => 'Empresa cancelada.']);
    }
}
