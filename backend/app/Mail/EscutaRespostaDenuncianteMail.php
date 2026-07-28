<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso ao denunciante (que deixou e-mail opcional) de que ha uma nova
 * resposta no seu relato. NAO contem o protocolo nem qualquer conteudo —
 * apenas o link da pagina de acompanhamento (o protocolo so ele tem).
 */
class EscutaRespostaDenuncianteMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $urlAcompanhamento,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Canal de Escuta — voce tem uma nova resposta',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.escuta-resposta-denunciante', with: [
            'urlAcompanhamento' => $this->urlAcompanhamento,
        ]);
    }
}
