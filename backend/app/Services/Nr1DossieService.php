<?php

namespace App\Services;

use App\Models\Nr1Avaliacao;
use App\Models\Nr1DossieArquivo;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class Nr1DossieService
{
    public const PASTAS = [
        '00' => ['nome' => '00_CONTRATO_E_PROPOSTA',     'titulo' => 'Contrato e Proposta',         'descricao' => 'Contrato assinado, proposta tecnica.'],
        '01' => ['nome' => '01_GOVERNANCA_E_GRO',        'titulo' => 'Governanca e GRO',            'descricao' => 'Documento de governanca, estrutura do GRO, responsaveis definidos.'],
        '02' => ['nome' => '02_DIAGNOSTICO',             'titulo' => 'Diagnostico',                 'descricao' => 'Questionario aplicado, base de respostas, relatorio tecnico.'],
        '03' => ['nome' => '03_INVENTARIO_DE_RISCOS',    'titulo' => 'Inventario de Riscos',        'descricao' => 'Inventario psicossocial, atualizacoes.'],
        '04' => ['nome' => '04_PLANO_DE_ACAO',           'titulo' => 'Plano de Acao',               'descricao' => 'Plano anual, cronograma.'],
        '05' => ['nome' => '05_TREINAMENTOS_E_COMUNICACAO', 'titulo' => 'Treinamentos e Comunicacao', 'descricao' => 'Apresentacoes, lista de presenca, certificados.'],
        '06' => ['nome' => '06_ACOES_MENSAIS',           'titulo' => 'Acoes Mensais',               'descricao' => 'Material da acao, lista de presenca, fotos, relatorio do mes (organizado por mes).'],
        '07' => ['nome' => '07_INDICADORES',             'titulo' => 'Indicadores',                 'descricao' => 'Planilha de indicadores, historico mensal.'],
        '08' => ['nome' => '08_RELATORIOS',              'titulo' => 'Relatorios',                  'descricao' => 'Relatorios mensais, relatorio final.'],
        '09' => ['nome' => '09_AVALIACAO_E_EFICACIA',    'titulo' => 'Avaliacao e Eficacia',        'descricao' => 'Avaliacao comparativa, ajustes e recomendacoes.'],
        '10' => ['nome' => '10_DECLARACOES',             'titulo' => 'Declaracoes',                 'descricao' => 'Declaracao tecnica NR-1, documentos finais.'],
    ];

    public const PASTA_COM_SUBPASTAS = '06';

    public static function arvore(Nr1Avaliacao $avaliacao): array
    {
        $arquivos = Nr1DossieArquivo::where('avaliacao_id', $avaliacao->id)->get();

        $resultado = [];
        foreach (self::PASTAS as $codigo => $meta) {
            $doPasta = $arquivos->where('pasta_codigo', $codigo);
            $entry = [
                'codigo'    => (string) $codigo,
                'nome'      => $meta['nome'],
                'titulo'    => $meta['titulo'],
                'descricao' => $meta['descricao'],
                'total_arquivos' => $doPasta->count(),
                'tamanho_total'  => $doPasta->sum('tamanho_bytes'),
                'subpastas' => [],
            ];

            if ($codigo === self::PASTA_COM_SUBPASTAS) {
                $subpastas = $doPasta->groupBy('subpasta');
                foreach ($subpastas as $sub => $itens) {
                    if (!$sub) continue;
                    $entry['subpastas'][] = [
                        'nome'           => $sub,
                        'total_arquivos' => $itens->count(),
                        'tamanho_total'  => $itens->sum('tamanho_bytes'),
                    ];
                }
                usort($entry['subpastas'], fn($a, $b) => strnatcmp($a['nome'], $b['nome']));
            }

            $resultado[] = $entry;
        }
        return $resultado;
    }

    public static function gerarZip(Nr1Avaliacao $avaliacao): string
    {
        $tmpDir = storage_path('app/tmp');
        if (!is_dir($tmpDir)) mkdir($tmpDir, 0755, true);

        $zipPath = $tmpDir . "/dossie-{$avaliacao->codigo}-" . uniqid() . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
            throw new \RuntimeException('Nao foi possivel criar o arquivo ZIP.');
        }

        $raiz = "Dossie_PGR_NR1_{$avaliacao->codigo}_v" . ($avaliacao->versao ?? '1.0');
        $zip->addEmptyDir($raiz);

        // INDICE.txt na raiz
        $indice = "Dossie PGR NR-1\n";
        $indice .= "================\n\n";
        $indice .= "Empresa: " . $avaliacao->empresa->nome_fantasia . "\n";
        if ($avaliacao->empresa->cnpj) $indice .= "CNPJ: {$avaliacao->empresa->cnpj}\n";
        $indice .= "Avaliacao: {$avaliacao->titulo}\n";
        $indice .= "Versao: " . ($avaliacao->versao ?? '1.0') . "\n";
        $indice .= "Codigo: {$avaliacao->codigo}\n";
        if ($avaliacao->aplicada_em) $indice .= "Aplicada em: {$avaliacao->aplicada_em->format('d/m/Y')}\n";
        $indice .= "Gerado em: " . now()->format('d/m/Y H:i') . "\n\n";
        $indice .= "Estrutura (NR-1 / Portaria MTE 1.419/2024):\n";
        foreach (self::PASTAS as $meta) {
            $indice .= "  {$meta['nome']} -- {$meta['descricao']}\n";
        }
        $zip->addFromString("{$raiz}/INDICE.txt", $indice);

        $arquivos = Nr1DossieArquivo::where('avaliacao_id', $avaliacao->id)->get();
        foreach (self::PASTAS as $meta) {
            $zip->addEmptyDir("{$raiz}/{$meta['nome']}");
        }

        foreach ($arquivos as $arq) {
            $pasta = self::PASTAS[$arq->pasta_codigo]['nome'] ?? 'OUTROS';
            $destino = "{$raiz}/{$pasta}";
            if ($arq->subpasta) {
                $destino .= "/{$arq->subpasta}";
                $zip->addEmptyDir($destino);
            }
            if (Storage::disk('local')->exists($arq->caminho_storage)) {
                $zip->addFile(
                    Storage::disk('local')->path($arq->caminho_storage),
                    "{$destino}/{$arq->nome_original}"
                );
            }
        }

        $zip->close();
        return $zipPath;
    }
}
