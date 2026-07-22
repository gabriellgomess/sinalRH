<?php

namespace App\Support;

class YoutubeHelper
{
    /**
     * Extrai o ID (11 chars) de um video do YouTube a partir de uma URL
     * (watch, youtu.be, embed, shorts) ou retorna o proprio valor caso ja
     * seja um ID valido.
     */
    public static function extrairId(?string $entrada): ?string
    {
        $entrada = trim((string) $entrada);
        if ($entrada === '') {
            return null;
        }

        // Ja e um ID puro (11 caracteres validos).
        if (preg_match('/^[A-Za-z0-9_-]{11}$/', $entrada)) {
            return $entrada;
        }

        $padroes = [
            '/[?&]v=([A-Za-z0-9_-]{11})/',        // youtube.com/watch?v=ID
            '#youtu\.be/([A-Za-z0-9_-]{11})#',    // youtu.be/ID
            '#/embed/([A-Za-z0-9_-]{11})#',       // /embed/ID
            '#/shorts/([A-Za-z0-9_-]{11})#',      // /shorts/ID
        ];

        foreach ($padroes as $padrao) {
            if (preg_match($padrao, $entrada, $m)) {
                return $m[1];
            }
        }

        return null;
    }
}
