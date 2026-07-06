<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
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

        return response()->json($usuario->only(['id', 'nome', 'email', 'perfil', 'grupo_escuta', 'cargo']), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_if($user->empresa_id !== $request->user()->empresa_id, 403);

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

        return response()->json($user->fresh(['id', 'nome', 'email', 'perfil', 'grupo_escuta', 'cargo', 'ativo']));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_if($user->empresa_id !== $request->user()->empresa_id, 403);
        abort_if($user->id === $request->user()->id, 422, 'Não é possível remover seu próprio usuário.');

        $user->delete();

        return response()->json(['message' => 'Usuário removido.']);
    }
}
