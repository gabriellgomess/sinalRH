<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Relatorio;
use App\Models\Risco;
use App\Models\CheckIn;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class RelatorioIAService
{
    public function gerar(Relatorio $relatorio, Empresa $empresa): void
    {
        try {
            $contexto = $this->coletarContexto($empresa, $relatorio->periodo);
            $conteudo = $this->chamarOpenAI($contexto, $empresa);

            $relatorio->update([
                'status'            => 'pronto',
                'resumo_executivo'  => $conteudo['resumo_executivo'],
                'pontos_positivos'  => $conteudo['pontos_positivos'],
                'pontos_atencao'    => $conteudo['pontos_atencao'],
                'recomendacoes'     => $conteudo['recomendacoes'],
                'plano_acao'        => $conteudo['plano_acao'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Erro ao gerar relatório com IA', ['error' => $e->getMessage(), 'relatorio' => $relatorio->id]);
            $relatorio->update(['status' => 'erro']);
            throw $e;
        }
    }

    private function coletarContexto(Empresa $empresa, string $periodo): array
    {
        [$ano, $trimestre] = explode('-', $periodo);
        $trimNum = (int) ltrim($trimestre, 'Q');
        $inicioTrimestre = \Carbon\Carbon::create($ano)->startOfQuarter()->addMonths(($trimNum - 1) * 3);
        $fimTrimestre    = $inicioTrimestre->copy()->endOfQuarter();

        // Dados de check-in do período
        $checkins = CheckIn::where('empresa_id', $empresa->id)
            ->whereBetween('created_at', [$inicioTrimestre, $fimTrimestre])
            ->selectRaw('AVG(humor) as media, COUNT(*) as total, setor_id')
            ->groupBy('setor_id')
            ->with('setor:id,nome')
            ->get();

        // Riscos
        $riscos = Risco::where('empresa_id', $empresa->id)
            ->whereBetween('created_at', [$inicioTrimestre, $fimTrimestre])
            ->with('setor:id,nome')
            ->get();

        // Média geral
        $mediaGeral = round(($checkins->avg('media') / 5) * 100, 1);

        return [
            'empresa'         => $empresa->nome_fantasia,
            'periodo'         => $periodo,
            'colaboradores'   => $empresa->colaboradores()->where('status', 'ativo')->count(),
            'setores'         => $empresa->setores()->count(),
            'media_clima'     => $mediaGeral,
            'checkins_total'  => $checkins->sum('total'),
            'setores_criticos'=> $riscos->whereIn('nivel', ['critico'])->map(fn ($r) => [
                'nome'  => $r->setor->nome,
                'nivel' => $r->nivel,
                'score' => $r->score,
            ])->values()->toArray(),
            'setores_dados'   => $checkins->map(fn ($c) => [
                'setor' => $c->setor?->nome ?? 'N/D',
                'media' => round(($c->media / 5) * 100),
                'total_checkins' => $c->total,
            ])->toArray(),
        ];
    }

    private function chamarOpenAI(array $contexto, Empresa $empresa): array
    {
        $prompt = $this->montarPrompt($contexto);

        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'Você é a IA da Sara Linhar Consultoria, especialista em clima organizacional, saúde mental no trabalho e riscos psicossociais (ISO 45003 / NR-1). Gere relatórios executivos em português brasileiro, com linguagem humanizada, objetiva e orientada a ação. Responda sempre em JSON válido.',
                ],
                [
                    'role'    => 'user',
                    'content' => $prompt,
                ],
            ],
            'response_format' => ['type' => 'json_object'],
            'temperature'     => 0.4,
        ]);

        $raw = $response->choices[0]->message->content;
        return json_decode($raw, true);
    }

    private function montarPrompt(array $ctx): string
    {
        $setoresCriticos = implode(', ', array_column($ctx['setores_criticos'], 'nome'));

        return <<<PROMPT
        Gere um relatório executivo de clima organizacional para a empresa "{$ctx['empresa']}" referente ao período {$ctx['periodo']}.

        Dados coletados:
        - Total de colaboradores: {$ctx['colaboradores']}
        - Total de setores: {$ctx['setores']}
        - Índice geral de clima: {$ctx['media_clima']}/100
        - Total de check-ins: {$ctx['checkins_total']}
        - Setores em risco crítico: {$setoresCriticos}
        - Dados por setor: {$this->formatSetores($ctx['setores_dados'])}

        Retorne um JSON com exatamente esta estrutura:
        {
            "resumo_executivo": "string com 2-3 parágrafos descritivos e analíticos",
            "pontos_positivos": ["array com 3-5 pontos positivos observados"],
            "pontos_atencao": ["array com 3-5 pontos de atenção"],
            "recomendacoes": ["array com 4-6 recomendações práticas e específicas"],
            "plano_acao": [
                {"prazo": "DD/MM/YYYY", "acao": "descrição", "responsavel": "papel/cargo"},
                ...4 itens...
            ]
        }
        PROMPT;
    }

    private function formatSetores(array $setores): string
    {
        return collect($setores)
            ->map(fn ($s) => "{$s['setor']}: {$s['media']}/100 ({$s['total_checkins']} check-ins)")
            ->implode('; ');
    }
}
