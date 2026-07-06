<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Relato direcionado ao Comite/Conselho externo (fallback do topo da hierarquia).
 * Nenhum usuario interno tem acesso a esse relato no sistema.
 */
class EscutaComiteMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly array $dados) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Canal de Escuta — relato confidencial para tratamento externo',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.escuta-comite', with: ['d' => $this->dados]);
    }
}
