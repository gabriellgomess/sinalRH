<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Relatorio;
use App\Services\RelatorioIAService;
use App\Support\AuditLogger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class RelatorioController extends Controller
{
    public function __construct(private RelatorioIAService $relatorioIA) {}

    public function index(Request $request): JsonResponse
    {
        $relatorios = Relatorio::where('empresa_id', $request->user()->empresa_id)
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($relatorios);
    }

    public function show(Request $request, Relatorio $relatorio): JsonResponse
    {
        $this->authorize('view', $relatorio);
        return response()->json($relatorio->load('criador', 'revisor'));
    }

    public function gerar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periodo' => 'required|string|regex:/^\d{4}-Q[1-4]$/',
            'tipo'    => 'in:executivo,setorial,risco,comparativo',
        ]);

        $empresa = $request->user()->empresa;

        $relatorio = Relatorio::create([
            'empresa_id'    => $empresa->id,
            'criado_por'    => $request->user()->id,
            'periodo'       => $validated['periodo'],
            'tipo'          => $validated['tipo'] ?? 'executivo',
            'status'        => 'gerando',
            'gerado_por_ia' => true,
            'metadados'     => [
                'colaboradores' => $empresa->colaboradores()->where('status', 'ativo')->count(),
                'setores'       => $empresa->setores()->count(),
            ],
        ]);

        \App\Jobs\GerarRelatorioJob::dispatch($relatorio, $empresa);

        AuditLogger::log(
            $request,
            'relatorio.gerar',
            $relatorio,
            "Solicitou geracao do relatorio {$relatorio->periodo}.",
            null,
            $relatorio->only(['id', 'periodo', 'tipo', 'status'])
        );

        return response()->json([
            'message' => 'Relatorio em geracao. Voce sera notificado quando estiver pronto.',
            'relatorio_id' => $relatorio->id,
        ], 202);
    }

    public function exportarPdf(Request $request, Relatorio $relatorio): \Illuminate\Http\Response
    {
        $this->authorize('view', $relatorio);
        abort_if($relatorio->status !== 'pronto', 422, 'Relatorio ainda nao esta pronto.');

        $pdf = Pdf::loadView('pdf.relatorio', [
            'relatorio' => $relatorio,
            'empresa'   => $relatorio->empresa,
        ])->setPaper('a4', 'portrait');

        AuditLogger::log(
            $request,
            'relatorio.exportar_pdf',
            $relatorio,
            "Exportou PDF do relatorio {$relatorio->periodo}."
        );

        return $pdf->download("sinal-rh-relatorio-{$relatorio->periodo}.pdf");
    }

    public function enviarPorEmail(Request $request, Relatorio $relatorio): JsonResponse
    {
        $this->authorize('view', $relatorio);
        $request->validate(['emails' => 'required|array', 'emails.*' => 'email']);

        foreach ($request->emails as $email) {
            Mail::to($email)->queue(new \App\Mail\RelatorioMail($relatorio));
        }

        AuditLogger::log(
            $request,
            'relatorio.enviar_email',
            $relatorio,
            "Enviou relatorio {$relatorio->periodo} por e-mail.",
            null,
            ['emails' => $request->emails]
        );

        return response()->json(['message' => 'Relatorio enviado por e-mail.']);
    }
}
