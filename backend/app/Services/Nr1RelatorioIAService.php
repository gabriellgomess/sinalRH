<?php

namespace App\Services;

use App\Models\Nr1Avaliacao;
use App\Models\Setor;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class Nr1RelatorioIAService
{
    public function gerar(Nr1Avaliacao $avaliacao): void
    {
        try {
            $avaliacao->update(['relatorio_ia_status' => 'gerando']);

            $contexto = $this->coletarContexto($avaliacao);
            $dadosRelatorio = $this->chamarOpenAI($contexto);
            $dadosNormalizados = $this->normalizarJSON($dadosRelatorio);

            $avaliacao->update([
                'relatorio_ia_status' => 'pronto',
                'relatorio_ia_dados'  => $dadosNormalizados,
            ]);
        } catch (\Throwable $e) {
            Log::error('Erro ao gerar relatório de IA da NR-1', [
                'error'        => $e->getMessage(),
                'avaliacao_id' => $avaliacao->id,
            ]);
            $avaliacao->update(['relatorio_ia_status' => 'erro']);
            throw $e;
        }
    }

    private function coletarContexto(Nr1Avaliacao $avaliacao): array
    {
        $scoresGerais = Nr1ScoreService::calcular($avaliacao->id);
        $empresa = $avaliacao->empresa;

        // 1. Filtragem por Setor (Regra de Anonimato: mínimo 5 respondentes)
        $setoresContexto = [];
        $setores = Setor::where('empresa_id', $empresa->id)->get();

        foreach ($setores as $setor) {
            $scoresSetor = Nr1ScoreService::calcular($avaliacao->id, ['setor_id' => $setor->id]);
            if ($scoresSetor['total_respondentes'] >= 5) {
                $setoresContexto[] = [
                    'nome'        => $setor->nome,
                    'respondentes'=> $scoresSetor['total_respondentes'],
                    'media_geral' => $scoresSetor['media_geral'],
                    'distribuicao'=> $scoresSetor['global'], // S (positivo), P (neutro), N (negativo)
                    'por_secao'   => collect($scoresSetor['por_secao'])->map(fn($s) => [
                        'secao' => $s['secao'],
                        'label' => $s['label'],
                        'media' => $s['media_likert'],
                    ])->toArray()
                ];
            }
        }

        // 2. Filtragem por Gênero (Mínimo 5 respondentes)
        $generosContexto = [];
        $sexos = ['masculino', 'feminino', 'nao_informado'];
        foreach ($sexos as $sexo) {
            $scoresSexo = Nr1ScoreService::calcular($avaliacao->id, ['sexo' => $sexo]);
            if ($scoresSexo['total_respondentes'] >= 5) {
                $generosContexto[] = [
                    'genero'      => $sexo,
                    'respondentes'=> $scoresSexo['total_respondentes'],
                    'media_geral' => $scoresSexo['media_geral']
                ];
            }
        }

        // 3. Filtragem por Faixa Etária (Mínimo 5 respondentes)
        $faixasContexto = [];
        $faixas = ['menos_18', '19_34', '35_44', '45_mais'];
        foreach ($faixas as $faixa) {
            $scoresFaixa = Nr1ScoreService::calcular($avaliacao->id, ['faixa_etaria' => $faixa]);
            if ($scoresFaixa['total_respondentes'] >= 5) {
                $faixasContexto[] = [
                    'faixa'       => $faixa,
                    'respondentes'=> $scoresFaixa['total_respondentes'],
                    'media_geral' => $scoresFaixa['media_geral']
                ];
            }
        }

        return [
            'empresa'            => $empresa->nome_fantasia,
            'titulo'             => $avaliacao->titulo,
            'total_respondentes' => $scoresGerais['total_respondentes'],
            'total_respostas'    => $scoresGerais['total_respostas'],
            'media_geral'        => $scoresGerais['media_geral'],
            'distribuicao_geral' => $scoresGerais['global'], // S/P/N agrupados
            'por_secao'          => collect($scoresGerais['por_secao'])->map(fn($s) => [
                'secao'  => $s['secao'],
                'label'  => $s['label'],
                'media'  => $s['media_likert'],
                'total'  => $s['total'],
                'pct_pos'=> $s['total'] > 0 ? round(($s['S'] / $s['total']) * 100, 1) : 0,
                'pct_neu'=> $s['total'] > 0 ? round(($s['P'] / $s['total']) * 100, 1) : 0,
                'pct_neg'=> $s['total'] > 0 ? round(($s['N'] / $s['total']) * 100, 1) : 0,
            ])->toArray(),
            'itens_criticos'     => $scoresGerais['itens_criticos'],
            'segmentacao'        => [
                'setores'        => $setoresContexto,
                'generos'        => $generosContexto,
                'faixas_etarias' => $faixasContexto,
            ]
        ];
    }

    private function chamarOpenAI(array $contexto): array
    {
        // Lê as diretrizes originais do Agente diretamente do arquivo de texto para o System Prompt
        $caminhoPromptOriginal = base_path('prompt_agente_nr1_riscos_psicossociais.txt');
        $systemPrompt = file_exists($caminhoPromptOriginal)
            ? file_get_contents($caminhoPromptOriginal)
            : 'Você é um agente especializado em fatores de risco psicossociais da NR-1.';

        $userPrompt = $this->montarPromptUsuario($contexto);

        try {
            $response = OpenAI::chat()->create([
                'model'           => 'gpt-4o-mini',
                'messages'        => [
                    [
                        'role'    => 'system',
                        'content' => $systemPrompt,
                    ],
                    [
                        'role'    => 'user',
                        'content' => $userPrompt,
                    ],
                ],
                'response_format' => ['type' => 'json_object'],
                'temperature'     => 0.3,
            ]);

            $raw = $response->choices[0]->message->content;
            return json_decode($raw, true);
        } catch (\TypeError $e) {
            // Captura falha de tipagem interna da biblioteca do OpenAI (comum quando a API retorna erro não-JSON,
            // como um erro 401 text/plain causado por restrições de IP da API Key no painel da OpenAI).
            Log::error('Erro de tipo retornado pelo client do OpenAI', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \RuntimeException(
                "Erro de comunicação com a OpenAI (Formato de resposta inesperado). Isso geralmente indica que a chave de API (OPENAI_API_KEY) configurada no .env possui restrições de IP (IP Restrictions) no console da OpenAI que bloqueiam esta máquina/servidor, ou a chave é inválida/expirada.",
                0,
                $e
            );
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    private function montarPromptUsuario(array $ctx): string
    {
        $dadosGeraisJson = json_encode([
            'empresa'            => $ctx['empresa'],
            'titulo'             => $ctx['titulo'],
            'total_respondentes' => $ctx['total_respondentes'],
            'media_geral'        => $ctx['media_geral'],
            'distribuicao_geral' => [
                'positivas_pct' => $ctx['total_respostas'] > 0 ? round(($ctx['distribuicao_geral']['S'] / $ctx['total_respostas']) * 100, 1) : 0,
                'neutras_pct'   => $ctx['total_respostas'] > 0 ? round(($ctx['distribuicao_geral']['P'] / $ctx['total_respostas']) * 100, 1) : 0,
                'negativas_pct' => $ctx['total_respostas'] > 0 ? round(($ctx['distribuicao_geral']['N'] / $ctx['total_respostas']) * 100, 1) : 0,
            ],
            'estatisticas_por_dimensao' => $ctx['por_secao'],
            'perguntas_criticas_encontradas' => $ctx['itens_criticos'],
            'segmentacao_demografica' => $ctx['segmentacao']
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
Você deve realizar uma análise interpretativa coletiva dos resultados do questionário de fatores de risco psicossociais relacionados ao trabalho (NR-1) e retornar um objeto JSON estritamente formatado de acordo com o modelo abaixo.

DADOS CONSOLIDADOS DE ENTRADA:
{$dadosGeraisJson}

REGRAS DE CONTEÚDO E SEGMENTAÇÃO:
1. Para cada dimensão (seção de 1 a 10), utilize o respectivo nome correspondente:
   1: Demandas de Trabalho
   2: Controle e Autonomia
   3: Clareza de Papel e Expectativas
   4: Relacionamentos e Justiça Organizacional
   5: Reconhecimento e Recompensa
   6: Suporte e Segurança Psicológica
   7: Condições Organizacionais e Comunicação
   8: Gestão de Mudanças
   9: Segurança e Situações Críticas
   10: Integração e Trabalho Remoto
2. Na análise demográfica (Setor, Gênero, Faixa Etária), somente inclua comentários e comparações para os grupos que cumpriram a regra de amostragem mínima de 5 respondentes.
3. Se um setor ou grupo demográfico tiver amostragem insuficiente (menos de 5 respondentes), utilize rigorosamente a frase: "Amostra insuficiente para análise segmentada com preservação do anonimato. Recomenda-se agrupar os dados em uma categoria mais ampla."
4. As sugestões de Inventário de Riscos devem conter parágrafos estruturados simulando a descrição do perigo, fonte/circunstância, grupo exposto e classificação de risco para as dimensões mais críticas.
5. As sugestões de Plano de Ação devem ser medidas preventivas coletivas e organizacionais estruturadas com ação, objetivo, responsável, prazo e prioridade.

ESPECIFICAÇÃO ESTRUTURAL DO JSON DE SAÍDA:
Você deve retornar APENAS o objeto JSON puro com a seguinte estrutura de chaves (não use blocos de código markdown nem envolva em chaves alternativas como "relatorio"):

{
  "resumo_executivo": {
    "media_geral": 0.00, // Preencha com a média geral informada nos dados de entrada
    "classificacao_geral": "", // Ex: "Baixo risco aparente", "Atenção", "Risco moderado", "Risco alto"
    "principais_riscos": [
      // Lista de strings contendo os principais riscos gerais identificados
    ],
    "prioridade_geral": "", // Ex: "Baixa", "Média", "Alta"
    "observacao": "" // Breve parágrafo analítico consolidando o cenário geral
  },
  "dimensoes": [
    // Array com exatamente 10 objetos (um para cada dimensão, de 1 a 10):
    {
      "dimensao": "", // Ex: "Demandas de Trabalho"
      "fator_avaliado": "", // O fator avaliado nesta dimensão (ex: "carga, ritmo, pressão e carga mental" para dimensão 1)
      "media": 0.00, // Média aritmética da dimensão (use a média da seção nos dados de entrada)
      "classificacao": "", // Ex: "Baixo risco aparente", "Atenção", "Risco moderado", "Risco alto" baseado na média
      "percentual_respostas_negativas": 0.0, // Preencha com o valor de pct_neg dos dados de entrada
      "percentual_respostas_neutras": 0.0, // Preencha com o valor de pct_neu dos dados de entrada
      "percentual_respostas_positivas": 0.0, // Preencha com o valor de pct_pos dos dados de entrada
      "perguntas_criticas": [
        // Lista de perguntas críticas (itens) desta dimensão que apresentaram pontuação baixa (ex: "Item 1. Tenho tempo suficiente..." com 100% Neg.)
      ],
      "interpretacao": "", // Parágrafo interpretativo detalhado contendo a análise técnica do que este resultado indica para as condições de trabalho coletivas
      "possiveis_causas_organizacionais": [
        // Lista de strings contendo causas raiz (ex: subdimensionamento, centralização, falta de feedback)
      ],
      "medidas_recomendadas": [
        // Lista de strings contendo as medidas preventivas organizacionais/coletivas sugeridas
      ],
      "necessita_avaliacao_complementar": false, // true se classificação for "Risco moderado" ou "Risco alto", false caso contrário
      "encaminhamento_pgr": "" // Ex: "Registrar no inventário de riscos e propor plano de ação", "Monitoramento periódico"
    }
  ],
  "blocos_prioritarios": [
    // Lista de strings contendo os nomes das dimensões que exigem intervenção prioritária (ex: classificadas como risco moderado ou alto)
  ],
  "recomendacoes_gerais": [
    // Lista de diretrizes e recomendações gerais preventivas
  ],
  "sugestao_inventario_riscos": [
    // Lista de strings formatadas prontas para o Inventário de Riscos (uma string para cada risco relevante)
  ],
  "sugestao_plano_acao": [
    // Lista de strings formatadas prontas para o Plano de Ação PGR
  ],
  "limitacoes": [
    // Lista de strings especificando limitações técnicas do relatório de percepção coletiva
  ]
}
PROMPT;
    }

    private function normalizarJSON(array $dados): array
    {
        // 1. Unwrap "relatorio" key if present
        if (isset($dados['relatorio']) && is_array($dados['relatorio'])) {
            $dados = $dados['relatorio'];
        }

        // 2. Normalize "resumo_executivo"
        $resumo = $dados['resumo_executivo'] ?? [];
        $mediaGeral = $resumo['media_geral'] ?? $dados['media_geral'] ?? $dados['media'] ?? 0;
        $classificacaoGeral = $resumo['classificacao_geral'] ?? $resumo['classificacao'] ?? $dados['classificacao_geral'] ?? $dados['classificacao'] ?? '';
        $principaisRiscos = $resumo['principais_riscos'] ?? $dados['principais_riscos'] ?? [];
        $prioridadeGeral = $resumo['prioridade_geral'] ?? $resumo['prioridade'] ?? $dados['prioridade_geral'] ?? $dados['prioridade'] ?? '';
        $observacao = $resumo['observacao'] ?? $dados['observacao'] ?? '';

        $normalizedResumo = [
            'media_geral'         => floatval($mediaGeral),
            'classificacao_geral' => strval($classificacaoGeral),
            'principais_riscos'   => is_array($principaisRiscos) ? $principaisRiscos : [],
            'prioridade_geral'    => strval($prioridadeGeral),
            'observacao'          => strval($observacao),
        ];

        // 3. Normalize "dimensoes"
        $dimensoes = $dados['dimensoes'] ?? $dados['estatisticas_por_dimensao'] ?? [];
        if (!is_array($dimensoes)) {
            $dimensoes = [];
        }

        $normalizedDimensoes = [];
        foreach ($dimensoes as $index => $d) {
            if (!is_array($d)) continue;

            $dimensaoNome = $d['dimensao'] ?? $d['label'] ?? $d['nome'] ?? '';
            $fator = $d['fator_avaliado'] ?? $d['fator'] ?? '';
            $media = $d['media'] ?? 0;
            $classificacao = $d['classificacao'] ?? $d['nivel_criticidade'] ?? '';
            
            $pctPos = $d['percentual_respostas_positivas'] ?? $d['pct_pos'] ?? $d['positivas_pct'] ?? 0;
            $pctNeu = $d['percentual_respostas_neutras'] ?? $d['pct_neu'] ?? $d['neutras_pct'] ?? 0;
            $pctNeg = $d['percentual_respostas_negativas'] ?? $d['pct_neg'] ?? $d['negativas_pct'] ?? 0;

            $pergCriticas = $d['perguntas_criticas'] ?? $d['itens_criticos'] ?? [];
            if (!is_array($pergCriticas)) {
                $pergCriticas = [$pergCriticas];
            }

            // Convert array of objects (if questions were objects) into strings
            $pergCriticasStrings = [];
            foreach ($pergCriticas as $pc) {
                if (is_array($pc)) {
                    $itemNum = $pc['item'] ?? '';
                    $lbl = $pc['label'] ?? '';
                    $pctN = $pc['pct_n'] ?? '';
                    $pergCriticasStrings[] = "Item " . ($itemNum ? $itemNum . ". " : "") . $lbl . ($pctN ? " (" . $pctN . "% Neg.)" : "");
                } else {
                    $pergCriticasStrings[] = strval($pc);
                }
            }

            $interpretacao = $d['interpretacao'] ?? $d['analise'] ?? '';
            $causas = $d['possiveis_causas_organizacionais'] ?? $d['causas'] ?? [];
            $medidas = $d['medidas_recomendadas'] ?? $d['recomendacoes'] ?? $d['recomendacoes_medidas'] ?? [];
            $necessita = $d['necessita_avaliacao_complementar'] ?? $d['avaliacao_complementar'] ?? false;
            $encaminhamento = $d['encaminhamento_pgr'] ?? $d['encaminhamento'] ?? '';

            $normalizedDimensoes[] = [
                'dimensao'                         => strval($dimensaoNome),
                'fator_avaliado'                   => strval($fator),
                'media'                            => floatval($media),
                'classificacao'                    => strval($classificacao),
                'percentual_respostas_negativas'   => floatval($pctNeg),
                'percentual_respostas_neutras'     => floatval($pctNeu),
                'percentual_respostas_positivas'   => floatval($pctPos),
                'perguntas_criticas'               => $pergCriticasStrings,
                'interpretacao'                    => strval($interpretacao),
                'possiveis_causas_organizacionais' => is_array($causas) ? $causas : [],
                'medidas_recomendadas'             => is_array($medidas) ? $medidas : [],
                'necessita_avaliacao_complementar' => filter_var($necessita, FILTER_VALIDATE_BOOLEAN),
                'encaminhamento_pgr'               => strval($encaminhamento),
            ];
        }

        // 4. Fallback/enrich names based on index if names are empty or wrong count
        $secaoLabels = [
            1  => 'Demandas de Trabalho',
            2  => 'Controle e Autonomia',
            3  => 'Clareza de Papel e Expectativas',
            4  => 'Relacionamentos e Justiça Organizacional',
            5  => 'Reconhecimento e Recompensa',
            6  => 'Suporte e Segurança Psicológica',
            7  => 'Condições Organizacionais e Comunicação',
            8  => 'Gestão de Mudanças',
            9  => 'Segurança e Situações Críticas',
            10 => 'Integração e Trabalho Remoto',
        ];
        $secaoFatores = [
            1  => 'carga, ritmo, pressão e carga mental',
            2  => 'autonomia, pausas e gestão do trabalho',
            3  => 'definição de funções, responsabilidades, metas e expectativas',
            4  => 'clima, respeito, confiança, tratamento justo e equidade',
            5  => 'valorização, feedback, reconhecimento e percepção de equilíbrio entre esforço e recompensa',
            6  => 'apoio da liderança, liberdade de expressão, segurança para falar e preocupação da empresa com o bem-estar',
            7  => 'recursos, fluxo de informações, interrupções e condições para executar o trabalho',
            8  => 'comunicação, suporte, preparo e entendimento sobre mudanças organizacionais',
            9  => 'segurança no ambiente de trabalho, prevenção de violência, emergências e resposta a situações críticas',
            10 => 'vínculo, comunicação, suporte e acesso à informação em contextos remotos ou híbridos',
        ];

        // Ensure we always have exactly 10 dimensions in correct order
        if (count($normalizedDimensoes) !== 10) {
            $tempDimensoes = [];
            for ($i = 1; $i <= 10; $i++) {
                $found = null;
                foreach ($normalizedDimensoes as $nd) {
                    if (str_contains(strtolower($nd['dimensao']), strtolower($secaoLabels[$i])) || 
                        str_contains(strtolower($nd['fator_avaliado']), strtolower($secaoFatores[$i]))) {
                        $found = $nd;
                        break;
                    }
                }
                if ($found) {
                    $found['dimensao'] = $secaoLabels[$i];
                    if (empty($found['fator_avaliado'])) {
                        $found['fator_avaliado'] = $secaoFatores[$i];
                    }
                    $tempDimensoes[] = $found;
                } else {
                    if (isset($normalizedDimensoes[$i - 1])) {
                        $nd = $normalizedDimensoes[$i - 1];
                        $nd['dimensao'] = $secaoLabels[$i];
                        $nd['fator_avaliado'] = $secaoFatores[$i];
                        $tempDimensoes[] = $nd;
                    } else {
                        $tempDimensoes[] = [
                            'dimensao'                         => $secaoLabels[$i],
                            'fator_avaliado'                   => $secaoFatores[$i],
                            'media'                            => 0.0,
                            'classificacao'                    => 'Baixo risco aparente',
                            'percentual_respostas_negativas'   => 0.0,
                            'percentual_respostas_neutras'     => 0.0,
                            'percentual_respostas_positivas'   => 0.0,
                            'perguntas_criticas'               => [],
                            'interpretacao'                    => 'Dimensão dentro da conformidade esperada.',
                            'possiveis_causas_organizacionais' => [],
                            'medidas_recomendadas'             => [],
                            'necessita_avaliacao_complementar' => false,
                            'encaminhamento_pgr'               => 'Monitoramento periódico',
                        ];
                    }
                }
            }
            $normalizedDimensoes = $tempDimensoes;
        } else {
            foreach ($normalizedDimensoes as $idx => &$nd) {
                $nd['dimensao'] = $secaoLabels[$idx + 1];
                if (empty($nd['fator_avaliado'])) {
                    $nd['fator_avaliado'] = $secaoFatores[$idx + 1];
                }
            }
        }

        // 5. Root fields
        $blocosPrioritarios = $dados['blocos_prioritarios'] ?? [];
        $recomendacoesGerais = $dados['recomendacoes_gerais'] ?? [];
        $sugestaoInventario = $dados['sugestao_inventario_riscos'] ?? $dados['inventario_riscos'] ?? [];
        $sugestaoPlano = $dados['sugestao_plano_acao'] ?? $dados['plano_acao'] ?? [];
        $limitacoes = $dados['limitacoes'] ?? [];

        return [
            'resumo_executivo'           => $normalizedResumo,
            'dimensoes'                  => $normalizedDimensoes,
            'blocos_prioritarios'        => is_array($blocosPrioritarios) ? $blocosPrioritarios : [],
            'recomendacoes_gerais'       => is_array($recomendacoesGerais) ? $recomendacoesGerais : [],
            'sugestao_inventario_riscos' => is_array($sugestaoInventario) ? $sugestaoInventario : [],
            'sugestao_plano_acao'        => is_array($sugestaoPlano) ? $sugestaoPlano : [],
            'limitacoes'                 => is_array($limitacoes) ? $limitacoes : [],
        ];
    }
}
