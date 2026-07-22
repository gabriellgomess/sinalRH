<?php

namespace App\Services;

use App\Models\Ead\Teste;

/**
 * Correcao automatica de testes de aptidao. Toda a logica de gabarito fica
 * no backend — a resposta correta nunca e enviada ao aluno. Usado tanto pelo
 * fluxo do colaborador (/responder, que persiste tentativa) quanto pelo modo
 * visualizacao do admin (/simular, que NAO persiste nada).
 *
 * $respostas: array no formato [ pergunta_id => [indices marcados] ]
 */
class EadCorrecaoService
{
    public function corrigir(Teste $teste, array $respostas): array
    {
        $perguntas = $teste->perguntas()->get();
        $pesoTotal = 0;
        $pesoAcertado = 0;
        $detalhes = [];

        foreach ($perguntas as $p) {
            $peso = max(1, (int) $p->peso);
            $pesoTotal += $peso;

            $marcadas = $respostas[$p->id] ?? [];
            $marcadas = array_map('intval', is_array($marcadas) ? $marcadas : [$marcadas]);
            sort($marcadas);

            $corretas = array_map('intval', $p->resposta_correta ?? []);
            sort($corretas);

            $acertou = $marcadas === $corretas;
            if ($acertou) {
                $pesoAcertado += $peso;
            }

            $detalhes[] = [
                'pergunta_id' => $p->id,
                'acertou'     => $acertou,
            ];
        }

        $nota = $pesoTotal > 0 ? (int) round(($pesoAcertado / $pesoTotal) * 100) : 0;
        $aprovado = $nota >= (int) $teste->nota_minima;

        return [
            'nota'       => $nota,
            'aprovado'   => $aprovado,
            'acertos'    => count(array_filter($detalhes, fn ($d) => $d['acertou'])),
            'total'      => $perguntas->count(),
            'nota_minima'=> (int) $teste->nota_minima,
            'detalhes'   => $detalhes,
        ];
    }
}
