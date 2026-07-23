<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesquisa;
use App\Services\ClimaRiscoService;
use App\Models\Pergunta;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PesquisaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresa = $request->user()->empresa;

        $pesquisas = Pesquisa::where('empresa_id', $empresa->id)
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->tipo,   fn ($q) => $q->where('tipo', $request->tipo))
            ->when($request->setor,  fn ($q) => $q->where('setor_id', $request->setor))
            ->withCount('perguntas')
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        $pesquisas->getCollection()->transform(function ($p) use ($empresa) {
            $total = $empresa->total_colaboradores;
            $responderam = $p->respostas()->select('colaborador_id')->distinct()->count('colaborador_id');

            return array_merge($p->toArray(), [
                'total_respondentes' => $total,
                'responderam'        => $responderam,
                'taxa_resposta'      => $total > 0 ? round(($responderam / $total) * 100, 1) : 0,
            ]);
        });

        return response()->json($pesquisas);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo'       => 'required|string|max:255',
            'descricao'    => 'nullable|string',
            'tipo'         => 'required|in:clima,pulse,nps,risco,360,cultura',
            'setor_id'     => [
                'nullable',
                'integer',
                Rule::exists('setores', 'id')->where('empresa_id', $request->user()->empresa_id),
            ],
            'anonima'      => 'boolean',
            'prazo'        => 'nullable|date|after:today',
            'configuracoes'=> 'nullable|array',
            'perguntas'    => 'required|array|min:1',
            'perguntas.*.texto'      => 'required|string',
            'perguntas.*.tipo'       => 'required|in:likert,multipla_escolha,sim_nao,nps,texto_livre',
            'perguntas.*.dimensao'   => 'nullable|in:demanda,lideranca,clareza,autonomia,reconhecimento,comunicacao,conflitos,apoio_social',
            'perguntas.*.obrigatoria'=> 'boolean',
            'perguntas.*.opcoes'     => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $pesquisa = Pesquisa::create([
                ...$validated,
                'empresa_id' => $request->user()->empresa_id,
                'criado_por' => $request->user()->id,
                'status'     => 'rascunho',
            ]);

            foreach ($validated['perguntas'] as $i => $pData) {
                Pergunta::create([
                    ...$pData,
                    'pesquisa_id' => $pesquisa->id,
                    'ordem'       => $i + 1,
                ]);
            }

            DB::commit();
            AuditLogger::log(
                $request,
                'pesquisa.criar',
                $pesquisa,
                "Criou pesquisa {$pesquisa->titulo}.",
                null,
                $pesquisa->only(['id', 'titulo', 'tipo', 'status', 'setor_id'])
            );
            return response()->json($pesquisa->load('perguntas'), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Erro ao criar pesquisa.'], 500);
        }
    }

    public function show(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $this->garantirMesmaEmpresa($pesquisa);
        $this->authorize('view', $pesquisa);
        return response()->json($pesquisa->load('perguntas', 'setor', 'criador'));
    }

    public function update(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $this->garantirMesmaEmpresa($pesquisa);
        $this->authorize('update', $pesquisa);
        abort_if($pesquisa->status === 'ativa', 422, 'Pesquisas ativas não podem ser editadas.');

        $antes = $pesquisa->only(['titulo', 'descricao', 'prazo', 'anonima', 'status']);
        $validated = $request->validate([
            'titulo'    => 'sometimes|string|max:255',
            'descricao' => 'nullable|string',
            'prazo'     => 'nullable|date',
            'anonima'   => 'boolean',
        ]);

        $pesquisa->update($validated);

        AuditLogger::log(
            $request,
            'pesquisa.atualizar',
            $pesquisa,
            "Atualizou pesquisa {$pesquisa->titulo}.",
            $antes,
            $pesquisa->fresh()->only(['titulo', 'descricao', 'prazo', 'anonima', 'status'])
        );

        return response()->json($pesquisa->fresh('perguntas'));
    }

    public function destroy(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $this->garantirMesmaEmpresa($pesquisa);
        $this->authorize('delete', $pesquisa);
        abort_if($pesquisa->status === 'ativa', 422, 'Encerre a pesquisa antes de excluir.');
        $antes = $pesquisa->only(['id', 'titulo', 'tipo', 'status']);
        $pesquisa->delete();
        AuditLogger::log($request, 'pesquisa.excluir', $pesquisa, "Removeu pesquisa {$pesquisa->titulo}.", $antes);
        return response()->json(['message' => 'Pesquisa removida.']);
    }

    public function publicar(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $this->garantirMesmaEmpresa($pesquisa);
        $this->authorize('update', $pesquisa);
        abort_if($pesquisa->status !== 'rascunho', 422, 'Apenas rascunhos podem ser publicados.');
        abort_if($pesquisa->perguntas()->count() === 0, 422, 'A pesquisa precisa de ao menos uma pergunta.');

        $antes = $pesquisa->only(['status', 'publicado_em']);
        $pesquisa->update(['status' => 'ativa', 'publicado_em' => now()]);
        AuditLogger::log(
            $request,
            'pesquisa.publicar',
            $pesquisa,
            "Publicou pesquisa {$pesquisa->titulo}.",
            $antes,
            $pesquisa->fresh()->only(['status', 'publicado_em'])
        );
        return response()->json(['message' => 'Pesquisa publicada!', 'pesquisa' => $pesquisa]);
    }

    public function encerrar(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $this->garantirMesmaEmpresa($pesquisa);
        $this->authorize('update', $pesquisa);
        $antes = $pesquisa->only(['status', 'encerrado_em']);
        $pesquisa->update(['status' => 'encerrada', 'encerrado_em' => now()]);

        // Gera o mapa de risco de clima (por setor) a partir das respostas.
        try {
            ClimaRiscoService::gerarParaPesquisa($pesquisa->fresh());
        } catch (\Throwable $e) {
            report($e); // nao bloqueia o encerramento se a geracao falhar
        }

        AuditLogger::log(
            $request,
            'pesquisa.encerrar',
            $pesquisa,
            "Encerrou pesquisa {$pesquisa->titulo}.",
            $antes,
            $pesquisa->fresh()->only(['status', 'encerrado_em'])
        );
        return response()->json(['message' => 'Pesquisa encerrada.']);
    }

    public function duplicar(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $this->garantirMesmaEmpresa($pesquisa);
        $this->authorize('view', $pesquisa);

        $nova = $pesquisa->replicate(['status', 'publicado_em', 'encerrado_em']);
        $nova->titulo  = $pesquisa->titulo . ' (cópia)';
        $nova->status  = 'rascunho';
        $nova->prazo   = null;
        $nova->save();

        $pesquisa->perguntas->each(fn ($p) => $nova->perguntas()->create($p->only([
            'texto', 'tipo', 'dimensao', 'ordem', 'obrigatoria', 'opcoes'
        ])));

        AuditLogger::log(
            $request,
            'pesquisa.duplicar',
            $nova,
            "Duplicou pesquisa {$pesquisa->titulo}.",
            ['origem_id' => $pesquisa->id],
            $nova->only(['id', 'titulo', 'status'])
        );

        return response()->json($nova->load('perguntas'), 201);
    }

    public function resultados(Request $request, Pesquisa $pesquisa): JsonResponse
    {
        $this->garantirMesmaEmpresa($pesquisa);
        $this->authorize('view', $pesquisa);

        $resultados = $pesquisa->perguntas()->with('respostas')->get()->map(function ($pergunta) {
            $respostas = $pergunta->respostas;
            return [
                'pergunta_id' => $pergunta->id,
                'texto'       => $pergunta->texto,
                'dimensao'    => $pergunta->dimensao,
                'tipo'        => $pergunta->tipo,
                'total'       => $respostas->count(),
                'media'       => round($respostas->avg('valor_numerico') ?? 0, 2),
                'distribuicao'=> $respostas->groupBy('valor_numerico')
                    ->map(fn ($g, $k) => ['valor' => (int) $k, 'count' => $g->count()])
                    ->values(),
            ];
        });

        return response()->json([
            'pesquisa'   => $pesquisa->only(['id', 'titulo', 'tipo', 'status']),
            'resultados' => $resultados,
            'total_respondentes' => $pesquisa->respostas()
                ->select('colaborador_id')->distinct()->count('colaborador_id'),
        ]);
    }

    public function exportar(Request $request, Pesquisa $pesquisa): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->garantirMesmaEmpresa($pesquisa);
        $this->authorize('view', $pesquisa);

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"pesquisa-{$pesquisa->id}-resultados.csv\"",
        ];

        return response()->stream(function () use ($pesquisa) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8
            fputcsv($handle, ['Empregado', 'Pergunta', 'Dimensão', 'Resposta', 'Data']);

            foreach ($pesquisa->perguntas as $pergunta) {
                foreach ($pergunta->respostas as $resposta) {
                    fputcsv($handle, [
                        $pesquisa->anonima ? 'Anônimo' : $resposta->colaborador->nome,
                        $pergunta->texto,
                        $pergunta->dimensao,
                        $resposta->valor_numerico ?? $resposta->valor_texto,
                        $resposta->created_at->format('d/m/Y H:i'),
                    ]);
                }
            }
            fclose($handle);
        }, 200, $headers);
    }
}
