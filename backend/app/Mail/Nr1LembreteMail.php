<?php

namespace App\Mail;

use App\Models\Colaborador;
use App\Models\Nr1Avaliacao;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class Nr1LembreteMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Colaborador $colaborador,
        public Nr1Avaliacao $avaliacao,
        public string $url
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.from.address'), config('mail.from.name')),
            subject: 'Lembrete: Pesquisa de Clima / Saúde e Segurança Psicossocial (NR-1)',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.nr1-lembrete',
            with: [
                'colaborador' => $this->colaborador,
                'empresa'     => $this->colaborador->empresa,
                'avaliacao'   => $this->avaliacao,
                'url'         => $this->url,
            ],
        );
    }
}
