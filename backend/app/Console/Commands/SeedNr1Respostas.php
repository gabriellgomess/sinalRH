<?php

namespace App\Console\Commands;

use App\Models\Nr1Avaliacao;
use App\Models\Nr1Respondente;
use App\Models\Nr1Resposta;
use App\Models\Setor;
use Illuminate\Console\Command;

class SeedNr1Respostas extends Command
{
    protected $signature = 'nr1:seed-respostas
                            {codigo : Codigo publico da avaliacao (ex: BJF2CLEWSX)}
                            {--respondentes=15 : Quantidade de respondentes a simular}
                            {--perfil=variado : Perfil de respostas (otimo, variado, atencao, critico)}';

    protected $description = 'Simula respondentes e respostas anonimas para uma avaliacao NR-1';

    // S=1, P=0.5, N=0. Probabilidades [pS, pP, pN] por secao.
    private const PERFIS = [
        'otimo' => [
            1 => [0.75, 0.20, 0.05], 2 => [0.80, 0.15, 0.05], 3 => [0.85, 0.10, 0.05],
            4 => [0.85, 0.12, 0.03], 5 => [0.78, 0.17, 0.05], 6 => [0.80, 0.15, 0.05],
            7 => [0.82, 0.13, 0.05], 8 => [0.80, 0.15, 0.05], 9 => [0.85, 0.10, 0.05],
            10 => [0.80, 0.15, 0.05],
        ],
        'variado' => [
            1 => [0.40, 0.35, 0.25], // Demandas — sobrecarga comum
            2 => [0.50, 0.30, 0.20], // Autonomia
            3 => [0.60, 0.25, 0.15], // Clareza
            4 => [0.65, 0.25, 0.10], // Relacionamentos
            5 => [0.45, 0.30, 0.25], // Reconhecimento — fragil
            6 => [0.55, 0.30, 0.15], // Seguranca psicologica
            7 => [0.60, 0.30, 0.10], // Condicoes
            8 => [0.50, 0.35, 0.15], // Gestão de mudanças
            9 => [0.70, 0.20, 0.10], // Segurança e situações críticas
            10 => [0.55, 0.30, 0.15], // Trabalho remoto
        ],
        'atencao' => [
            1 => [0.30, 0.30, 0.40], 2 => [0.35, 0.30, 0.35], 3 => [0.45, 0.30, 0.25],
            4 => [0.50, 0.25, 0.25], 5 => [0.30, 0.30, 0.40], 6 => [0.40, 0.30, 0.30],
            7 => [0.45, 0.30, 0.25], 8 => [0.35, 0.35, 0.30], 9 => [0.40, 0.30, 0.30],
            10 => [0.35, 0.35, 0.30],
        ],
        'critico' => [
            1 => [0.20, 0.25, 0.55], 2 => [0.25, 0.25, 0.50], 3 => [0.30, 0.30, 0.40],
            4 => [0.35, 0.25, 0.40], 5 => [0.20, 0.25, 0.55], 6 => [0.25, 0.30, 0.45],
            7 => [0.30, 0.30, 0.40], 8 => [0.25, 0.30, 0.45], 9 => [0.20, 0.30, 0.50],
            10 => [0.25, 0.30, 0.45],
        ],
    ];

    private const ITENS_POR_SECAO = [
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

    private const SEXOS = ['masculino', 'feminino', 'nao_informado'];
    private const FAIXAS = ['menos_18', '19_34', '35_44', '45_mais'];

    public function handle(): int
    {
        $codigo = strtoupper($this->argument('codigo'));
        $qtd    = (int) $this->option('respondentes');
        $perfil = $this->option('perfil');

        if (!isset(self::PERFIS[$perfil])) {
            $this->error("Perfil invalido. Use: " . implode(', ', array_keys(self::PERFIS)));
            return self::FAILURE;
        }

        $avaliacao = Nr1Avaliacao::where('codigo', $codigo)->first();
        if (!$avaliacao) {
            $this->error("Avaliacao com codigo {$codigo} nao encontrada.");
            return self::FAILURE;
        }

        $setores = Setor::where('empresa_id', $avaliacao->empresa_id)->get();
        if ($setores->isEmpty()) {
            $this->error('Empresa nao tem setores cadastrados.');
            return self::FAILURE;
        }

        $this->info("Avaliacao: {$avaliacao->titulo} (v{$avaliacao->versao})");
        $this->info("Setores disponiveis: {$setores->count()} | Perfil: {$perfil} | Respondentes: {$qtd}");

        $matriz = self::PERFIS[$perfil];
        $bar = $this->output->createProgressBar($qtd);
        $bar->start();

        foreach (range(1, $qtd) as $i) {
            $respondente = Nr1Respondente::create([
                'avaliacao_id' => $avaliacao->id,
                'setor_id'     => $setores->random()->id,
                'sexo'         => self::SEXOS[array_rand(self::SEXOS)],
                'faixa_etaria' => self::FAIXAS[array_rand(self::FAIXAS)],
            ]);

            $respostas = [];
            foreach (self::ITENS_POR_SECAO as $secao => $totalItens) {
                [$pS, $pP] = $matriz[$secao];
                for ($item = 1; $item <= $totalItens; $item++) {
                    $r = mt_rand() / mt_getrandmax();
                    $valor = $r < $pS ? 'S' : ($r < $pS + $pP ? 'P' : 'N');
                    $respostas[] = [
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
            Nr1Resposta::insert($respostas);
            $bar->advance();
        }
        $bar->finish();
        $this->newLine(2);

        $totalRespondentes = $avaliacao->respondentes()->count();
        $totalRespostas    = $avaliacao->respostas()->count();
        $this->info("OK: avaliacao agora tem {$totalRespondentes} respondentes e {$totalRespostas} respostas.");

        return self::SUCCESS;
    }
}
