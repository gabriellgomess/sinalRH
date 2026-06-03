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
        1 => 4,
        2 => 4,
        3 => 4,
        4 => 4,
        5 => 4,
        6 => 4,
        7 => 4,
        8 => 4,
        9 => 4,
        10 => 4,
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
        8 => [50, 30, 20], // Gestão de mudanças
        9 => [65, 20, 15], // Segurança e situações críticas
        10 => [55, 25, 20], // Integração e trabalho remoto
    ];

    public function run(): void
    {
        $empresaId = 1;

        // Se a empresa de id 1 não existir, cria-a
        $empresa = \App\Models\Empresa::find($empresaId);
        if (!$empresa) {
            $empresa = \App\Models\Empresa::create([
                'id' => $empresaId,
                'razao_social' => 'Empresa Exemplo S/A',
                'nome_fantasia' => 'Empresa Exemplo',
                'cnpj' => '12.345.678/0001-90',
                'segmento' => 'Tecnologia',
                'porte' => 'medio',
                'plano' => 'pleno',
                'status' => 'ativo',
            ]);

            // Vincula o primeiro usuário admin à empresa recém-criada
            $admin = \App\Models\User::first();
            if ($admin && is_null($admin->empresa_id)) {
                $admin->update(['empresa_id' => $empresaId]);
            }
        }

        // Garantir que a empresa possui os contratos de produtos ativos para os testes locais e visualização de menus
        $produtosDemo = [
            'mapa_riscos'     => ['tipo' => 'recorrente_mensal', 'valor_mensal' => 450.00],
            'pesquisas'       => ['tipo' => 'recorrente_mensal', 'valor_mensal' => 300.00],
            'checkins'        => ['tipo' => 'recorrente_mensal', 'valor_mensal' => 250.00],
            'diagnostico_nr1' => ['tipo' => 'pontual', 'valor_unitario' => 30.00, 'quantidade_aplicacoes' => 2],
            'canal_escuta'    => ['tipo' => 'recorrente_mensal', 'valor_mensal' => 600.00],
        ];

        foreach ($produtosDemo as $prodSlug => $prodAttrs) {
            \App\Models\EmpresaProduto::firstOrCreate(
                [
                    'empresa_id' => $empresaId,
                    'produto'    => $prodSlug,
                ],
                array_merge([
                    'data_inicio' => now()->subMonths(3)->toDateString(),
                    'status'      => 'ativo',
                ], $prodAttrs)
            );
        }

        // Se não houver setores, cria setores padrão
        $setorIds = Setor::where('empresa_id', $empresaId)->pluck('id')->toArray();
        if (empty($setorIds)) {
            $setoresPadrao = ['Administrativo', 'Operacional', 'Vendas/Comercial'];
            foreach ($setoresPadrao as $nomeSetor) {
                $setor = Setor::create([
                    'empresa_id' => $empresaId,
                    'nome' => $nomeSetor,
                    'unidade' => 'Matriz',
                    'descricao' => "Setor {$nomeSetor} da Empresa Exemplo",
                ]);
                $setorIds[] = $setor->id;
            }
            $this->command->info("Criados setores padrão para simulação.");
        }

        $totalRespondentes = 20; // 40% de 50 colaboradores

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
        $faixas       = ['menos_18', '19_34', '35_44', '45_mais'];
        // Pesos demográficos próximos de uma empresa real
        $sexoPesos    = [45, 50, 5];
        $faixaPesos   = [2, 45, 33, 20];

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
                    $categoria = $this->weightedRandom(['S', 'P', 'N'], [$pS, $pP, $pN]);
                    $valor = match ($categoria) {
                        'S' => (string) random_int(4, 5),
                        'P' => '3',
                        'N' => (string) random_int(1, 2),
                    };

                    $respostasLote[] = [
                        'respondente_id' => $respondente->id,
                        'avaliacao_id'   => $avaliacao->id,
                        'secao'          => $secao,
                        'item'           => $item,
                        'valor'          => $valor,
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
