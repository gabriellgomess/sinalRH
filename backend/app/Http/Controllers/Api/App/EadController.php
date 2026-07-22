<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\Controller;
use App\Models\Ead\Aula;
use App\Models\Ead\AulaAnexo;
use App\Models\Ead\Curso;
use App\Models\Ead\CursoEmpresa;
use App\Models\Ead\Matricula;
use App\Models\Ead\Teste;
use App\Models\Ead\TesteTentativa;
use App\Models\EmpresaProduto;
use App\Services\EadCorrecaoService;
use App\Services\EadProgressoService;
use App\Services\EadStreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EadController extends Controller
{
    /** Lista cursos liberados para o colaborador, com progresso. */
    public function index(Request $request): JsonResponse
    {
        $colaborador = $request->user();

        if (!$this->empresaTemEad($colaborador->empresa_id)) {
            return response()->json(['cursos' => []]);
        }

        $liberacoes = CursoEmpresa::where('empresa_id', $colaborador->empresa_id)
            ->where('ativo', true)
            ->where(function ($q) use ($colaborador) {
                $q->whereNull('setor_id')->orWhere('setor_id', $colaborador->setor_id);
            })
            ->get()
            ->keyBy('curso_id');

        $cursos = Curso::whereIn('id', $liberacoes->keys())
            ->where('status', 'publicado')
            ->withCount('modulos')
            ->get();

        $matriculas = Matricula::where('colaborador_id', $colaborador->id)
            ->whereIn('curso_id', $cursos->pluck('id'))
            ->get()->keyBy('curso_id');

        $data = $cursos->map(function ($c) use ($matriculas, $liberacoes) {
            $m = $matriculas->get($c->id);
            return [
                'id'            => $c->id,
                'titulo'        => $c->titulo,
                'descricao'     => $c->descricao,
                'obrigatorio'   => $c->obrigatorio,
                'total_aulas'   => $c->totalAulas(),
                'progresso_pct' => $m?->progresso_pct ?? 0,
                'status'        => $m?->status ?? 'nao_iniciado',
                'nota_final'    => $m?->nota_final,
                'prazo'         => $liberacoes->get($c->id)?->prazo?->format('d/m/Y'),
            ];
        });

        return response()->json(['cursos' => $data]);
    }

    /** Detalhe do curso; matricula automaticamente no primeiro acesso. */
    public function show(Request $request, Curso $curso, EadProgressoService $prog): JsonResponse
    {
        $colaborador = $request->user();
        $this->autorizarCurso($curso, $colaborador);

        $matricula = $prog->matricular($colaborador, $curso);

        $concluidas = $matricula->progresso()->whereNotNull('concluida_em')->pluck('aula_id')->all();

        $tentativas = TesteTentativa::where('colaborador_id', $colaborador->id)
            ->whereIn('teste_id', $curso->testes()->pluck('id'))
            ->get();

        $modulos = $curso->modulos()->with(['aulas' => fn ($q) => $q->orderBy('ordem')])->get()
            ->map(fn ($m) => [
                'id'     => $m->id,
                'titulo' => $m->titulo,
                'descricao' => $m->descricao,
                'aulas'  => $m->aulas->map(fn ($a) => [
                    'id'               => $a->id,
                    'titulo'           => $a->titulo,
                    'tipo'             => $a->tipo,
                    'video_youtube_id' => $a->video_youtube_id,
                    'tem_video'        => (bool) $a->video_storage,
                    'concluida'        => in_array($a->id, $concluidas, true),
                ]),
            ]);

        $testes = $curso->testes()->withCount('perguntas')->get()->map(fn ($t) => [
            'id'           => $t->id,
            'titulo'       => $t->titulo,
            'modulo_id'    => $t->modulo_id,
            'nota_minima'  => $t->nota_minima,
            'perguntas'    => $t->perguntas_count,
            'tentativas_max' => $t->tentativas_max,
            'obrigatorio_aprovacao' => $t->obrigatorio_aprovacao,
            'melhor_nota'  => $tentativas->where('teste_id', $t->id)->max('nota'),
            'aprovado'     => (bool) $tentativas->where('teste_id', $t->id)->where('aprovado', true)->count(),
            'tentativas_feitas' => $tentativas->where('teste_id', $t->id)->count(),
        ]);

        return response()->json([
            'curso' => [
                'id'          => $curso->id,
                'titulo'      => $curso->titulo,
                'descricao'   => $curso->descricao,
                'obrigatorio' => $curso->obrigatorio,
            ],
            'matricula' => [
                'status'        => $matricula->status,
                'progresso_pct' => $matricula->progresso_pct,
                'nota_final'    => $matricula->nota_final,
            ],
            'modulos' => $modulos,
            'testes'  => $testes,
        ]);
    }

    public function conteudoAula(Request $request, Aula $aula): JsonResponse
    {
        $colaborador = $request->user();
        $curso = $this->cursoDaAula($aula);
        $this->autorizarCurso($curso, $colaborador);

        return response()->json(['data' => [
            'id'               => $aula->id,
            'titulo'           => $aula->titulo,
            'tipo'             => $aula->tipo,
            'conteudo'         => $aula->conteudo,
            'video_youtube_id' => $aula->video_youtube_id,
            'tem_video'        => (bool) $aula->video_storage,
            'anexos'           => $aula->anexos->map(fn ($x) => [
                'id' => $x->id, 'nome_original' => $x->nome_original, 'categoria' => $x->categoria,
            ]),
        ]]);
    }

    public function streamVideo(Request $request, Aula $aula): StreamedResponse
    {
        $colaborador = $request->user();
        $curso = $this->cursoDaAula($aula);
        $this->autorizarCurso($curso, $colaborador);
        abort_unless($aula->video_storage, 404);

        return EadStreamService::stream($aula->video_storage, $request);
    }

    public function baixarAnexo(Request $request, Aula $aula, AulaAnexo $anexo)
    {
        $colaborador = $request->user();
        $curso = $this->cursoDaAula($aula);
        $this->autorizarCurso($curso, $colaborador);
        abort_if((int) $anexo->aula_id !== (int) $aula->id, 404);
        abort_unless(Storage::disk('local')->exists($anexo->caminho_storage), 404);

        return Storage::disk('local')->download($anexo->caminho_storage, $anexo->nome_original, ['Content-Type' => $anexo->mime]);
    }

    public function verAnexo(Request $request, Aula $aula, AulaAnexo $anexo): StreamedResponse
    {
        $colaborador = $request->user();
        $curso = $this->cursoDaAula($aula);
        $this->autorizarCurso($curso, $colaborador);
        abort_if((int) $anexo->aula_id !== (int) $aula->id, 404);

        return EadStreamService::stream($anexo->caminho_storage, $request, $anexo->mime, $anexo->nome_original);
    }

    public function concluirAula(Request $request, Aula $aula, EadProgressoService $prog): JsonResponse
    {
        $colaborador = $request->user();
        $curso = $this->cursoDaAula($aula);
        $this->autorizarCurso($curso, $colaborador);

        $matricula = $prog->matricular($colaborador, $curso);
        $prog->concluirAula($matricula, $aula, $request->integer('segundos') ?: null);

        return response()->json([
            'success' => true,
            'matricula' => [
                'status' => $matricula->status,
                'progresso_pct' => $matricula->progresso_pct,
                'nota_final' => $matricula->nota_final,
            ],
        ]);
    }

    /** Perguntas do teste — SEM gabarito. */
    public function teste(Request $request, Teste $teste): JsonResponse
    {
        $colaborador = $request->user();
        $curso = $teste->curso;
        $this->autorizarCurso($curso, $colaborador);

        $feitas = TesteTentativa::where('teste_id', $teste->id)->where('colaborador_id', $colaborador->id)->count();
        if ($teste->tentativas_max && $feitas >= $teste->tentativas_max) {
            abort(422, 'Você atingiu o número máximo de tentativas neste teste.');
        }

        $perguntas = $teste->perguntas()->get()->map(fn ($p) => [
            'id'        => $p->id,
            'enunciado' => $p->enunciado,
            'tipo'      => $p->tipo,
            'opcoes'    => $p->opcoes,
        ]);
        if ($teste->embaralhar) {
            $perguntas = $perguntas->shuffle()->values();
        }

        return response()->json([
            'teste' => [
                'id' => $teste->id, 'titulo' => $teste->titulo, 'descricao' => $teste->descricao,
                'nota_minima' => $teste->nota_minima, 'tentativas_max' => $teste->tentativas_max,
                'tentativas_feitas' => $feitas,
            ],
            'perguntas' => $perguntas,
        ]);
    }

    /** Corrige e PERSISTE a tentativa; recalcula progresso. */
    public function responderTeste(Request $request, Teste $teste, EadCorrecaoService $correcao, EadProgressoService $prog): JsonResponse
    {
        $colaborador = $request->user();
        $curso = $teste->curso;
        $this->autorizarCurso($curso, $colaborador);

        $feitas = TesteTentativa::where('teste_id', $teste->id)->where('colaborador_id', $colaborador->id)->count();
        if ($teste->tentativas_max && $feitas >= $teste->tentativas_max) {
            throw ValidationException::withMessages(['teste' => 'Número máximo de tentativas atingido.']);
        }

        $request->validate([
            'respostas'   => 'required|array',
            'respostas.*' => 'array',
        ]);

        $resultado = $correcao->corrigir($teste, $request->input('respostas', []));

        TesteTentativa::create([
            'teste_id'         => $teste->id,
            'colaborador_id'   => $colaborador->id,
            'numero_tentativa' => $feitas + 1,
            'respostas'        => $request->input('respostas'),
            'nota'             => $resultado['nota'],
            'aprovado'         => $resultado['aprovado'],
            'finalizada_em'    => now(),
        ]);

        // Recalcula matricula (conclusao pode depender da aprovacao).
        $matricula = $prog->matricular($colaborador, $curso);
        $prog->recalcular($matricula);

        return response()->json([
            'success'   => true,
            'nota'      => $resultado['nota'],
            'aprovado'  => $resultado['aprovado'],
            'acertos'   => $resultado['acertos'],
            'total'     => $resultado['total'],
            'nota_minima' => $resultado['nota_minima'],
            'matricula' => [
                'status' => $matricula->status,
                'progresso_pct' => $matricula->progresso_pct,
                'nota_final' => $matricula->nota_final,
            ],
        ]);
    }

    // ── Helpers de autorizacao ──────────────────────────────────────────
    private function empresaTemEad(?int $empresaId): bool
    {
        if (!$empresaId) return false;
        return EmpresaProduto::where('empresa_id', $empresaId)
            ->where('produto', 'ead')
            ->where('status', 'ativo')
            ->exists();
    }

    private function cursoDaAula(Aula $aula): Curso
    {
        $curso = $aula->curso;
        abort_if(!$curso, 404);
        return $curso;
    }

    private function autorizarCurso(Curso $curso, $colaborador): void
    {
        abort_if($curso->status !== 'publicado', 404, 'Curso não disponível.');
        abort_unless($this->empresaTemEad($colaborador->empresa_id), 403, 'Módulo EAD não contratado.');

        $liberacao = CursoEmpresa::where('curso_id', $curso->id)
            ->where('empresa_id', $colaborador->empresa_id)
            ->where('ativo', true)
            ->first();

        abort_if(!$liberacao, 403, 'Curso não liberado para sua empresa.');
        abort_if($liberacao->setor_id !== null && (int) $liberacao->setor_id !== (int) $colaborador->setor_id, 403, 'Curso não destinado ao seu setor.');
    }
}
