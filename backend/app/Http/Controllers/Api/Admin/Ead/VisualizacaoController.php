<?php

namespace App\Http\Controllers\Api\Admin\Ead;

use App\Http\Controllers\Controller;
use App\Models\Ead\Aula;
use App\Models\Ead\AulaAnexo;
use App\Models\Ead\Curso;
use App\Models\Ead\CursoEmpresa;
use App\Models\Ead\Teste;
use App\Models\EmpresaProduto;
use App\Services\EadCorrecaoService;
use App\Services\EadStreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Modo VISUALIZACAO do admin da empresa: ve o curso completo e pode fazer os
 * testes (corrigidos na hora via /simular), mas NADA e persistido — nenhuma
 * matricula, progresso ou tentativa e criada. Impossivel afetar os indices.
 */
class VisualizacaoController extends Controller
{
    /** Cursos liberados para a empresa do admin (visualizacao). */
    public function index(Request $request): JsonResponse
    {
        $empresaId = $request->user()->empresa_id;
        if (!$this->empresaTemEad($empresaId)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $cursoIds = CursoEmpresa::where('empresa_id', $empresaId)
            ->where('ativo', true)
            ->pluck('curso_id');

        $cursos = Curso::whereIn('id', $cursoIds)
            ->where('status', 'publicado')
            ->withCount('modulos')
            ->get()
            ->map(fn ($c) => [
                'id'          => $c->id,
                'titulo'      => $c->titulo,
                'descricao'   => $c->descricao,
                'obrigatorio' => $c->obrigatorio,
                'total_aulas' => $c->totalAulas(),
            ]);

        return response()->json(['success' => true, 'data' => $cursos]);
    }

    public function show(Request $request, Curso $curso): JsonResponse
    {
        $this->autorizar($request, $curso);

        $modulos = $curso->modulos()->with(['aulas' => fn ($q) => $q->orderBy('ordem')])->get()
            ->map(fn ($m) => [
                'id' => $m->id, 'titulo' => $m->titulo, 'descricao' => $m->descricao,
                'aulas' => $m->aulas->map(fn ($a) => [
                    'id' => $a->id, 'titulo' => $a->titulo, 'tipo' => $a->tipo,
                    'video_youtube_id' => $a->video_youtube_id, 'tem_video' => (bool) $a->video_storage,
                    'concluida' => false, // sempre falso: modo visualizacao
                ]),
            ]);

        $testes = $curso->testes()->withCount('perguntas')->get()->map(fn ($t) => [
            'id' => $t->id, 'titulo' => $t->titulo, 'modulo_id' => $t->modulo_id,
            'nota_minima' => $t->nota_minima, 'perguntas' => $t->perguntas_count,
            'obrigatorio_aprovacao' => $t->obrigatorio_aprovacao,
            'melhor_nota' => null, 'aprovado' => false, 'tentativas_feitas' => 0,
        ]);

        return response()->json([
            'success' => true,
            'curso' => [
                'id' => $curso->id, 'titulo' => $curso->titulo,
                'descricao' => $curso->descricao, 'obrigatorio' => $curso->obrigatorio,
            ],
            'modulos' => $modulos,
            'testes'  => $testes,
            'modo_visualizacao' => true,
        ]);
    }

    public function conteudoAula(Request $request, Aula $aula): JsonResponse
    {
        $curso = $this->cursoDaAula($aula);
        $this->autorizar($request, $curso);

        return response()->json(['data' => [
            'id' => $aula->id, 'titulo' => $aula->titulo, 'tipo' => $aula->tipo,
            'conteudo' => $aula->conteudo, 'video_youtube_id' => $aula->video_youtube_id,
            'tem_video' => (bool) $aula->video_storage,
            'anexos' => $aula->anexos->map(fn ($x) => ['id' => $x->id, 'nome_original' => $x->nome_original, 'categoria' => $x->categoria]),
        ]]);
    }

    public function streamVideo(Request $request, Aula $aula): StreamedResponse
    {
        $curso = $this->cursoDaAula($aula);
        $this->autorizar($request, $curso);
        abort_unless($aula->video_storage, 404);
        return EadStreamService::stream($aula->video_storage, $request);
    }

    public function baixarAnexo(Request $request, Aula $aula, AulaAnexo $anexo)
    {
        $curso = $this->cursoDaAula($aula);
        $this->autorizar($request, $curso);
        abort_if((int) $anexo->aula_id !== (int) $aula->id, 404);
        abort_unless(Storage::disk('local')->exists($anexo->caminho_storage), 404);
        return Storage::disk('local')->download($anexo->caminho_storage, $anexo->nome_original, ['Content-Type' => $anexo->mime]);
    }

    public function verAnexo(Request $request, Aula $aula, AulaAnexo $anexo): StreamedResponse
    {
        $curso = $this->cursoDaAula($aula);
        $this->autorizar($request, $curso);
        abort_if((int) $anexo->aula_id !== (int) $aula->id, 404);
        return EadStreamService::stream($anexo->caminho_storage, $request, $anexo->mime, $anexo->nome_original);
    }

    /** Perguntas do teste — SEM gabarito. */
    public function teste(Request $request, Teste $teste): JsonResponse
    {
        $curso = $teste->curso;
        $this->autorizar($request, $curso);

        $perguntas = $teste->perguntas()->get()->map(fn ($p) => [
            'id' => $p->id, 'enunciado' => $p->enunciado, 'tipo' => $p->tipo, 'opcoes' => $p->opcoes,
        ]);

        return response()->json([
            'teste' => ['id' => $teste->id, 'titulo' => $teste->titulo, 'descricao' => $teste->descricao, 'nota_minima' => $teste->nota_minima],
            'perguntas' => $perguntas,
            'modo_visualizacao' => true,
        ]);
    }

    /** Corrige e retorna resultado SEM persistir nada. */
    public function simular(Request $request, Teste $teste, EadCorrecaoService $correcao): JsonResponse
    {
        $curso = $teste->curso;
        $this->autorizar($request, $curso);

        $request->validate(['respostas' => 'required|array', 'respostas.*' => 'array']);
        $resultado = $correcao->corrigir($teste, $request->input('respostas', []));

        return response()->json([
            'success' => true,
            'nota' => $resultado['nota'],
            'aprovado' => $resultado['aprovado'],
            'acertos' => $resultado['acertos'],
            'total' => $resultado['total'],
            'nota_minima' => $resultado['nota_minima'],
            'simulado' => true, // nada foi gravado
        ]);
    }

    // ── Helpers ─────────────────────────────────────────────────────────
    private function empresaTemEad(?int $empresaId): bool
    {
        if (!$empresaId) return false;
        return EmpresaProduto::where('empresa_id', $empresaId)
            ->where('produto', 'ead')->where('status', 'ativo')->exists();
    }

    private function cursoDaAula(Aula $aula): Curso
    {
        abort_if(!$aula->curso, 404);
        return $aula->curso;
    }

    private function autorizar(Request $request, Curso $curso): void
    {
        $empresaId = $request->user()->empresa_id;
        abort_if($curso->status !== 'publicado', 404);
        abort_unless($this->empresaTemEad($empresaId), 403, 'Módulo EAD não contratado.');
        $ok = CursoEmpresa::where('curso_id', $curso->id)
            ->where('empresa_id', $empresaId)->where('ativo', true)->exists();
        abort_unless($ok, 403, 'Curso não liberado para sua empresa.');
    }
}
