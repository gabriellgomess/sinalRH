<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AsaasWebhookController;
use App\Http\Controllers\Api\CadastroController;
use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\App as AppControllers;
use App\Http\Controllers\Api\Plataforma;
use App\Http\Controllers\Api\Nr1PublicoController;

/*
|--------------------------------------------------------------------------
| Sinal RH — API Routes
|--------------------------------------------------------------------------
*/

// ── Cadastro self-service de empresa ─────────────────────────────────────
Route::post('/cadastro', [CadastroController::class, 'store']);
Route::post('/webhooks/asaas', AsaasWebhookController::class);
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('cadastro')->group(function () {
    Route::post('setores',  [CadastroController::class, 'setoresOnboarding']);
    Route::post('convites', [CadastroController::class, 'convitesOnboarding']);
});

// ── Saúde da API ──────────────────────────────────────────────────────────
Route::get('/ping', fn () => response()->json([
    'status'  => 'ok',
    'produto' => 'Sinal RH',
    'versao'  => config('app.sinalrh_versao', '1.0.0'),
    'empresa' => 'Sara Linhar Consultoria',
]));

// ── Autenticação ──────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('colaborador/login', [AuthController::class, 'loginColaborador']);
    Route::get('colaborador/convite/{token}', [AuthController::class, 'validarConviteColaborador']);
    Route::post('colaborador/convite/{token}', [AuthController::class, 'aceitarConviteColaborador']);
    Route::post('admin/login',       [AuthController::class, 'loginAdmin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
    });
});

// ── Área do Colaborador (PWA Mobile) ─────────────────────────────────────
Route::prefix('app')
    ->middleware(['auth:sanctum', 'role:colaborador'])
    ->group(function () {

    Route::get('home',    [AppControllers\HomeController::class, 'index']);
    Route::get('perfil',  [AppControllers\HomeController::class, 'perfil']);

    // Pesquisas
    Route::get('pesquisas',           [AppControllers\PesquisaController::class, 'index']);
    Route::get('pesquisas/{pesquisa}',[AppControllers\PesquisaController::class, 'show']);
    Route::post('pesquisas/{pesquisa}/responder', [AppControllers\PesquisaController::class, 'responder']);

    // Check-in semanal
    Route::get('checkin/atual',       [AppControllers\CheckInController::class, 'atual']);
    Route::post('checkin',            [AppControllers\CheckInController::class, 'store']);
    Route::get('checkin/historico',   [AppControllers\CheckInController::class, 'historico']);

    // Comunicados
    Route::get('comunicados',           [AppControllers\ComunicadoController::class, 'index']);
    Route::post('comunicados/{id}/ler', [AppControllers\ComunicadoController::class, 'marcarLido']);

    // Canal de escuta
    Route::post('escuta', [AppControllers\EscutaController::class, 'store']);

    // EAD / Treinamentos
    Route::get('ead/cursos',                     [AppControllers\EadController::class, 'index']);
    Route::get('ead/cursos/{curso}',             [AppControllers\EadController::class, 'show']);
    Route::get('ead/aulas/{aula}',               [AppControllers\EadController::class, 'conteudoAula']);
    Route::get('ead/aulas/{aula}/video',         [AppControllers\EadController::class, 'streamVideo']);
    Route::get('ead/aulas/{aula}/anexos/{anexo}',[AppControllers\EadController::class, 'baixarAnexo']);
    Route::post('ead/aulas/{aula}/concluir',     [AppControllers\EadController::class, 'concluirAula']);
    Route::get('ead/testes/{teste}',             [AppControllers\EadController::class, 'teste']);
    Route::post('ead/testes/{teste}/responder',  [AppControllers\EadController::class, 'responderTeste']);
});

// ── NR-1 / PGR — Avaliação pública (sem autenticação) ────────────────────
Route::prefix('nr1')->group(function () {
    Route::get('{codigo}',          [Nr1PublicoController::class, 'show']);
    Route::post('{codigo}/responder',[Nr1PublicoController::class, 'responder']);
});

