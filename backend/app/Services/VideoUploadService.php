<?php

namespace App\Services;

use App\Models\Ead\Aula;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Upload de video em pedacos (chunks) para nao estourar os limites de
 * upload do PHP/nginx na VPS. O front envia o arquivo fatiado; aqui cada
 * chunk e anexado a um arquivo temporario e, no ultimo, movido para o
 * destino definitivo apos validacao.
 */
class VideoUploadService
{
    private const LIMITE_BYTES = 524288000; // 500 MB
    private const EXTENSOES    = ['mp4', 'webm', 'mov', 'm4v'];
    private const MIMES        = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

    /**
     * Processa um chunk. Retorna:
     *   ['done' => false, 'progresso' => 0..100]           enquanto monta
     *   ['done' => true,  'caminho' => '...', 'tamanho'=>n] ao concluir
     */
    public function processarChunk(
        Aula $aula,
        UploadedFile $chunk,
        string $uploadId,
        int $indice,
        int $total,
        string $filename
    ): array {
        $uploadId = preg_replace('/[^A-Za-z0-9_-]/', '', $uploadId);
        if ($uploadId === '') {
            throw ValidationException::withMessages(['upload_id' => 'Identificador de upload inválido.']);
        }

        $disk    = Storage::disk('local');
        $tmpDir  = "ead/tmp";
        $tmpFile = "{$tmpDir}/{$uploadId}.part";
        $disk->makeDirectory($tmpDir);
        $tmpAbs = $disk->path($tmpFile);

        // Primeiro chunk: zera qualquer residuo anterior.
        if ($indice === 0 && $disk->exists($tmpFile)) {
            $disk->delete($tmpFile);
        }

        // Anexa o conteudo do chunk ao arquivo temporario.
        $in = fopen($chunk->getRealPath(), 'rb');
        $out = fopen($tmpAbs, 'ab');
        stream_copy_to_stream($in, $out);
        fclose($in);
        fclose($out);

        // Aborta se ultrapassar o limite durante a montagem.
        if (filesize($tmpAbs) > self::LIMITE_BYTES) {
            $disk->delete($tmpFile);
            throw ValidationException::withMessages(['chunk' => 'Vídeo excede o limite de 500 MB.']);
        }

        // Ainda faltam chunks.
        if ($indice + 1 < $total) {
            $progresso = (int) floor((($indice + 1) / max($total, 1)) * 100);
            return ['done' => false, 'progresso' => min($progresso, 99)];
        }

        // Ultimo chunk: valida e finaliza.
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if (!in_array($ext, self::EXTENSOES, true)) {
            $disk->delete($tmpFile);
            throw ValidationException::withMessages(['arquivo' => 'Formato não suportado. Use MP4 (recomendado), WebM ou MOV.']);
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $tmpAbs);
        finfo_close($finfo);
        if (!in_array($mime, self::MIMES, true)) {
            $disk->delete($tmpFile);
            throw ValidationException::withMessages(['arquivo' => "Conteúdo do arquivo não é um vídeo válido ({$mime})."]);
        }

        // Move para o destino definitivo.
        $destinoDir = "ead/videos/{$aula->id}";
        $disk->makeDirectory($destinoDir);
        $destino = "{$destinoDir}/" . uniqid('video_') . ".{$ext}";

        // Remove video anterior da aula, se houver.
        if ($aula->video_storage && $disk->exists($aula->video_storage)) {
            $disk->delete($aula->video_storage);
        }

        rename($tmpAbs, $disk->path($destino));

        return [
            'done'     => true,
            'caminho'  => $destino,
            'tamanho'  => $disk->size($destino),
            'mime'     => $mime,
        ];
    }
}
