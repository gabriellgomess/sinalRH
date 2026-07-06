<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso ao grupo responsavel (RH/Diretoria/Presidencia) de que ha um novo
 * relato. NAO contem conteudo nem identidade — so um chamado para acessar o painel.
 */
class EscutaNovoRelatoMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $empresaNome,
        public readonly string $grupoLabel,
        public readonly string $prioridade,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Canal de Escuta — novo relato para o seu grupo',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.escuta-novo-relato', with: [
            'empresaNome' => $this->empresaNome,
            'grupoLabel'  => $this->grupoLabel,
            'prioridade'  => $this->prioridade,
        ]);
    }
}
