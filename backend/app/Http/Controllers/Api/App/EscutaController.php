<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Mail\EscutaComiteMail;
use App\Mail\EscutaNovoRelatoMail;
use App\Models\Empresa;
use App\Models\RelatoEscuta;
use App\Models\User;
use App\Services\EscutaRoteamentoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class EscutaController extends Controller
{
    public function store(Request $request, EscutaRoteamentoService $roteamento): JsonResponse
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
            'grupo_destino'          => $destino['grupo_destino'],
            'nivel_sigilo'           => $destino['nivel_sigilo'],
            'status'                 => 'pendente',
            'prioridade'             => $this->calcularPrioridade($validated['categoria'], $validated['texto']),
        ]);

        $this->notificar($relato, $colaborador);

        return response()->json([
            'message' => 'Relato enviado com seguranca. Sua mensagem chegara ao grupo responsavel, com sigilo.',
        ], 201);
    }

    /**
     * Notifica o destino do relato. Falhas de e-mail NUNCA bloqueiam o registro
     * da denuncia (a submissao ja foi persistida).
     */
    private function notificar(RelatoEscuta $relato, $colaborador): void
    {
        try {
            $empresa = $colaborador->empresa ?? Empresa::find($relato->empresa_id);
            if (!$empresa) {
                return;
            }

            if ($relato->grupo_destino === 'comite_externo') {
                if ($empresa->escuta_comite_email) {
                    $identificacao = $relato->modo === 'identificado'
                        ? ($colaborador->nome . ' (' . $colaborador->email . ')')
                        : 'Relato anonimo';

                    Mail::to($empresa->escuta_comite_email)->queue(new EscutaComiteMail([
                        'empresa'       => $empresa->nome_fantasia,
                        'ref'           => $relato->id,
                        'categoria'     => $relato->categoria,
                        'prioridade'    => $relato->prioridade,
                        'texto'         => $relato->texto,
                        'identificacao' => $identificacao,
                    ]));
                }
                return;
            }

            // Grupos internos: avisa os responsaveis (sem conteudo/identidade),
            // exceto quem for o proprio denunciado.
            $labels = ['rh' => 'RH', 'diretoria' => 'Diretoria', 'presidencia' => 'Presidencia'];
            $responsaveis = User::where('empresa_id', $empresa->id)
                ->where('grupo_escuta', $relato->grupo_destino)
                ->when($relato->usuario_denunciado_id, fn ($q) => $q->where('id', '!=', $relato->usuario_denunciado_id))
                ->pluck('email')
                ->filter();

            foreach ($responsaveis as $email) {
                Mail::to($email)->queue(new EscutaNovoRelatoMail(
                    $empresa->nome_fantasia,
                    $labels[$relato->grupo_destino] ?? $relato->grupo_destino,
                    $relato->prioridade,
                ));
            }
        } catch (\Throwable $e) {
            Log::warning('Falha ao notificar relato de escuta', ['relato_id' => $relato->id, 'erro' => $e->getMessage()]);
        }
    }

    private function calcularPrioridade(string $categoria, string $texto): string
    {
        $textoLower = mb_strtolower($texto);

        foreach (['assédio', 'assedio', 'violência', 'violencia', 'ameaça', 'ameaca'] as $palavra) {
            if (str_contains($textoLower, $palavra)) {
                return 'critica';
            }
        }

        foreach (['discriminação', 'discriminacao', 'urgente'] as $palavra) {
            if (str_contains($textoLower, $palavra)) {
                return 'alta';
            }
        }

        if (str_contains($categoria, 'assedio') || str_contains($categoria, 'discriminacao')) {
            return 'alta';
        }

        return 'media';
    }
}
