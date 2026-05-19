<?php

namespace Database\Seeders;

use App\Models\Nr1Avaliacao;
use App\Models\Nr1Respondente;
use App\Models\Nr1Resposta;
use App\Models\Setor;
use Illuminate\Database\Seeder;

class Nr1AvaliacaoSeeder extends Seeder
{
    // Itens por seção conforme checklistSections.js
    private const SECOES = [
        1 => 7,
        2 => 5,
        3 => 4,
        4 => 5,
        5 => 5,
        6 => 4,
        7 => 5,
    ];

    // Pesos S/P/N por seção — simula perfil realista de risco
    // [%S, %P, %N] — somam 100
    private const PESOS = [
        1 => [35, 25, 40], // Demandas do Trabalho — alto risco (muita pressão)
        2 => [50, 25, 25], // Autonomia e Controle — risco moderado
        3 => [65, 20, 15], // Clareza de Papel — baixo risco
        4 => [70, 20, 10], // Relacionamentos — baixo risco
        5 => [40, 25, 35], // Reconhecimento — alto risco (insatisfação salarial)
        6 => [55, 25, 20], // Segurança Psicológica — moderado
        7 => [60, 25, 15], // Condições Organizacionais — baixo risco
    ];

    public function run(): void
    {
        $empresaId = 1;
        $totalRespondentes = 20; // 40% de 50 colaboradores

        $setorIds = Setor::where('empresa_id', $empresaId)->pluck('id')->toArray();

        if (empty($setorIds)) {
            $this->command->error('Nenhum setor encontrado para empresa_id=' . $empresaId);
            return;
        }

        // Cria a avaliação
        $avaliacao = Nr1Avaliacao::create([
            'empresa_id'  => $empresaId,
            'criado_por'  => \App\Models\User::where('empresa_id', $empresaId)->value('id')
                             ?? \App\Models\User::first()->id,
            'titulo'      => 'PGR 2025 — 1º Semestre',
            'aplicada_em' => now()->subDays(15)->toDateString(),
            'status'      => 'encerrada',
            'observacoes' => 'Avaliação gerada via seeder para demonstração.',
        ]);

        $this->command->info("Avaliação criada: {$avaliacao->titulo} (código: {$avaliacao->codigo})");

        $sexos        = ['masculino', 'feminino', 'nao_informado'];
        $faixas       = ['18_24', '25_34', '35_44', '45_54', '55_mais'];
        // Pesos demográficos próximos de uma empresa real
        $sexoPesos    = [45, 50, 5];
        $faixaPesos   = [10, 35, 30, 20, 5];

        $respostasLote = [];

        for ($r = 0; $r < $totalRespondentes; $r++) {
            $respondente = Nr1Respondente::create([
                'avaliacao_id' => $avaliacao->id,
                'setor_id'     => $setorIds[array_rand($setorIds)],
                'sexo'         => $this->weightedRandom($sexos, $sexoPesos),
                'faixa_etaria' => $this->weightedRandom($faixas, $faixaPesos),
            ]);

            foreach (self::SECOES as $secao => $totalItens) {
                [$pS, $pP, $pN] = self::PESOS[$secao];

                for ($item = 1; $item <= $totalItens; $item++) {
                    $respostasLote[] = [
                        'respondente_id' => $respondente->id,
                        'avaliacao_id'   => $avaliacao->id,
                        'secao'          => $secao,
                        'item'           => $item,
                        'valor'          => $this->weightedRandom(['S', 'P', 'N'], [$pS, $pP, $pN]),
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ];
                }
            }
        }

        // Insere em lote (700 respostas de uma vez)
        foreach (array_chunk($respostasLote, 200) as $chunk) {
            Nr1Resposta::insert($chunk);
        }

        $total = count($respostasLote);
        $this->command->info("Inseridas {$total} respostas para {$totalRespondentes} respondentes.");
        $this->command->info("Acesse os resultados em: /admin/nr1/{$avaliacao->id}/resultados");
    }

    private function weightedRandom(array $valores, array $pesos): string
    {
        $total = array_sum($pesos);
        $rand  = random_int(1, $total);
        $acum  = 0;
        foreach ($valores as $i => $valor) {
            $acum += $pesos[$i];
            if ($rand <= $acum) {
                return $valor;
            }
        }
        return end($valores);
    }
}