// ── Plataforma (super admin Sara Linhar) ─────────────────────────────────
Route::prefix('plataforma')
    ->name('plataforma.')
    ->middleware(['auth:sanctum', 'role:super_admin'])
    ->group(function () {

    Route::get('dashboard', [Plataforma\DashboardController::class, 'index']);
    Route::apiResource('empresas', Plataforma\EmpresaController::class);

    // Produtos = acesso/funcionalidade (sem cobranca)
    Route::get('empresas/{empresa}/produtos',             [Plataforma\EmpresaProdutoController::class, 'index']);
    Route::post('empresas/{empresa}/produtos',            [Plataforma\EmpresaProdutoController::class, 'store']);
    Route::put('empresas/{empresa}/produtos/{produto}',   [Plataforma\EmpresaProdutoController::class, 'update']);
    Route::delete('empresas/{empresa}/produtos/{produto}',[Plataforma\EmpresaProdutoController::class, 'destroy']);

    // Cobrancas = financeiro (avulsas, atreladas a empresa/customer Asaas)
    Route::get('empresas/{empresa}/cobrancas',            [Plataforma\CobrancaController::class, 'index']);
    Route::post('empresas/{empresa}/cobrancas',           [Plataforma\CobrancaController::class, 'store']);
    Route::put('empresas/{empresa}/cobrancas/{cobranca}', [Plataforma\CobrancaController::class, 'update']);
    Route::post('empresas/{empresa}/cobrancas/{cobranca}/sincronizar-asaas', [Plataforma\CobrancaController::class, 'sincronizarAsaas']);
    Route::delete('empresas/{empresa}/cobrancas/{cobranca}', [Plataforma\CobrancaController::class, 'destroy']);

    // ── EAD / Treinamentos (criacao e liberacao dos cursos) ──────────────
    Route::prefix('ead')->group(function () {
        // Cursos
        Route::get('cursos',                 [Plataforma\Ead\CursoController::class, 'index']);
        Route::post('cursos',                [Plataforma\Ead\CursoController::class, 'store']);
        Route::get('cursos/{curso}',         [Plataforma\Ead\CursoController::class, 'show']);
        Route::put('cursos/{curso}',         [Plataforma\Ead\CursoController::class, 'update']);
        Route::delete('cursos/{curso}',      [Plataforma\Ead\CursoController::class, 'destroy']);
        Route::post('cursos/{curso}/publicar',  [Plataforma\Ead\CursoController::class, 'publicar']);
        Route::post('cursos/{curso}/arquivar',  [Plataforma\Ead\CursoController::class, 'arquivar']);
        Route::post('cursos/{curso}/duplicar',  [Plataforma\Ead\CursoController::class, 'duplicar']);

        // Modulos
        Route::post('cursos/{curso}/modulos',                    [Plataforma\Ead\ModuloController::class, 'store']);
        Route::put('cursos/{curso}/modulos/{modulo}',            [Plataforma\Ead\ModuloController::class, 'update']);
        Route::delete('cursos/{curso}/modulos/{modulo}',         [Plataforma\Ead\ModuloController::class, 'destroy']);
        Route::post('cursos/{curso}/modulos/reordenar',          [Plataforma\Ead\ModuloController::class, 'reordenar']);

        // Aulas
        Route::post('cursos/{curso}/modulos/{modulo}/aulas',                 [Plataforma\Ead\AulaController::class, 'store']);
        Route::put('cursos/{curso}/modulos/{modulo}/aulas/{aula}',           [Plataforma\Ead\AulaController::class, 'update']);
        Route::delete('cursos/{curso}/modulos/{modulo}/aulas/{aula}',        [Plataforma\Ead\AulaController::class, 'destroy']);
        Route::post('cursos/{curso}/modulos/{modulo}/aulas/reordenar',       [Plataforma\Ead\AulaController::class, 'reordenar']);

        // Midia das aulas
        Route::post('cursos/{curso}/modulos/{modulo}/aulas/{aula}/video',            [Plataforma\Ead\AulaController::class, 'uploadVideo']);
        Route::get('cursos/{curso}/modulos/{modulo}/aulas/{aula}/video',             [Plataforma\Ead\AulaController::class, 'streamVideo']);
        Route::get('cursos/{curso}/modulos/{modulo}/aulas/{aula}/anexos',            [Plataforma\Ead\AulaController::class, 'listarAnexos']);
        Route::post('cursos/{curso}/modulos/{modulo}/aulas/{aula}/anexos',           [Plataforma\Ead\AulaController::class, 'uploadAnexo']);
        Route::get('cursos/{curso}/modulos/{modulo}/aulas/{aula}/anexos/{anexo}',    [Plataforma\Ead\AulaController::class, 'baixarAnexo']);
        Route::delete('cursos/{curso}/modulos/{modulo}/aulas/{aula}/anexos/{anexo}', [Plataforma\Ead\AulaController::class, 'excluirAnexo']);

        // Testes de aptidao
        Route::get('cursos/{curso}/testes',                          [Plataforma\Ead\TesteController::class, 'index']);
        Route::post('cursos/{curso}/testes',                         [Plataforma\Ead\TesteController::class, 'store']);
        Route::get('cursos/{curso}/testes/{teste}',                  [Plataforma\Ead\TesteController::class, 'show']);
        Route::put('cursos/{curso}/testes/{teste}',                  [Plataforma\Ead\TesteController::class, 'update']);
        Route::delete('cursos/{curso}/testes/{teste}',               [Plataforma\Ead\TesteController::class, 'destroy']);
        Route::post('cursos/{curso}/testes/{teste}/perguntas',                 [Plataforma\Ead\TesteController::class, 'storePergunta']);
        Route::put('cursos/{curso}/testes/{teste}/perguntas/{pergunta}',       [Plataforma\Ead\TesteController::class, 'updatePergunta']);
        Route::delete('cursos/{curso}/testes/{teste}/perguntas/{pergunta}',    [Plataforma\Ead\TesteController::class, 'destroyPergunta']);

        // Indices consolidados
        Route::get('cursos/{curso}/resultados',          [Plataforma\Ead\ResultadoController::class, 'index']);
        Route::get('cursos/{curso}/resultados/exportar', [Plataforma\Ead\ResultadoController::class, 'exportar']);

        // Liberacao / replicacao por empresa
        Route::get('cursos/{curso}/empresas',              [Plataforma\Ead\ReplicacaoController::class, 'index']);
        Route::post('cursos/{curso}/empresas',             [Plataforma\Ead\ReplicacaoController::class, 'store']);
        Route::put('cursos/{curso}/empresas/{empresa}',    [Plataforma\Ead\ReplicacaoController::class, 'update']);
        Route::delete('cursos/{curso}/empresas/{empresa}', [Plataforma\Ead\ReplicacaoController::class, 'destroy']);
    });
});

