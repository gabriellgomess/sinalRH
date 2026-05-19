<?php

namespace App\Jobs;

use App\Models\Empresa;
use App\Models\Relatorio;
use App\Services\RelatorioIAService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GerarRelatorioJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function __construct(
        public readonly Relatorio $relatorio,
        public readonly Empresa $empresa,
    ) {}

    public function handle(RelatorioIAService $service): void
    {
        $service->gerar($this->relatorio, $this->empresa);
    }

    public function failed(\Throwable $e): void
    {
        $this->relatorio->update(['status' => 'erro']);
    }
}
