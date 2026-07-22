<?php

namespace App\Http\Controllers\Api\Plataforma\Ead;

use App\Http\Controllers\Controller;
use App\Models\Ead\Aula;
use App\Models\Ead\AulaAnexo;
use App\Models\Ead\Curso;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CursoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cursos = Curso::query()
            ->withCount(['modulos', 'liberacoes as empresas_count' => fn ($q) => $q->where('ativo', true)])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($c) {
                $arr = $c->toArray();
                $arr['total_aulas'] = $c->totalAulas();
                return $arr;
            });

        return response()->json(['success' => true, 'data' => $cursos]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo'            => 'required|string|max:200',
            'descricao'         => 'nullable|string|max:5000',
            'obrigatorio'       => 'nullable|boolean',
            'carga_horaria_min' => 'nullable|integer|min:0|max:65000',
            'prazo_dias'        => 'nullable|integer|min:0|max:3650',
        ]);

        $curso = Curso::create(array_merge($validated, [
            'criado_por' => $request->user()->id,
            'status'     => 'rascunho',
        ]));

        AuditLogger::log($request, 'ead.curso.criar', $curso,
            "Criou curso EAD {$curso->titulo}.", null,
            $curso->only(['id', 'titulo', 'status']));

        return response()->json(['success' => true, 'data' => $curso], 201);
    }

    public function show(Curso $curso): JsonResponse
    {
        $curso->load(['modulos.aulas' => fn ($q) => $q->orderBy('ordem'), 'testes']);
        $curso->loadCount(['liberacoes as empresas_count' => fn ($q) => $q->where('ativo', true)]);

        return response()->json(['success' => true, 'data' => $curso]);
    }

    public function update(Request $request, Curso $curso): JsonResponse
    {
        $validated = $request->validate([
            'titulo'            => 'sometimes|string|max:200',
            'descricao'         => 'nullable|string|max:5000',
            'obrigatorio'       => 'nullable|boolean',
            'carga_horaria_min' => 'nullable|integer|min:0|max:65000',
            'prazo_dias'        => 'nullable|integer|min:0|max:3650',
        ]);

        $antes = $curso->only(['titulo', 'status']);
        $curso->update($validated);

        AuditLogger::log($request, 'ead.curso.atualizar', $curso,
            "Atualizou curso EAD {$curso->titulo}.", $antes,
            $curso->only(['titulo', 'status']));

        return response()->json(['success' => true, 'data' => $curso->fresh()]);
    }

    public function destroy(Request $request, Curso $curso): JsonResponse
    {
        $titulo = $curso->titulo;

        // Coleta os arquivos fisicos (videos e anexos) antes de remover as linhas.
        $idsModulos = $curso->modulos()->pluck('id');
        $aulas = Aula::whereIn('modulo_id', $idsModulos)->get(['id', 'video_storage']);
        $idsAulas = $aulas->pluck('id');

        $disk = Storage::disk('local');
        foreach ($aulas as $aula) {
            if ($aula->video_storage) {
                $disk->delete($aula->video_storage);
            }
            $disk->deleteDirectory("ead/videos/{$aula->id}");
            $disk->deleteDirectory("ead/anexos/{$aula->id}");
        }
        foreach (AulaAnexo::whereIn('aula_id', $idsAulas)->pluck('caminho_storage') as $caminho) {
            if ($caminho) {
                $disk->delete($caminho);
            }
        }
        if ($curso->capa_storage) {
            $disk->delete($curso->capa_storage);
        }

        AuditLogger::log($request, 'ead.curso.excluir', $curso,
            "Removeu em cascata o curso EAD {$titulo} (modulos, aulas, testes, midia, matriculas).");

        // forceDelete remove a linha de verdade e dispara o cascade das FKs
        // (modulos -> aulas -> anexos/progresso; testes -> perguntas/tentativas;
        //  curso_empresa; matriculas -> progresso).
        $curso->forceDelete();

        return response()->json(['success' => true, 'message' => 'Curso removido por completo.']);
    }

    public function publicar(Request $request, Curso $curso): JsonResponse
    {
        abort_if($curso->totalAulas() === 0, 422, 'Adicione ao menos uma aula antes de publicar.');

        $antes = $curso->only(['status']);
        $curso->update([
            'status'       => 'publicado',
            'publicado_em' => $curso->publicado_em ?? now(),
        ]);

        AuditLogger::log($request, 'ead.curso.publicar', $curso,
            "Publicou curso EAD {$curso->titulo}.", $antes, $curso->only(['status']));

        return response()->json(['success' => true, 'data' => $curso->fresh()]);
    }

    public function arquivar(Request $request, Curso $curso): JsonResponse
    {
        $antes = $curso->only(['status']);
        $curso->update(['status' => 'arquivado']);

        AuditLogger::log($request, 'ead.curso.arquivar', $curso,
            "Arquivou curso EAD {$curso->titulo}.", $antes, $curso->only(['status']));

        return response()->json(['success' => true, 'data' => $curso->fresh()]);
    }

    public function duplicar(Request $request, Curso $curso): JsonResponse
    {
        $novo = Curso::create([
            'criado_por'        => $request->user()->id,
            'titulo'            => $curso->titulo . ' (cópia)',
            'descricao'         => $curso->descricao,
            'obrigatorio'       => $curso->obrigatorio,
            'carga_horaria_min' => $curso->carga_horaria_min,
            'prazo_dias'        => $curso->prazo_dias,
            'status'            => 'rascunho',
        ]);

        // Copia modulos, aulas e testes/perguntas (sem arquivos de video/anexos).
        foreach ($curso->modulos()->with('aulas')->get() as $modulo) {
            $novoModulo = $novo->modulos()->create($modulo->only(['titulo', 'descricao', 'ordem']));
            foreach ($modulo->aulas as $aula) {
                $novoModulo->aulas()->create([
                    'titulo'           => $aula->titulo,
                    'ordem'            => $aula->ordem,
                    'tipo'             => $aula->tipo,
                    'conteudo'         => $aula->conteudo,
                    'video_youtube_id' => $aula->video_youtube_id,
                    'duracao_seg'      => $aula->duracao_seg,
                    // video_storage nao e copiado (arquivo fisico unico); refazer upload.
                ]);
            }
        }

        AuditLogger::log($request, 'ead.curso.duplicar', $novo,
            "Duplicou curso EAD {$curso->titulo}.");

        return response()->json(['success' => true, 'data' => $novo], 201);
    }
}
