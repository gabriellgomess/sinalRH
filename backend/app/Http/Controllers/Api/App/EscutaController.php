<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\RelatoEscuta;
use App\Models\User;
use App\Services\EscutaNotificacaoService;
use App\Services\EscutaRoteamentoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EscutaController extends Controller
{
    public function store(Request $request, EscutaRoteamentoService $roteamento, EscutaNotificacaoService $notificacao): JsonResponse
    {
        $colaborador = $request->user();
        $empresaId = $colaborador->empresa_id;

        $validated = $request->validate([
            'modo'           => 'required|in:anonimo,identificado',
            'categoria'      => 'required|string|max:100',
            'tag'            => 'nullable|string|max:50',
            'texto'          => 'required|string|min:10|max:3000',
            'tipo_envolvido' => 'required|in:colaborador_setor,lideranca,rh,diretoria,presidencia,nao_sabe,nao_informar',
            'cargo_nivel_denunciado' => 'nullable|string|max:150',
            'setor_denunciado_id'    => [
                'nullable', 'integer',
                Rule::exists('setores', 'id')->where('empresa_id', $empresaId),
            ],
            'usuario_denunciado_id'  => [
                'nullable', 'integer',
                Rule::exists('users', 'id')->where('empresa_id', $empresaId),
            ],
        ]);

        // Grupo do denunciado (se um usuario foi indicado) para escalar acima dele.
        $grupoDenunciado = null;
        if (!empty($validated['usuario_denunciado_id'])) {
            $grupoDenunciado = User::where('id', $validated['usuario_denunciado_id'])
                ->where('empresa_id', $empresaId)
                ->value('grupo_escuta');
        }

        $destino = $roteamento->calcular($validated['tipo_envolvido'], $grupoDenunciado);

        $relato = RelatoEscuta::create([
            'empresa_id'             => $empresaId,
            // Sigilo: anonimo NUNCA grava colaborador_id.
            'colaborador_id'         => $validated['modo'] === 'identificado' ? $colaborador->id : null,
            'setor_id'               => $colaborador->setor_id,
            'modo'                   => $validated['modo'],
            'categoria'              => $validated['categoria'],
            'tag'                    => $validated['tag'] ?? null,
            'texto'                  => $validated['texto'],
            'tipo_envolvido'         => $validated['tipo_envolvido'],
            'setor_denunciado_id'    => $validated['setor_denunciado_id'] ?? null,
            'usuario_denunciado_id'  => $validated['usuario_denunciado_id'] ?? null,
            'cargo_nivel_denunciado' => $validated['cargo_nivel_denunciado'] ?? null,
            'origem'                 => 'interno',
            'protocolo'              => RelatoEscuta::gerarProtocolo(),
            'grupo_destino'          => $destino['grupo_destino'],
            'nivel_sigilo'           => $destino['nivel_sigilo'],
            'status'                 => 'pendente',
            'prioridade'             => $notificacao->prioridade($validated['categoria'], $validated['texto']),
        ]);

        $identificacao = $validated['modo'] === 'identificado'
            ? ($colaborador->nome . ' (' . $colaborador->email . ')')
            : 'Relato anonimo';
        $notificacao->novoRelato($relato, $identificacao);

        return response()->json([
            'protocolo' => $relato->protocolo,
            'message'   => 'Relato enviado com seguranca. Sua mensagem chegara ao grupo responsavel, com sigilo.',
        ], 201);
    }

}
