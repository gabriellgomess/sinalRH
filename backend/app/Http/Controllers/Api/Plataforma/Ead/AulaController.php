<?php

namespace App\Http\Controllers\Api\Plataforma\Ead;

use App\Http\Controllers\Controller;
use App\Models\Ead\Aula;
use App\Models\Ead\Curso;
use App\Models\Ead\Modulo;
use App\Models\Ead\AulaAnexo;
use App\Support\AuditLogger;
use App\Support\YoutubeHelper;
use App\Services\VideoUploadService;
use App\Services\EadStreamService;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AulaController extends Controller
{
    public function store(Request $request, Curso $curso, Modulo $modulo): JsonResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);

        $validated = $this->validar($request);
        $validated = $this->normalizarYoutube($validated);

        $aula = $modulo->aulas()->create(array_merge($validated, [
            'ordem' => $validated['ordem'] ?? ($modulo->aulas()->max('ordem') + 1),
        ]));

        AuditLogger::log($request, 'ead.aula.criar', $curso,
            "Adicionou aula '{$aula->titulo}' ao curso {$curso->titulo}.");

        return response()->json(['success' => true, 'data' => $aula], 201);
    }

    public function update(Request $request, Curso $curso, Modulo $modulo, Aula $aula): JsonResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);
        abort_if((int) $aula->modulo_id !== (int) $modulo->id, 404);

        $validated = $this->validar($request, false);
        $validated = $this->normalizarYoutube($validated);

        $aula->update($validated);

        return response()->json(['success' => true, 'data' => $aula->fresh()]);
    }

    public function destroy(Request $request, Curso $curso, Modulo $modulo, Aula $aula): JsonResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);
        abort_if((int) $aula->modulo_id !== (int) $modulo->id, 404);

        $titulo = $aula->titulo;
        // Remove arquivo de video, se houver.
        if ($aula->video_storage) {
            \Illuminate\Support\Facades\Storage::disk('local')->delete($aula->video_storage);
        }
        $aula->delete();

        AuditLogger::log($request, 'ead.aula.excluir', $curso,
            "Removeu aula '{$titulo}' do curso {$curso->titulo}.");

        return response()->json(['success' => true, 'message' => 'Aula removida.']);
    }

    public function reordenar(Request $request, Curso $curso, Modulo $modulo): JsonResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);

        $validated = $request->validate([
            'ordem'   => 'required|array',
            'ordem.*' => 'integer',
        ]);

        foreach ($validated['ordem'] as $indice => $aulaId) {
            $modulo->aulas()->where('id', $aulaId)->update(['ordem' => $indice]);
        }

        return response()->json(['success' => true]);
    }

    // ── Midia: video (upload em chunks) ─────────────────────────────────
    public function uploadVideo(Request $request, Curso $curso, Modulo $modulo, Aula $aula, VideoUploadService $service): JsonResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);
        abort_if((int) $aula->modulo_id !== (int) $modulo->id, 404);

        $validated = $request->validate([
            'chunk'    => 'required|file',
            'upload_id'=> 'required|string|max:80',
            'indice'   => 'required|integer|min:0',
            'total'    => 'required|integer|min:1',
            'filename' => 'required|string|max:255',
        ]);

        $resultado = $service->processarChunk(
            $aula,
            $validated['chunk'],
            $validated['upload_id'],
            (int) $validated['indice'],
            (int) $validated['total'],
            $validated['filename'],
        );

        if ($resultado['done']) {
            $aula->update([
                'tipo'          => 'video_upload',
                'video_storage' => $resultado['caminho'],
            ]);
            AuditLogger::log($request, 'ead.aula.video_upload', $curso,
                "Enviou video para a aula '{$aula->titulo}' do curso {$curso->titulo}.");
            return response()->json(['success' => true, 'done' => true, 'data' => $aula->fresh()]);
        }

        return response()->json(['success' => true, 'done' => false, 'progresso' => $resultado['progresso']]);
    }

    public function streamVideo(Request $request, Curso $curso, Modulo $modulo, Aula $aula): StreamedResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);
        abort_if((int) $aula->modulo_id !== (int) $modulo->id, 404);
        abort_unless($aula->video_storage, 404);

        return EadStreamService::stream($aula->video_storage, $request);
    }

    // ── Midia: anexos (imagens e documentos) ────────────────────────────
    public function listarAnexos(Request $request, Curso $curso, Modulo $modulo, Aula $aula): JsonResponse
    {
        abort_if((int) $aula->modulo_id !== (int) $modulo->id, 404);
        return response()->json(['success' => true, 'data' => $aula->anexos]);
    }

    public function uploadAnexo(Request $request, Curso $curso, Modulo $modulo, Aula $aula): JsonResponse
    {
        abort_if((int) $modulo->curso_id !== (int) $curso->id, 404);
        abort_if((int) $aula->modulo_id !== (int) $modulo->id, 404);

        $validated = $request->validate([
            'arquivo' => 'required|file|max:20480|mimes:pdf,png,jpg,jpeg,gif,webp,doc,docx,xls,xlsx,ppt,pptx',
        ]);

        $arquivo   = $request->file('arquivo');
        $ext       = strtolower($arquivo->getClientOriginalExtension());
        $categoria = in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'webp'], true) ? 'imagem' : 'documento';
        $caminho   = $arquivo->store("ead/anexos/{$aula->id}", 'local');

        $anexo = AulaAnexo::create([
            'aula_id'         => $aula->id,
            'nome_original'   => $arquivo->getClientOriginalName(),
            'caminho_storage' => $caminho,
            'mime'            => $arquivo->getMimeType() ?? 'application/octet-stream',
            'tamanho_bytes'   => $arquivo->getSize(),
            'categoria'       => $categoria,
            'enviado_por'     => $request->user()->id,
        ]);

        return response()->json(['success' => true, 'data' => $anexo], 201);
    }

    public function baixarAnexo(Request $request, Curso $curso, Modulo $modulo, Aula $aula, AulaAnexo $anexo)
    {
        abort_if((int) $aula->modulo_id !== (int) $modulo->id, 404);
        abort_if((int) $anexo->aula_id !== (int) $aula->id, 404);
        abort_unless(Storage::disk('local')->exists($anexo->caminho_storage), 404);

        return Storage::disk('local')->download($anexo->caminho_storage, $anexo->nome_original, ['Content-Type' => $anexo->mime]);
    }

    public function excluirAnexo(Request $request, Curso $curso, Modulo $modulo, Aula $aula, AulaAnexo $anexo): JsonResponse
    {
        abort_if((int) $aula->modulo_id !== (int) $modulo->id, 404);
        abort_if((int) $anexo->aula_id !== (int) $aula->id, 404);

        Storage::disk('local')->delete($anexo->caminho_storage);
        $anexo->delete();

        return response()->json(['success' => true, 'message' => 'Anexo removido.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private function validar(Request $request, bool $criando = true): array
    {
        $req = $criando ? 'required' : 'sometimes';

        return $request->validate([
            'titulo'           => "$req|string|max:200",
            'tipo'             => "$req|in:video_upload,video_youtube,texto,documento",
            'ordem'            => 'nullable|integer|min:0',
            'conteudo'         => 'nullable|string',
            'video_youtube_id' => 'nullable|string|max:200', // aceita URL completa; normalizada abaixo
            'duracao_seg'      => 'nullable|integer|min:0',
        ]);
    }

    private function normalizarYoutube(array $data): array
    {
        if (!empty($data['video_youtube_id'])) {
            $data['video_youtube_id'] = YoutubeHelper::extrairId($data['video_youtube_id']);
        }
        return $data;
    }
}
