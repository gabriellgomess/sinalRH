<?php

namespace App\Mail;

use App\Models\Colaborador;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ColaboradorConviteMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Colaborador $colaborador,
        public string $url
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.from.address'), config('mail.from.name')),
            subject: 'Convite para acessar o Radar Pessoas',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.colaborador-convite',
            with: [
                'colaborador' => $this->colaborador,
                'empresa' => $this->colaborador->empresa,
                'url' => $this->url,
            ],
        );
    }
}
