<?php

namespace App\Http\Controllers\Api\Admin\Ead;

use App\Http\Controllers\Controller;
use App\Models\Ead\Curso;
use App\Models\Ead\CursoEmpresa;
use App\Models\Ead\Matricula;
use App\Models\EmpresaProduto;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Indices de execucao e notas dos colaboradores DA PROPRIA empresa.
 * So considera cursos liberados a essa empresa. Somente leitura.
 */
class ResultadoController extends Controller
{
    public function index(Request $request, Curso $curso): JsonResponse
    {
        $empresaId = $this->autorizar($request, $curso);
        $setorId   = $request->integer('setor_id') ?: null;

        $matriculas = $this->consultar($curso, $empresaId, $setorId);

        $matriculados = $matriculas->count();
        $concluidos   = $matriculas->where('status', 'concluido')->count();
        $andamento    = $matriculas->where('status', 'em_andamento')->count();
        $execMedia    = $matriculados > 0 ? round($matriculas->avg('progresso_pct'), 1) : 0;
        $comNota      = $matriculas->whereNotNull('nota_final');
        $notaMedia    = $comNota->count() > 0 ? round($comNota->avg('nota_final'), 1) : null;

        AuditLogger::log($request, 'ead.resultados.ver', $curso,
            "Consultou indices do curso EAD {$curso->titulo}.");

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
                'setor'       => $m->colaborador?->setor?->nome,
                'status'      => $m->status,
                'progresso'   => $m->progresso_pct,
                'nota_final'  => $m->nota_final,
                'concluido_em'=> $m->concluido_em?->format('d/m/Y'),
            ])->values(),
        ]);
    }

    public function exportar(Request $request, Curso $curso): StreamedResponse
    {
        $empresaId = $this->autorizar($request, $curso);
        $setorId   = $request->integer('setor_id') ?: null;
        $matriculas = $this->consultar($curso, $empresaId, $setorId);

        $nome = 'ead_' . preg_replace('/[^a-z0-9]+/i', '_', strtolower($curso->titulo)) . '.csv';

        return response()->streamDownload(function () use ($matriculas) {
            $out = fopen('php://output', 'w');
            fprintf($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Colaborador', 'Setor', 'Status', 'Execucao (%)', 'Nota final (%)', 'Concluido em'], ';');
            foreach ($matriculas as $m) {
                fputcsv($out, [
                    $m->colaborador?->nome,
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

    private function consultar(Curso $curso, int $empresaId, ?int $setorId)
    {
        return Matricula::where('curso_id', $curso->id)
            ->whereHas('colaborador', function ($c) use ($empresaId, $setorId) {
                $c->where('empresa_id', $empresaId);
                if ($setorId) {
                    $c->where('setor_id', $setorId);
                }
            })
            ->with(['colaborador.setor:id,nome'])
            ->get();
    }

    private function autorizar(Request $request, Curso $curso): int
    {
        $empresaId = (int) $request->user()->empresa_id;
        abort_unless($empresaId, 403);

        $temEad = EmpresaProduto::where('empresa_id', $empresaId)
            ->where('produto', 'ead')->where('status', 'ativo')->exists();
        abort_unless($temEad, 403, 'Módulo EAD não contratado.');

        $liberado = CursoEmpresa::where('curso_id', $curso->id)
            ->where('empresa_id', $empresaId)->where('ativo', true)->exists();
        abort_unless($liberado, 403, 'Curso não liberado para sua empresa.');

        return $empresaId;
    }
}
