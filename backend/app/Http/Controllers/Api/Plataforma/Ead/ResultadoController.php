<?php

namespace App\Http\Controllers\Api\Plataforma\Ead;

use App\Http\Controllers\Controller;
use App\Models\Colaborador;
use App\Models\Ead\Curso;
use App\Models\Ead\Matricula;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResultadoController extends Controller
{
    /** Indices consolidados do curso (todas as empresas ou filtrado). */
    public function index(Request $request, Curso $curso): JsonResponse
    {
        $empresaId = $request->integer('empresa_id') ?: null;

        $matriculas = $this->consultar($curso, $empresaId);

        $matriculados = $matriculas->count();
        $concluidos   = $matriculas->where('status', 'concluido')->count();
        $andamento    = $matriculas->where('status', 'em_andamento')->count();
        $execMedia    = $matriculados > 0 ? round($matriculas->avg('progresso_pct'), 1) : 0;
        $comNota      = $matriculas->whereNotNull('nota_final');
        $notaMedia    = $comNota->count() > 0 ? round($comNota->avg('nota_final'), 1) : null;

        return response()->json([
            'success' => true,
            'curso'   => ['id' => $curso->id, 'titulo' => $curso->titulo],
            'resumo'  => [
                'matriculados'   => $matriculados,
                'em_andamento'   => $andamento,
                'concluidos'     => $concluidos,
                'execucao_media' => $execMedia,
                'nota_media'     => $notaMedia,
            ],
            'colaboradores' => $matriculas->map(fn ($m) => [
                'colaborador' => $m->colaborador?->nome,
                'empresa'     => $m->colaborador?->empresa?->nome_fantasia,
                'setor'       => $m->colaborador?->setor?->nome,
                'status'      => $m->status,
                'progresso'   => $m->progresso_pct,
                'nota_final'  => $m->nota_final,
                'concluido_em'=> $m->concluido_em?->format('d/m/Y'),
            ])->values(),
            'empresas' => $curso->liberacoes()->with('empresa:id,nome_fantasia')->get()
                ->map(fn ($l) => ['id' => $l->empresa_id, 'nome' => $l->empresa?->nome_fantasia])
                ->unique('id')->values(),
        ]);
    }

    public function exportar(Request $request, Curso $curso): StreamedResponse
    {
        $empresaId = $request->integer('empresa_id') ?: null;
        $matriculas = $this->consultar($curso, $empresaId);

        $nome = 'ead_' . preg_replace('/[^a-z0-9]+/i', '_', strtolower($curso->titulo)) . '.csv';

        return response()->streamDownload(function () use ($matriculas) {
            $out = fopen('php://output', 'w');
            fprintf($out, "\xEF\xBB\xBF"); // BOM UTF-8
            fputcsv($out, ['Colaborador', 'Empresa', 'Setor', 'Status', 'Execucao (%)', 'Nota final (%)', 'Concluido em'], ';');
            foreach ($matriculas as $m) {
                fputcsv($out, [
                    $m->colaborador?->nome,
                    $m->colaborador?->empresa?->nome_fantasia,
                    $m->colaborador?->setor?->nome,
                    $m->status,
                    $m->progresso_pct,
                    $m->nota_final ?? '',
                    $m->concluido_em?->format('d/m/Y') ?? '',
                ], ';');
            }
            fclose($out);
        }, $nome, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function consultar(Curso $curso, ?int $empresaId)
    {
        return Matricula::where('curso_id', $curso->id)
            ->with(['colaborador.empresa:id,nome_fantasia', 'colaborador.setor:id,nome'])
            ->when($empresaId, fn ($q) => $q->whereHas('colaborador', fn ($c) => $c->where('empresa_id', $empresaId)))
            ->get();
    }
}