// ── Área Administrativa ───────────────────────────────────────────────────
Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth:sanctum', 'role:admin,gestor,consultor'])
    ->group(function () {

    // Dashboard & Indicadores
    Route::get('dashboard',    [Admin\DashboardController::class, 'index']);
    Route::get('indicadores',  [Admin\DashboardController::class, 'indicadores']);
    Route::get('alertas',      [Admin\DashboardController::class, 'alertas']);

    // Empresas
    Route::apiResource('empresas', Admin\EmpresaController::class);

    // Setores
    Route::apiResource('setores', Admin\SetorController::class)
        ->parameters(['setores' => 'setor']);
    Route::get('empresas/{empresa}/setores', [Admin\SetorController::class, 'porEmpresa']);

    // Colaboradores
    Route::post('colaboradores/importar',       [Admin\ColaboradorController::class, 'importar']);
    Route::get('colaboradores/exportar',        [Admin\ColaboradorController::class, 'exportar']);
    Route::get('colaboradores/template-csv',    [Admin\ColaboradorController::class, 'templateCsv']);
    Route::post('colaboradores/{colaborador}/convite', [Admin\ColaboradorController::class, 'enviarConvite']);
    Route::apiResource('colaboradores', Admin\ColaboradorController::class)
        ->parameters(['colaboradores' => 'colaborador']);

    // Pesquisas
    Route::apiResource('pesquisas', Admin\PesquisaController::class);
    Route::post('pesquisas/{pesquisa}/publicar',  [Admin\PesquisaController::class, 'publicar']);
    Route::post('pesquisas/{pesquisa}/encerrar',  [Admin\PesquisaController::class, 'encerrar']);
    Route::post('pesquisas/{pesquisa}/duplicar',  [Admin\PesquisaController::class, 'duplicar']);
    Route::get('pesquisas/{pesquisa}/resultados', [Admin\PesquisaController::class, 'resultados']);
    Route::get('pesquisas/{pesquisa}/exportar',   [Admin\PesquisaController::class, 'exportar']);

    // Perguntas (nested em pesquisas)
    Route::apiResource('pesquisas.perguntas', Admin\PerguntaController::class)
        ->except(['index', 'show']);

    // Check-ins
    Route::get('checkins',           [Admin\CheckInController::class, 'index']);
    Route::get('checkins/resumo',    [Admin\CheckInController::class, 'resumo']);
    Route::get('checkins/semana/{semana}', [Admin\CheckInController::class, 'porSemana']);

    // Mapa de Riscos
    Route::get('riscos',              [Admin\RiscoController::class, 'index']);
    Route::get('riscos/{setor}',      [Admin\RiscoController::class, 'show']);
    Route::post('riscos/{setor}/plano-acao', [Admin\RiscoController::class, 'planoAcao']);
    Route::post('riscos/{setor}/revisao',    [Admin\RiscoController::class, 'revisao']);

    // Canal de Escuta (admin)
    Route::get('escuta',                  [Admin\EscutaController::class, 'index']);
    Route::get('escuta/{relato}',         [Admin\EscutaController::class, 'show']);
    Route::put('escuta/{relato}/status',  [Admin\EscutaController::class, 'atualizarStatus']);
    Route::post('escuta/{relato}/assumir',[Admin\EscutaController::class, 'assumir']);
    Route::post('escuta/{relato}/nota',   [Admin\EscutaController::class, 'adicionarNota']);

    // Comunicados
    Route::apiResource('comunicados', Admin\ComunicadoController::class);

    // Relatórios com IA
    Route::get('relatorios',            [Admin\RelatorioController::class, 'index']);
    Route::get('relatorios/{relatorio}',[Admin\RelatorioController::class, 'show']);
    Route::post('relatorios/gerar',     [Admin\RelatorioController::class, 'gerar']);
    Route::get('relatorios/{relatorio}/pdf', [Admin\RelatorioController::class, 'exportarPdf']);
    Route::post('relatorios/{relatorio}/enviar', [Admin\RelatorioController::class, 'enviarPorEmail']);

    // NR-1 / PGR (admin)
    Route::get('nr1',                                    [Admin\Nr1Controller::class, 'index']);
    Route::get('nr1/benchmark',                          [Admin\Nr1Controller::class, 'benchmark']);
    Route::post('nr1',                                   [Admin\Nr1Controller::class, 'store']);
    Route::get('nr1/{nr1}',                              [Admin\Nr1Controller::class, 'show']);
    Route::delete('nr1/{nr1}',                           [Admin\Nr1Controller::class, 'destroy']);
    Route::post('nr1/{nr1}/publicar',                    [Admin\Nr1Controller::class, 'publicar']);
    Route::post('nr1/{nr1}/encerrar',                    [Admin\Nr1Controller::class, 'encerrar']);
    Route::post('nr1/{nr1}/aprovar',                     [Admin\Nr1Controller::class, 'aprovar']);
    Route::post('nr1/{nr1}/duplicar',                    [Admin\Nr1Controller::class, 'duplicar']);
    Route::get('nr1/{nr1}/resultados',                   [Admin\Nr1Controller::class, 'resultados']);
    Route::get('nr1/{nr1}/adesao',                       [Admin\Nr1Controller::class, 'adesao']);
    Route::post('nr1/{nr1}/lembrete',                    [Admin\Nr1Controller::class, 'enviarLembretes']);
    Route::get('nr1/{nr1}/pdf',                          [Admin\Nr1Controller::class, 'pdf']);
    Route::get('nr1/{nr1}/plano-acao',                   [Admin\Nr1Controller::class, 'planoAcao']);
    Route::get('nr1/{nr1}/plano-acao/exportar',          [Admin\Nr1Controller::class, 'exportarPlanoAcao']);
    Route::post('nr1/{nr1}/plano-acao',                  [Admin\Nr1Controller::class, 'criarAcao']);
    Route::put('nr1/{nr1}/plano-acao/{acao}',            [Admin\Nr1Controller::class, 'atualizarAcao']);
    Route::delete('nr1/{nr1}/plano-acao/{acao}',         [Admin\Nr1Controller::class, 'excluirAcao']);
    Route::get('nr1/{nr1}/plano-acao/{acao}/anexos',           [Admin\Nr1Controller::class, 'listarAnexos']);
    Route::post('nr1/{nr1}/plano-acao/{acao}/anexos',          [Admin\Nr1Controller::class, 'uploadAnexo']);
    Route::get('nr1/{nr1}/plano-acao/{acao}/anexos/{anexo}',   [Admin\Nr1Controller::class, 'baixarAnexo']);
    Route::delete('nr1/{nr1}/plano-acao/{acao}/anexos/{anexo}',[Admin\Nr1Controller::class, 'excluirAnexo']);
    Route::get('nr1/{nr1}/historico',                          [Admin\Nr1Controller::class, 'historico']);
    Route::post('nr1/{nr1}/gerar-ia',                          [Admin\Nr1Controller::class, 'gerarIA']);
    Route::get('nr1/{nr1}/ia',                                 [Admin\Nr1Controller::class, 'ia']);

    // Dossie / Documentacao para auditoria
    Route::get('nr1/{nr1}/dossie',                             [Admin\Nr1Controller::class, 'dossieArvore']);
    Route::get('nr1/{nr1}/dossie/subpastas-mensais',           [Admin\Nr1Controller::class, 'dossieSubpastasMensais']);
    Route::get('nr1/{nr1}/dossie/zip',                         [Admin\Nr1Controller::class, 'dossieZip']);
    Route::get('nr1/{nr1}/dossie/arquivos/{arquivo}',          [Admin\Nr1Controller::class, 'dossieBaixar']);
    Route::delete('nr1/{nr1}/dossie/arquivos/{arquivo}',       [Admin\Nr1Controller::class, 'dossieExcluir']);
    Route::get('nr1/{nr1}/dossie/{pasta}',                     [Admin\Nr1Controller::class, 'dossieListarPasta']);
    Route::post('nr1/{nr1}/dossie/{pasta}',                    [Admin\Nr1Controller::class, 'dossieUpload']);

    // Usuários & Configurações
    Route::get('usuarios',          [Admin\UsuarioController::class, 'index']);
    Route::post('usuarios',         [Admin\UsuarioController::class, 'store']);
    Route::put('usuarios/{user}',   [Admin\UsuarioController::class, 'update']);
    Route::delete('usuarios/{user}',[Admin\UsuarioController::class, 'destroy']);
    Route::get('configuracoes',              [Admin\ConfiguracaoController::class, 'index']);
    Route::put('configuracoes',              [Admin\ConfiguracaoController::class, 'update']);
    Route::post('configuracoes/onboarding', [Admin\ConfiguracaoController::class, 'concluirOnboarding']);

    Route::get('produtos-contratados', [Admin\DashboardController::class, 'produtosContratados']);
    Route::get('cobrancas', [Admin\CobrancaController::class, 'index']);

    // ── EAD / Treinamentos (visualizacao + indices) ─────────────────────
    Route::prefix('ead')->group(function () {
        // Modo visualizacao (nada e persistido)
        Route::get('cursos',                      [Admin\Ead\VisualizacaoController::class, 'index']);
        Route::get('cursos/{curso}/visualizar',   [Admin\Ead\VisualizacaoController::class, 'show']);
        Route::get('aulas/{aula}',                [Admin\Ead\VisualizacaoController::class, 'conteudoAula']);
        Route::get('aulas/{aula}/video',          [Admin\Ead\VisualizacaoController::class, 'streamVideo']);
        Route::get('aulas/{aula}/anexos/{anexo}', [Admin\Ead\VisualizacaoController::class, 'baixarAnexo']);
        Route::get('testes/{teste}',              [Admin\Ead\VisualizacaoController::class, 'teste']);
        Route::post('testes/{teste}/simular',     [Admin\Ead\VisualizacaoController::class, 'simular']);

        // Indices (execucao e notas) da propria empresa
        Route::get('cursos/{curso}/resultados',          [Admin\Ead\ResultadoController::class, 'index']);
        Route::get('cursos/{curso}/resultados/exportar', [Admin\Ead\ResultadoController::class, 'exportar']);
    });
});
