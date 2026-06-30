<?php

namespace App\Console\Commands;

use App\Mail\ColaboradorConviteMail;
use App\Models\Colaborador;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RemediarSenhasColaboradores extends Command
{
    protected $signature = 'colaboradores:remediar-senhas
                            {--dry-run : Apenas lista os afetados, sem alterar nada}
                            {--sem-email : Redefine a senha e gera o convite, mas nao envia e-mail}
                            {--empresa= : Limita a uma empresa (id)}';

    protected $description = 'Invalida senhas de import (CPF/padrao) e envia convite para o colaborador definir a propria senha';

    public function handle(): int
    {
        $base = Colaborador::query()
            ->where('status', 'ativo')
            ->whereNull('convite_aceito_em')
            ->when($this->option('empresa'), fn ($q, $id) => $q->where('empresa_id', $id));

        $total    = (clone $base)->count();
        $semEmail = (clone $base)->where(fn ($q) => $q->whereNull('email')->orWhere('email', ''))->count();
        $comEmail = $total - $semEmail;

        $this->info("Ativos sem convite aceito: {$total}");
        $this->line("  - com e-mail (serao remediados): {$comEmail}");
        $this->line("  - sem e-mail (ignorados):        {$semEmail}");

        if ($this->option('dry-run')) {
            $this->warn('Dry-run: nada foi alterado.');
            return self::SUCCESS;
        }

        if ($comEmail === 0) {
            $this->info('Nada a fazer.');
            return self::SUCCESS;
        }

        if (! $this->confirm("Redefinir senha e enviar convite para {$comEmail} colaborador(es)?", true)) {
            $this->warn('Cancelado.');
            return self::SUCCESS;
        }

        $baseUrl     = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $enviarEmail = ! $this->option('sem-email');
        $ok = 0;

        (clone $base)
            ->whereNotNull('email')->where('email', '!=', '')
            ->chunkById(100, function ($colaboradores) use ($baseUrl, $enviarEmail, &$ok) {
                foreach ($colaboradores as $colaborador) {
                    $token = Str::random(64);

                    $colaborador->forceFill([
                        'password'          => Str::password(40),
                        'convite_token'     => $token,
                        'convite_expira_em' => now()->addDays(7),
                        'convite_aceito_em' => null,
                    ])->save();

                    if ($enviarEmail) {
                        Mail::to($colaborador->email)->queue(
                            new ColaboradorConviteMail($colaborador->fresh(['empresa']), "{$baseUrl}/convite/{$token}")
                        );
                    }

                    $ok++;
                }
            });

        $this->info("Concluido: {$ok} colaborador(es) remediado(s)" . ($enviarEmail ? ' e convidado(s) por e-mail.' : ' (sem e-mail).'));
        return self::SUCCESS;
    }
}
