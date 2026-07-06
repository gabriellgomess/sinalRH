<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Pesquisa;
use App\Models\Resposta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PesquisaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $colaborador = $request->user();

        $pesquisas = Pesquisa::where('empresa_id', $colaborador->empresa_id)
            ->where('status', 'ativa')
            ->where(function ($q) use ($colaborador) {
                $q->whereNull('setor_id')
                  ->orWhere('setor_id', $colaborador->setor_id);
            })
            ->withCount('perguntas')
            ->get();

        // Marca se colaborador já respondeu
        $pesquisas = $pesquisas->map(function ($p) use ($colaborador) {
            $respondeu = $p->respostas()
                ->where('colaborador_id', $colaborador->id)
                ->exists();
            return array_merge($p->toArray(), ['respondeu' => $respondeu]);
        });

        return response()->json(['pesquisas' => $pesquisas]);
    }

    public function show(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $colaborador = $request->user();
        $this->garantirMesmaEmpresa($pesquisa);
        abort_if($pesquisa->status !== 'ativa', 404, 'Pesquisa não disponível.');
        abort_if($pesquisa->setor_id !== null && (int) $pesquisa->setor_id !== (int) $colaborador->setor_id, 404, 'Pesquisa não disponível.');

        // Verifica se já respondeu
        $jaRespondeu = $pesquisa->respostas()
            ->where('colaborador_id', $colaborador->id)
            ->exists();

        abort_if($jaRespondeu, 422, 'Você já respondeu esta pesquisa.');

        return response()->json([
            'pesquisa' => [
                'id'       => $pesquisa->id,
                'titulo'   => $pesquisa->titulo,
                'descricao'=> $pesquisa->descricao,
                'tipo'     => $pesquisa->tipo,
                'prazo'    => $pesquisa->prazo?->format('d/m/Y'),
                'anonima'  => $pesquisa->anonima,
            ],
            'perguntas' => $pesquisa->perguntas()->orderBy('ordem')->get([
                'id', 'texto', 'tipo', 'dimensao', 'ordem', 'obrigatoria', 'opcoes'
            ]),
        ]);
    }

    public function responder(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $colaborador = $request->user();
        $this->garantirMesmaEmpresa($pesquisa);
        abort_if($pesquisa->status !== 'ativa', 422, 'Pesquisa não está mais ativa.');
        abort_if($pesquisa->setor_id !== null && (int) $pesquisa->setor_id !== (int) $colaborador->setor_id, 403, 'Pesquisa não destinada ao seu setor.');

        // Verifica duplicata
        if ($pesquisa->respostas()->where('colaborador_id', $colaborador->id)->exists()) {
            throw ValidationException::withMessages([
                'pesquisa' => 'Você já respondeu esta pesquisa.',
            ]);
        }

        $request->validate([
            'respostas'                  => 'required|array',
            'respostas.*.pergunta_id'    => ['required', 'integer', Rule::exists('perguntas', 'id')->where('pesquisa_id', $pesquisa->id)],
            'respostas.*.valor_numerico' => 'nullable|numeric|min:0|max:10',
            'respostas.*.valor_texto'    => 'nullable|string|max:1000',
            'respostas.*.valor_opcao'    => 'nullable|integer',
        ]);

        DB::beginTransaction();
        try {
            $ipHash = hash('sha256', $request->ip() . $colaborador->empresa_id);

            foreach ($request->respostas as $respostaData) {
                Resposta::create([
                    'pergunta_id'    => $respostaData['pergunta_id'],
                    'colaborador_id' => $colaborador->id,
                    'valor_numerico' => $respostaData['valor_numerico'] ?? null,
                    'valor_texto'    => $respostaData['valor_texto'] ?? null,
                    'valor_opcao'    => $respostaData['valor_opcao'] ?? null,
                    'ip_hash'        => $ipHash,
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Pesquisa enviada com sucesso! Obrigada pela participação.',
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Erro ao registrar respostas.'], 500);
        }
    }
}
