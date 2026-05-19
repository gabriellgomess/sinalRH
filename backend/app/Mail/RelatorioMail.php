<?php

namespace App\Mail;

use App\Models\Relatorio;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RelatorioMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Relatorio $relatorio) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.from.address'),
                config('mail.from.name')
            ),
            subject: "Relatorio Radar Pessoas - {$this->relatorio->periodo}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.relatorio',
            with: [
                'relatorio' => $this->relatorio,
                'empresa' => $this->relatorio->empresa,
            ],
        );
    }

    public function attachments(): array
    {
        $this->relatorio->loadMissing('empresa');

        $pdf = Pdf::loadView('pdf.relatorio', [
            'relatorio' => $this->relatorio,
            'empresa' => $this->relatorio->empresa,
        ])->setPaper('a4', 'portrait');

        return [
            Attachment::fromData(
                fn () => $pdf->output(),
                "radar-pessoas-relatorio-{$this->relatorio->periodo}.pdf"
            )->withMime('application/pdf'),
        ];
    }
}
