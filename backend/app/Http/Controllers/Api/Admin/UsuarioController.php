<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Colaborador;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $usuarios = User::where('empresa_id', $request->user()->empresa_id)
            ->orderBy('nome')
            ->get(['id', 'nome', 'email', 'perfil', 'grupo_escuta', 'cargo', 'ativo', 'created_at']);

        return response()->json(['data' => $usuarios]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome'   => 'required|string|max:255',
            'email'  => 'required|email|unique:users',
            'perfil' => 'required|in:admin,gestor,consultor,leitura',
            'grupo_escuta' => 'nullable|in:rh,diretoria,presidencia',
            'cargo'  => 'nullable|string',
            'senha'  => 'required|string|min:8',
        ]);

        $usuario = User::create([
            'nome'       => $validated['nome'],
            'email'      => $validated['email'],
            'perfil'     => $validated['perfil'],
            'grupo_escuta' => $validated['grupo_escuta'] ?? null,
            'cargo'      => $validated['cargo'] ?? null,
            'password'   => Hash::make($validated['senha']),
            'empresa_id' => $request->user()->empresa_id,
        ]);

        return response()->json($usuario->only(['id', 'nome', 'email', 'perfil', 'grupo_escuta', 'cargo', 'ativo']), 201);
    }

    /**
     * Funcionarios que ainda NAO tem acesso ao painel.
     * Base para promover um colaborador a usuario (ex.: alguem do RH que
     * precisa tratar relatos do Canal de Escuta).
     */
    public function colaboradoresElegiveis(Request $request): JsonResponse
    {
        $empresaId = $request->user()->empresa_id;

        $colaboradores = Colaborador::where('empresa_id', $empresaId)
            ->where('status', 'ativo')
            ->whereNotNull('email')
            ->whereNotIn('email', User::where('empresa_id', $empresaId)->pluck('email'))
            ->orderBy('nome')
            ->get(['id', 'nome', 'email', 'cargo']);

        return response()->json(['data' => $colaboradores]);
    }

    /**
     * Promove um funcionario a usuario do painel, mantendo o cadastro de
     * colaborador intacto (ele continua usando o app normalmente).
     */
    public function promover(Request $request): JsonResponse
    {
        $empresaId = $request->user()->empresa_id;

        $validated = $request->validate([
            'colaborador_id' => 'required|integer',
            'perfil'         => 'required|in:admin,gestor,consultor,leitura',
            'grupo_escuta'   => 'nullable|in:rh,diretoria,presidencia',
            'senha'          => 'required|string|min:8',
        ]);

        $colaborador = Colaborador::where('id', $validated['colaborador_id'])
            ->where('empresa_id', $empresaId)
            ->firstOrFail();

        abort_if(!$colaborador->email, 422, 'Este funcionario nao tem e-mail cadastrado.');
        abort_if(
            User::where('email', $colaborador->email)->exists(),
            422,
            'Ja existe um usuario do painel com este e-mail.'
        );

        $usuario = User::create([
            'nome'         => $colaborador->nome,
            'email'        => $colaborador->email,
            'perfil'       => $validated['perfil'],
            'grupo_escuta' => $validated['grupo_escuta'] ?? null,
            'cargo'        => $colaborador->cargo,
            'password'     => Hash::make($validated['senha']),
            'empresa_id'   => $empresaId,
        ]);

        return response()->json(
            $usuario->only(['id', 'nome', 'email', 'perfil', 'grupo_escuta', 'cargo', 'ativo']),
            201
        );
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_if($user->empresa_id !== $request->user()->empresa_id, 403);

        // Evita o admin se trancar fora do painel (perder o proprio acesso)
        if ($user->id === $request->user()->id) {
            abort_if(
                $request->has('perfil') && $request->input('perfil') !== $user->perfil,
                422,
                'Voce nao pode alterar o proprio perfil de acesso.'
            );
            abort_if($request->boolean('ativo') === false && $request->has('ativo'), 422, 'Voce nao pode desativar o proprio usuario.');
        }

        $validated = $request->validate([
            'nome'   => 'sometimes|string|max:255',
            'perfil' => 'in:admin,gestor,consultor,leitura',
            'grupo_escuta' => 'sometimes|nullable|in:rh,diretoria,presidencia',
            'cargo'  => 'nullable|string',
            'ativo'  => 'boolean',
            'senha'  => 'nullable|string|min:8',
        ]);

        if (isset($validated['senha'])) {
            $validated['password'] = Hash::make($validated['senha']);
            unset($validated['senha']);
        }

        $user->update($validated);

        // fresh() recebe RELACOES, nao colunas — usar refresh() + only()
        return response()->json(
            $user->refresh()->only(['id', 'nome', 'email', 'perfil', 'grupo_escuta', 'cargo', 'ativo'])
        );
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_if($user->empresa_id !== $request->user()->empresa_id, 403);
        abort_if($user->id === $request->user()->id, 422, 'Não é possível remover seu próprio usuário.');

        $user->delete();

        return response()->json(['message' => 'Usuário removido.']);
    }
}
