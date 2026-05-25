<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Nr1AcaoAnexo;
use App\Models\Nr1Avaliacao;
use App\Models\Nr1DossieArquivo;
use App\Models\Nr1PlanoAcao;
use App\Models\Setor;
use App\Services\Nr1DossieService;
use App\Services\Nr1ScoreService;
use App\Services\Nr1RelatorioIAService;
use App\Support\AuditLogger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class Nr1Controller extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $avaliacoes = Nr1Avaliacao::where('empresa_id', $request->user()->empresa_id)
            ->withCount('respondentes')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $avaliacoes]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo'      => 'required|string|max:200',
            'aplicada_em' => 'nullable|date',
            'expira_em'   => 'nullable|date',
            'observacoes' => 'nullable|string|max:2000',
        ]);

        $avaliacao = Nr1Avaliacao::create([
            'empresa_id'  => $request->user()->empresa_id,
            'criado_por'  => $request->user()->id,
            'titulo'      => $validated['titulo'],
            'aplicada_em' => $validated['aplicada_em'] ?? now()->toDateString(),
            'expira_em'   => $validated['expira_em'] ?? null,
            'observacoes' => $validated['observacoes'] ?? null,
            'status'      => 'rascunho',
            'versao'      => '1.0',
        ]);

        AuditLogger::log(
            $request,
            'nr1.criar',
            $avaliacao,
            "Criou avaliacao NR-1 {$avaliacao->titulo}.",
            null,
            $avaliacao->only(['id', 'titulo', 'codigo', 'status'])
        );

        return response()->json(['success' => true, 'data' => $avaliacao], 201);
    }

    public function show(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        $nr1->loadCount('respondentes');

        return response()->json(['success' => true, 'data' => $nr1]);
    }

    public function publicar(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        $antes = $nr1->only(['status']);
        $nr1->update(['status' => 'ativa']);

        AuditLogger::log(
            $request,
            'nr1.publicar',
            $nr1,
            "Publicou avaliacao NR-1 {$nr1->titulo}.",
            $antes,
            $nr1->fresh()->only(['status'])
        );

        return response()->json(['success' => true, 'data' => $nr1]);
    }

    public function encerrar(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        $antes = $nr1->only(['status']);
        $nr1->update(['status' => 'encerrada']);

        AuditLogger::log(
            $request,
            'nr1.encerrar',
            $nr1,
            "Encerrou avaliacao NR-1 {$nr1->titulo}.",
            $antes,
            $nr1->fresh()->only(['status'])
        );

        return response()->json(['success' => true, 'data' => $nr1]);
    }

    public function resultados(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
 
        $filtros = $request->only(['setor_id', 'sexo', 'faixa_etaria']);
        $scores  = Nr1ScoreService::calcular($nr1->id, $filtros);
 
        $setores = Setor::where('empresa_id', $nr1->empresa_id)
            ->select('id', 'nome')
            ->get();
 
        return response()->json([
            'success' => true,
            'data' => [
                'avaliacao'         => $nr1,
                'scores'            => $scores,
                'setores'           => $setores,
                'plano_acao_ativo'  => $nr1->empresa->temProdutoAtivo('plano_acao_nr1'),
            ],
        ]);
    }

    // ── Plano de Ação ─────────────────────────────────────────────────────

    public function planoAcao(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);

        $nr1->load(['planoAcoes.setor:id,nome', 'planoAcoes.anexos']);
        $setores = Setor::where('empresa_id', $nr1->empresa_id)->select('id', 'nome')->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'avaliacao' => $nr1,
                'setores'   => $setores,
            ],
        ]);
    }

    public function criarAcao(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);

        $validated = $request->validate([
            'setor_id'          => 'nullable|integer|exists:setores,id',
            'secao'             => 'nullable|integer|between:1,7',
            'risco_descricao'   => 'required|string|max:1000',
            'acao'              => 'required|string|max:1000',
            'responsavel'       => 'required|string|max:200',
            'responsavel_cargo' => 'nullable|string|max:200',
            'data_prevista'     => 'nullable|date',
            'prioridade'        => 'nullable|in:alta,media,baixa',
            'observacoes'       => 'nullable|string|max:2000',
        ]);

        $acao = $nr1->planoAcoes()->create($validated);

        return response()->json(['success' => true, 'data' => $acao->load('setor:id,nome')], 201);
    }

    public function atualizarAcao(Request $request, Nr1Avaliacao $nr1, Nr1PlanoAcao $acao): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_if((int) $acao->avaliacao_id !== (int) $nr1->id, 404);

        $validated = $request->validate([
            'setor_id'          => 'nullable|integer|exists:setores,id',
            'secao'             => 'nullable|integer|between:1,7',
            'risco_descricao'   => 'sometimes|string|max:1000',
            'acao'              => 'sometimes|string|max:1000',
            'responsavel'       => 'sometimes|string|max:200',
            'responsavel_cargo' => 'nullable|string|max:200',
            'data_prevista'     => 'nullable|date',
            'data_conclusao'    => 'nullable|date',
            'status'            => 'sometimes|in:planejada,em_andamento,concluida,cancelada',
            'prioridade'        => 'nullable|in:alta,media,baixa',
            'observacoes'       => 'nullable|string|max:2000',
        ]);

        $acao->update($validated);

        return response()->json(['success' => true, 'data' => $acao->load('setor:id,nome')]);
    }

    public function excluirAcao(Request $request, Nr1Avaliacao $nr1, Nr1PlanoAcao $acao): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_if((int) $acao->avaliacao_id !== (int) $nr1->id, 404);

        foreach ($acao->anexos as $anexo) {
            Storage::disk('local')->delete($anexo->caminho_storage);
        }

        $acao->delete();

        return response()->json(['success' => true, 'message' => 'Acao removida.']);
    }

    // ── Evidencias / Anexos ──────────────────────────────────────────────

    public function listarAnexos(Request $request, Nr1Avaliacao $nr1, Nr1PlanoAcao $acao): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_if((int) $acao->avaliacao_id !== (int) $nr1->id, 404);

        return response()->json(['success' => true, 'data' => $acao->anexos]);
    }

    public function uploadAnexo(Request $request, Nr1Avaliacao $nr1, Nr1PlanoAcao $acao): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_if((int) $acao->avaliacao_id !== (int) $nr1->id, 404);

        $validated = $request->validate([
            'arquivo'   => 'required|file|max:10240|mimes:pdf,png,jpg,jpeg,doc,docx,xls,xlsx',
            'descricao' => 'nullable|string|max:500',
        ]);

        $arquivo = $request->file('arquivo');
        $pasta   = "nr1/anexos/{$nr1->empresa_id}/{$acao->id}";
        $caminho = $arquivo->store($pasta, 'local');

        $anexo = Nr1AcaoAnexo::create([
            'acao_id'         => $acao->id,
            'nome_original'   => $arquivo->getClientOriginalName(),
            'caminho_storage' => $caminho,
            'tamanho_bytes'   => $arquivo->getSize(),
            'mime_type'       => $arquivo->getMimeType() ?? 'application/octet-stream',
            'descricao'       => $validated['descricao'] ?? null,
            'enviado_por'     => $request->user()->id,
        ]);

        AuditLogger::log(
            $request,
            'nr1.acao.anexo_upload',
            $nr1,
            "Anexou evidencia '{$anexo->nome_original}' a acao do PGR.",
            null,
            ['acao_id' => $acao->id, 'anexo_id' => $anexo->id, 'tamanho' => $anexo->tamanho_bytes]
        );

        return response()->json(['success' => true, 'data' => $anexo], 201);
    }

    public function baixarAnexo(Request $request, Nr1Avaliacao $nr1, Nr1PlanoAcao $acao, Nr1AcaoAnexo $anexo): StreamedResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_if((int) $acao->avaliacao_id !== (int) $nr1->id, 404);
        abort_if((int) $anexo->acao_id !== (int) $acao->id, 404);
        abort_unless(Storage::disk('local')->exists($anexo->caminho_storage), 404);

        return Storage::disk('local')->download(
            $anexo->caminho_storage,
            $anexo->nome_original,
            ['Content-Type' => $anexo->mime_type]
        );
    }

    public function excluirAnexo(Request $request, Nr1Avaliacao $nr1, Nr1PlanoAcao $acao, Nr1AcaoAnexo $anexo): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_if((int) $acao->avaliacao_id !== (int) $nr1->id, 404);
        abort_if((int) $anexo->acao_id !== (int) $acao->id, 404);

        Storage::disk('local')->delete($anexo->caminho_storage);
        $nome = $anexo->nome_original;
        $anexo->delete();

        AuditLogger::log(
            $request,
            'nr1.acao.anexo_excluir',
            $nr1,
            "Removeu evidencia '{$nome}' de acao do PGR.",
            ['acao_id' => $acao->id, 'nome' => $nome]
        );

        return response()->json(['success' => true, 'message' => 'Anexo removido.']);
    }

    // ── Dossie / Documentacao para auditoria ─────────────────────────────

    public function dossieArvore(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);

        return response()->json([
            'success' => true,
            'data'    => [
                'avaliacao' => $nr1->only(['id', 'titulo', 'codigo', 'versao', 'status']),
                'arvore'    => Nr1DossieService::arvore($nr1),
            ],
        ]);
    }

    public function dossieListarPasta(Request $request, Nr1Avaliacao $nr1, string $pasta): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_unless(isset(Nr1DossieService::PASTAS[$pasta]), 404, 'Pasta invalida.');

        $subpasta = $request->query('subpasta');
        $query = Nr1DossieArquivo::where('avaliacao_id', $nr1->id)
            ->where('pasta_codigo', $pasta);
        if ($subpasta) $query->where('subpasta', $subpasta);
        elseif ($pasta === Nr1DossieService::PASTA_COM_SUBPASTAS) $query->whereNull('subpasta');

        $arquivos = $query->with('enviadoPor:id,nome')->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'pasta'    => Nr1DossieService::PASTAS[$pasta],
                'subpasta' => $subpasta,
                'arquivos' => $arquivos,
            ],
        ]);
    }

    public function dossieUpload(Request $request, Nr1Avaliacao $nr1, string $pasta): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_unless(isset(Nr1DossieService::PASTAS[$pasta]), 404, 'Pasta invalida.');

        $validated = $request->validate([
            'arquivo'   => 'required|file|max:51200',
            'subpasta'  => 'nullable|string|max:50|regex:/^[A-Za-z0-9_-]+$/',
            'descricao' => 'nullable|string|max:500',
        ]);

        if ($pasta !== Nr1DossieService::PASTA_COM_SUBPASTAS && !empty($validated['subpasta'])) {
            return response()->json([
                'success' => false,
                'message' => 'Subpasta so eh permitida em ' . Nr1DossieService::PASTAS[Nr1DossieService::PASTA_COM_SUBPASTAS]['nome'],
            ], 422);
        }

        $arquivo = $request->file('arquivo');
        $subpasta = $validated['subpasta'] ?? null;
        $diretorio = "nr1/dossie/{$nr1->empresa_id}/{$nr1->id}/{$pasta}" . ($subpasta ? "/{$subpasta}" : '');
        $caminho = $arquivo->store($diretorio, 'local');

        $arq = Nr1DossieArquivo::create([
            'avaliacao_id'    => $nr1->id,
            'pasta_codigo'    => $pasta,
            'subpasta'        => $subpasta,
            'nome_original'   => $arquivo->getClientOriginalName(),
            'caminho_storage' => $caminho,
            'tamanho_bytes'   => $arquivo->getSize(),
            'mime_type'       => $arquivo->getMimeType() ?? 'application/octet-stream',
            'descricao'       => $validated['descricao'] ?? null,
            'enviado_por'     => $request->user()->id,
        ]);

        AuditLogger::log(
            $request,
            'nr1.dossie.upload',
            $nr1,
            "Anexou '{$arq->nome_original}' em {$pasta}" . ($subpasta ? "/{$subpasta}" : '') . " do dossie.",
            null,
            ['pasta' => $pasta, 'subpasta' => $subpasta, 'arquivo_id' => $arq->id, 'tamanho' => $arq->tamanho_bytes]
        );

        return response()->json(['success' => true, 'data' => $arq->load('enviadoPor:id,nome')], 201);
    }

    public function dossieBaixar(Request $request, Nr1Avaliacao $nr1, Nr1DossieArquivo $arquivo)
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_if((int) $arquivo->avaliacao_id !== (int) $nr1->id, 404);
        abort_unless(Storage::disk('local')->exists($arquivo->caminho_storage), 404);

        return Storage::disk('local')->download(
            $arquivo->caminho_storage,
            $arquivo->nome_original,
            ['Content-Type' => $arquivo->mime_type]
        );
    }

    public function dossieExcluir(Request $request, Nr1Avaliacao $nr1, Nr1DossieArquivo $arquivo): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);
        abort_if((int) $arquivo->avaliacao_id !== (int) $nr1->id, 404);

        Storage::disk('local')->delete($arquivo->caminho_storage);
        $nome  = $arquivo->nome_original;
        $pasta = $arquivo->pasta_codigo;
        $arquivo->delete();

        AuditLogger::log(
            $request,
            'nr1.dossie.excluir',
            $nr1,
            "Removeu '{$nome}' de {$pasta} do dossie.",
            ['pasta' => $pasta, 'nome' => $nome]
        );

        return response()->json(['success' => true, 'message' => 'Arquivo removido.']);
    }

    public function dossieSubpastasMensais(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);

        $existentes = Nr1DossieArquivo::where('avaliacao_id', $nr1->id)
            ->where('pasta_codigo', Nr1DossieService::PASTA_COM_SUBPASTAS)
            ->whereNotNull('subpasta')
            ->distinct()
            ->pluck('subpasta')
            ->all();

        sort($existentes, SORT_NATURAL);

        return response()->json(['success' => true, 'data' => $existentes]);
    }

    public function dossieZip(Request $request, Nr1Avaliacao $nr1): BinaryFileResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);
        $this->verificarPlanoAcaoAtivo($nr1);

        $nr1->load('empresa');
        $zipPath = Nr1DossieService::gerarZip($nr1);

        AuditLogger::log(
            $request,
            'nr1.dossie.export_zip',
            $nr1,
            "Exportou dossie completo NR-1 ({$nr1->codigo}) em ZIP."
        );

        return response()->download(
            $zipPath,
            "dossie-pgr-{$nr1->codigo}-v" . ($nr1->versao ?? '1.0') . ".zip",
            ['Content-Type' => 'application/zip']
        )->deleteFileAfterSend(true);
    }

    // ── Historico de versoes ─────────────────────────────────────────────

    public function historico(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        // Coletar cadeia ate a raiz
        $cadeia = collect([$nr1]);
        $atual  = $nr1;
        while ($atual->versao_origem_id) {
            $atual = Nr1Avaliacao::find($atual->versao_origem_id);
            if (!$atual) break;
            $cadeia->prepend($atual);
        }

        // Coletar versoes filhas (caso o nr1 atual nao seja a versao mais recente da cadeia)
        $filhasRecentes = Nr1Avaliacao::where('versao_origem_id', $nr1->id)
            ->orderBy('created_at')
            ->get();
        foreach ($filhasRecentes as $f) {
            if (!$cadeia->contains('id', $f->id)) $cadeia->push($f);
        }

        $versoes = $cadeia->map(function (Nr1Avaliacao $av) {
            $scores = Nr1ScoreService::calcular($av->id);
            return [
                'id'                   => $av->id,
                'versao'               => $av->versao,
                'titulo'               => $av->titulo,
                'codigo'               => $av->codigo,
                'status'               => $av->status,
                'aplicada_em'          => $av->aplicada_em?->toDateString(),
                'aprovado_em'          => $av->aprovado_em?->toDateString(),
                'proxima_avaliacao_em' => $av->proxima_avaliacao_em?->toDateString(),
                'score_geral'          => $scores['score_geral'],
                'total_respondentes'   => $scores['total_respondentes'],
                'por_secao'            => collect($scores['por_secao'])->map(fn ($s) => [
                    'secao' => $s['secao'],
                    'label' => $s['label'],
                    'score' => $s['score'],
                ])->all(),
            ];
        })->values();

        return response()->json(['success' => true, 'data' => [
            'atual_id' => $nr1->id,
            'versoes'  => $versoes,
        ]]);
    }

    public function duplicar(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        $proximaVersao = $this->proximaVersao($nr1->versao ?? '1.0');

        $nova = Nr1Avaliacao::create([
            'empresa_id'       => $nr1->empresa_id,
            'criado_por'       => $request->user()->id,
            'titulo'           => preg_replace('/\s+\(v\d+(\.\d+)?\)$/', '', $nr1->titulo) . " (v{$proximaVersao})",
            'aplicada_em'      => now()->toDateString(),
            'observacoes'      => $nr1->observacoes,
            'status'           => 'rascunho',
            'versao'           => $proximaVersao,
            'versao_origem_id' => $nr1->id,
        ]);

        AuditLogger::log(
            $request,
            'nr1.duplicar',
            $nova,
            "Criou nova versao v{$proximaVersao} a partir da avaliacao {$nr1->titulo} (v" . ($nr1->versao ?? '1.0') . ").",
            ['origem_id' => $nr1->id, 'origem_versao' => $nr1->versao],
            $nova->only(['id', 'titulo', 'codigo', 'versao', 'versao_origem_id'])
        );

        return response()->json(['success' => true, 'data' => $nova], 201);
    }

    private function proximaVersao(string $versaoAtual): string
    {
        $partes = explode('.', $versaoAtual);
        $major  = (int) ($partes[0] ?? 1);
        return ($major + 1) . '.0';
    }

    public function aprovar(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        $validated = $request->validate([
            'aprovado_por'         => 'required|string|max:200',
            'aprovado_cargo'       => 'nullable|string|max:200',
            'aprovado_em'          => 'required|date',
            'proxima_avaliacao_em' => 'nullable|date',
        ]);

        $nr1->update($validated);

        AuditLogger::log(
            $request,
            'nr1.aprovar',
            $nr1,
            "Aprovou PGR/NR-1 {$nr1->titulo}.",
            null,
            $validated
        );

        return response()->json(['success' => true, 'data' => $nr1->fresh()]);
    }

    // ── PDF ───────────────────────────────────────────────────────────────

    public function pdf(Request $request, Nr1Avaliacao $nr1): \Illuminate\Http\Response
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        $filtros    = $request->only(['setor_id', 'sexo', 'faixa_etaria']);
        $scores     = Nr1ScoreService::calcular($nr1->id, $filtros);
        $empresa    = $nr1->empresa;
        $planoAcoes = $nr1->empresa->temProdutoAtivo('plano_acao_nr1')
            ? $nr1->planoAcoes()->with(['setor:id,nome', 'anexos'])->get()
            : collect();
        $nr1->load('versaoOrigem:id,titulo,versao,aplicada_em');
        $totalSetores       = $empresa->setores()->count();
        $totalColaboradores = $empresa->colaboradores()->where('status', 'ativo')->count();

        $pdf = Pdf::loadView('pdf.nr1', compact(
            'nr1', 'scores', 'empresa', 'filtros', 'planoAcoes',
            'totalSetores', 'totalColaboradores'
        ))->setPaper('a4', 'portrait');

        AuditLogger::log(
            $request,
            'nr1.exportar_pdf',
            $nr1,
            "Exportou PDF da avaliacao NR-1 {$nr1->titulo}."
        );

        return $pdf->download("pgr-nr1-{$nr1->codigo}.pdf");
    }

    public function destroy(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        $antes = $nr1->only(['id', 'titulo', 'codigo', 'status']);
        $nr1->delete();

        AuditLogger::log(
            $request,
            'nr1.excluir',
            $nr1,
            "Removeu avaliacao NR-1 {$nr1->titulo}.",
            $antes
        );

        return response()->json(['success' => true, 'message' => 'Avaliacao removida.']);
    }

    public function gerarIA(Request $request, Nr1Avaliacao $nr1, Nr1RelatorioIAService $service): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        $isExpired = $nr1->expira_em && now()->greaterThan($nr1->expira_em->endOfDay());
        if ($nr1->status !== 'encerrada' && !$isExpired) {
            return response()->json([
                'success' => false,
                'message' => 'A análise de IA só pode ser gerada após o encerramento da avaliação.'
            ], 422);
        }

        if (in_array($nr1->relatorio_ia_status, ['gerando', 'pronto'])) {
            return response()->json([
                'success' => false,
                'message' => 'A análise de IA já foi gerada ou está em andamento.'
            ], 422);
        }

        try {
            $service->gerar($nr1);

            AuditLogger::log(
                $request,
                'nr1.ia.gerar',
                $nr1,
                "Gerou relatorio de IA da avaliacao NR-1 {$nr1->titulo}."
            );

            return response()->json([
                'success' => true,
                'status'  => 'pronto',
                'dados'   => $nr1->fresh()->relatorio_ia_dados,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'status'  => 'erro',
                'message' => 'Falha ao processar o relatório de IA: ' . $e->getMessage()
            ], 500);
        }
    }

    public function ia(Request $request, Nr1Avaliacao $nr1): JsonResponse
    {
        abort_if($nr1->empresa_id !== $request->user()->empresa_id, 403);

        return response()->json([
            'success' => true,
            'status' => $nr1->relatorio_ia_status,
            'dados'  => $nr1->relatorio_ia_dados,
        ]);
    }

    private function verificarPlanoAcaoAtivo(Nr1Avaliacao $nr1): void
    {
        abort_unless(
            $nr1->empresa->temProdutoAtivo('plano_acao_nr1'),
            403,
            'Recurso restrito: Sua empresa não possui o produto "Plano de Ação Continuado NR-1" contratado e ativo.'
        );
    }
}
