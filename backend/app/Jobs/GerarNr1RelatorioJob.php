<?php

namespace App\Jobs;

use App\Models\Nr1Avaliacao;
use App\Services\Nr1RelatorioIAService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GerarNr1RelatorioJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $tries = 2;
    public int $timeout = 180; // Geração de IA pode demorar, damos 3 minutos de timeout

    public function __construct(
        public readonly Nr1Avaliacao $nr1
    ) {}

    public function handle(Nr1RelatorioIAService $service): void
    {
        $service->gerar($this->nr1);
    }

    public function failed(\Throwable $e): void
    {
        $this->nr1->update(['relatorio_ia_status' => 'erro']);
    }
}
