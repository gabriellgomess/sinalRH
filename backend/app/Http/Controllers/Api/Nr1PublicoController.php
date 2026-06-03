<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Nr1Avaliacao;
use App\Models\Nr1Respondente;
use App\Models\Nr1Resposta;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class Nr1PublicoController extends Controller
{
    // GET /nr1/{codigo} — carrega avaliação pelo código público (sem auth)
    public function show(string $codigo): JsonResponse
    {
        $avaliacao = Nr1Avaliacao::where('codigo', strtoupper($codigo))
            ->where('status', 'ativa')
            ->first();

        if (!$avaliacao) {
            return response()->json([
                'success' => false,
                'message' => 'Avaliação não encontrada ou não está disponível.',
            ], 404);
        }

        if ($avaliacao->expira_em && now()->greaterThan($avaliacao->expira_em->endOfDay())) {
            return response()->json([
                'success' => false,
                'message' => 'Esta avaliação expirou em ' . $avaliacao->expira_em->format('d/m/Y') . ' e não está mais disponível.',
            ], 404);
        }

        // Verifica o limite de respondentes do Diagnóstico NR-1
        $produto = \App\Models\EmpresaProduto::where('empresa_id', $avaliacao->empresa_id)
            ->where('produto', 'diagnostico_nr1')
            ->where('status', 'ativo')
            ->first();

        if ($produto && $produto->limite_colaboradores) {
            $respondentesCount = \App\Models\Nr1Respondente::where('avaliacao_id', $avaliacao->id)->count();
            if ($respondentesCount >= $produto->limite_colaboradores) {
                return response()->json([
                    'success' => false,
                    'excedeu_limite' => true,
                    'message' => "O limite de empregados para responder a esta avaliação foi atingido ({$produto->limite_colaboradores}).",
                ], 422);
            }
        }

        $setores = Setor::where('empresa_id', $avaliacao->empresa_id)
            ->select('id', 'nome')
            ->orderBy('nome')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'         => $avaliacao->id,
                'titulo'     => $avaliacao->titulo,
                'empresa'    => $avaliacao->empresa->nome_fantasia,
                'setores'    => $setores,
            ],
        ]);
    }

    // POST /nr1/{codigo}/responder — identifica respondente e registra respostas em bloco
    public function responder(Request $request, string $codigo): JsonResponse
    {
        $avaliacao = Nr1Avaliacao::where('codigo', strtoupper($codigo))
            ->where('status', 'ativa')
            ->first();

        if (!$avaliacao) {
            return response()->json([
                'success' => false,
                'message' => 'Avaliação não encontrada ou não está mais disponível.',
            ], 404);
        }

        if ($avaliacao->expira_em && now()->greaterThan($avaliacao->expira_em->endOfDay())) {
            return response()->json([
                'success' => false,
                'message' => 'Esta avaliação expirou em ' . $avaliacao->expira_em->format('d/m/Y') . ' e não aceita mais respostas.',
            ], 404);
        }

        // Verifica o limite de respondentes do Diagnóstico NR-1
        $produto = \App\Models\EmpresaProduto::where('empresa_id', $avaliacao->empresa_id)
            ->where('produto', 'diagnostico_nr1')
            ->where('status', 'ativo')
            ->first();

        if ($produto && $produto->limite_colaboradores) {
            $respondentesCount = \App\Models\Nr1Respondente::where('avaliacao_id', $avaliacao->id)->count();
            if ($respondentesCount >= $produto->limite_colaboradores) {
                return response()->json([
                    'success' => false,
                    'message' => "O limite de empregados para responder a este diagnóstico foi atingido ({$produto->limite_colaboradores}).",
                ], 422);
            }
        }

        $validated = $request->validate([
            'setor_id'     => [
                'required',
                'integer',
                Rule::exists('setores', 'id')->where('empresa_id', $avaliacao->empresa_id),
            ],
            'sexo'         => 'required|in:masculino,feminino,nao_informado',
            'faixa_etaria' => 'required|in:menos_18,19_34,35_44,45_mais',
            'respostas'    => 'required|array|min:40|max:40',
            'respostas.*.secao' => 'required|integer|between:1,10',
            'respostas.*.item'  => 'required|integer|min:1',
            'respostas.*.valor' => 'required|in:1,2,3,4,5',
        ]);

        // Cria respondente anônimo
        $respondente = Nr1Respondente::create([
            'avaliacao_id' => $avaliacao->id,
            'setor_id'     => $validated['setor_id'],
            'sexo'         => $validated['sexo'],
            'faixa_etaria' => $validated['faixa_etaria'],
        ]);

        // Insere respostas em lote
        $respostas = array_map(fn ($r) => [
            'respondente_id' => $respondente->id,
            'avaliacao_id'   => $avaliacao->id,
            'secao'          => $r['secao'],
            'item'           => $r['item'],
            'valor'          => $r['valor'],
            'created_at'     => now(),
            'updated_at'     => now(),
        ], $validated['respostas']);

        Nr1Resposta::insert($respostas);

        return response()->json([
            'success' => true,
            'message' => 'Respostas registradas com sucesso. Obrigado pela participação!',
        ]);
    }
}
