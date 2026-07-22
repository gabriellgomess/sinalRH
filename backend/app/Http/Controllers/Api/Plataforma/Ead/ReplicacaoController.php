<?php

namespace App\Http\Controllers\Api\Plataforma\Ead;

use App\Http\Controllers\Controller;
use App\Models\Ead\Curso;
use App\Models\Ead\CursoEmpresa;
use App\Models\Empresa;
use App\Models\EmpresaProduto;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReplicacaoController extends Controller
{
    /**
     * Lista as empresas elegiveis (com produto EAD ativo) e o estado da
     * liberacao do curso para cada uma.
     */
    public function index(Curso $curso): JsonResponse
    {
        $empresaIdsComEad = EmpresaProduto::where('produto', 'ead')
            ->where('status', 'ativo')
            ->pluck('empresa_id')
            ->unique();

        $empresas = Empresa::whereIn('id', $empresaIdsComEad)
            ->orderBy('nome_fantasia')
            ->get(['id', 'nome_fantasia', 'razao_social']);

        $liberacoes = $curso->liberacoes()->get()->keyBy('empresa_id');

        $data = $empresas->map(function ($e) use ($liberacoes) {
            $lib = $liberacoes->get($e->id);
            return [
                'empresa_id'   => $e->id,
                'nome'         => $e->nome_fantasia ?: $e->razao_social,
                'liberado'     => (bool) ($lib && $lib->ativo),
                'liberacao_id' => $lib?->id,
                'setor_id'     => $lib?->setor_id,
                'prazo'        => $lib?->prazo?->toDateString(),
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Libera (replica) o curso para uma lista de empresas.
     * payload: { empresas: [{empresa_id, setor_id?, prazo?}] }
     */
    public function store(Request $request, Curso $curso): JsonResponse
    {
        $validated = $request->validate([
            'empresas'              => 'required|array|min:1',
            'empresas.*.empresa_id' => 'required|integer|exists:empresas,id',
            'empresas.*.setor_id'   => 'nullable|integer|exists:setores,id',
            'empresas.*.prazo'      => 'nullable|date',
        ]);

        // Restringe a empresas que realmente possuem o produto EAD ativo.
        $elegiveis = EmpresaProduto::where('produto', 'ead')
            ->where('status', 'ativo')
            ->pluck('empresa_id')
            ->unique()
            ->flip();

        $liberadas = 0;
        foreach ($validated['empresas'] as $item) {
            if (!isset($elegiveis[$item['empresa_id']])) {
                continue; // ignora empresas sem o produto EAD
            }

            CursoEmpresa::updateOrCreate(
                ['curso_id' => $curso->id, 'empresa_id' => $item['empresa_id']],
                [
                    'ativo'        => true,
                    'setor_id'     => $item['setor_id'] ?? null,
                    'prazo'        => $item['prazo'] ?? null,
                    'liberado_em'  => now(),
                    'liberado_por' => $request->user()->id,
                ]
            );
            $liberadas++;
        }

        AuditLogger::log($request, 'ead.curso.liberar', $curso,
            "Liberou curso EAD {$curso->titulo} para {$liberadas} empresa(s).");

        return response()->json(['success' => true, 'liberadas' => $liberadas]);
    }

    /**
     * Atualiza uma liberacao (ativar/desativar, setor, prazo).
     */
    public function update(Request $request, Curso $curso, Empresa $empresa): JsonResponse
    {
        $validated = $request->validate([
            'ativo'    => 'nullable|boolean',
            'setor_id' => 'nullable|integer|exists:setores,id',
            'prazo'    => 'nullable|date',
        ]);

        $lib = CursoEmpresa::updateOrCreate(
            ['curso_id' => $curso->id, 'empresa_id' => $empresa->id],
            array_merge($validated, [
                'liberado_em'  => now(),
                'liberado_por' => $request->user()->id,
            ])
        );

        return response()->json(['success' => true, 'data' => $lib]);
    }

    /**
     * Remove a liberacao do curso para a empresa (preserva matriculas/historico).
     */
    public function destroy(Request $request, Curso $curso, Empresa $empresa): JsonResponse
    {
        CursoEmpresa::where('curso_id', $curso->id)
            ->where('empresa_id', $empresa->id)
            ->delete();

        AuditLogger::log($request, 'ead.curso.remover_liberacao', $curso,
            "Removeu liberacao do curso EAD {$curso->titulo} da empresa {$empresa->nome_fantasia}.");

        return response()->json(['success' => true, 'message' => 'Liberação removida.']);
    }
}
