<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Entrega arquivos (video) do disk local com suporte a HTTP Range,
 * permitindo seek no player sem carregar o arquivo inteiro em memoria.
 */
class EadStreamService
{
    public static function stream(string $caminhoRelativo, Request $request, ?string $mime = null, ?string $nomeInline = null): StreamedResponse
    {
        $disk = Storage::disk('local');
        abort_unless($disk->exists($caminhoRelativo), 404);

        $path = $disk->path($caminhoRelativo);
        $size = filesize($path);
        $mime = $mime ?: (mime_content_type($path) ?: 'application/octet-stream');

        $start  = 0;
        $end    = $size - 1;
        $status = 200;
        $headers = [
            'Content-Type'  => $mime,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'private, max-age=0, no-cache',
        ];

        // Exibicao inline no navegador (PDF/imagem) — sem forcar download.
        if ($nomeInline !== null) {
            $safe = str_replace('"', '', $nomeInline);
            $headers['Content-Disposition'] = 'inline; filename="' . $safe . '"';
            $headers['X-Content-Type-Options'] = 'nosniff';
        }

        $range = $request->header('Range');
        if ($range && preg_match('/bytes=(\d*)-(\d*)/', $range, $m)) {
            if ($m[1] !== '') {
                $start = (int) $m[1];
            }
            if ($m[2] !== '') {
                $end = (int) $m[2];
            }
            if ($start > $end || $start >= $size) {
                return new StreamedResponse(null, 416, [
                    'Content-Range' => "bytes */{$size}",
                ]);
            }
            $end = min($end, $size - 1);
            $status = 206;
            $headers['Content-Range'] = "bytes {$start}-{$end}/{$size}";
        }

        $length = $end - $start + 1;
        $headers['Content-Length'] = $length;

        return new StreamedResponse(function () use ($path, $start, $length) {
            $handle = fopen($path, 'rb');
            fseek($handle, $start);
            $bufferSize = 1024 * 256; // 256 KB
            $remaining = $length;
            while ($remaining > 0 && !feof($handle)) {
                $read = min($bufferSize, $remaining);
                echo fread($handle, $read);
                flush();
                $remaining -= $read;
            }
            fclose($handle);
        }, $status, $headers);
    }
}
