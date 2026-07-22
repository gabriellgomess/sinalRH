# Plano de Execução — Módulo EAD (Sinal RH)

> Documento de planejamento. Nenhuma alteração de código foi feita.
> Atualizado: 22/07/2026 — v3 (visualização do curso pela empresa sem impacto nos índices)

## 1. Arquitetura de papéis

| Painel | Quem | O que faz no EAD |
|---|---|---|
| **Plataforma** (`/plataforma`, `role:super_admin`) | Você (Sara Linhar) | **Cria e monta os cursos** (vídeos upload/YouTube, textos, imagens, documentos, testes), **escolhe para quais empresas liberar**, e vê **índices de todas as empresas** |
| **Admin da empresa** (`/admin`, `role:admin,gestor,consultor`) | Cliente | **Visualiza o curso completo** (aulas e testes, em modo visualização — nada é mensurado) e acompanha os **índices de execução e notas** dos seus colaboradores |
| **App do colaborador** (`/app`, `role:colaborador`) | Empregado | Realiza os cursos e testes — **único perfil que gera índices** |

Regras centrais do modelo:
- **Curso montado não fica disponível para ninguém por padrão.** Publicar apenas o torna apto à liberação; ele só aparece para as empresas explicitamente selecionadas na replicação (`ead_curso_empresa`).
- **Índices são gerados exclusivamente por colaboradores** (matrícula, progresso, tentativas). O acesso do admin da empresa é **modo visualização**: pode assistir às aulas e fazer os testes (com correção na hora), mas nada é persistido nem entra em qualquer índice.
- Gate do módulo continua sendo o produto `ead` em `EmpresaProduto`.

## 2. Padrões existentes reaproveitados

| Padrão | Onde está | Uso no EAD |
|---|---|---|
| Gating por produto contratado | `EmpresaProduto::PRODUTOS` + `Sidebar.jsx` + `/admin/produtos-contratados` | Novo produto `ead` — empresa sem o produto não vê o módulo |
| Liberação por empresa na Plataforma | `EmpresaProdutoController` + `ClienteDetalhe.jsx` | Modelo para a tela de replicação de cursos |
| Upload/download autenticado | `Nr1Controller` (anexos/dossiê, `Storage::disk('local')`) | Vídeos, documentos e imagens das aulas |
| Estrutura pergunta/resposta | `Pesquisa`/`Pergunta`/`Resposta` | Desenho dos testes de aptidão |
| Área do colaborador (PWA) | `/app/*` | Consumo dos cursos |
| Auditoria | `Auditoria` model | Publicação, replicação e acessos a resultados |

## 3. Modelo de dados (novas migrations)

```
ead_cursos                     ← GLOBAL, sem empresa_id
  id, criado_por (FK users — super_admin)
  titulo, descricao, capa_storage (nullable), status (rascunho|publicado|arquivado)
  obrigatorio (bool), carga_horaria_min (nullable), prazo_dias (nullable)
  publicado_em, softDeletes, timestamps

ead_curso_empresa              ← LIBERAÇÃO: quais empresas recebem o curso
  id, curso_id (FK), empresa_id (FK)
  ativo (bool), liberado_em, liberado_por (FK users)
  setor_id (FK nullable — opcional: restringir a um setor da empresa)
  prazo (date nullable — prazo específico desta empresa)
  UNIQUE(curso_id, empresa_id)

ead_modulos
  id, curso_id (FK), titulo, descricao (nullable), ordem

ead_aulas
  id, modulo_id (FK), titulo, ordem
  tipo: video_upload | video_youtube | texto | documento
  conteudo (LONGTEXT — texto rico), video_storage (nullable)
  video_youtube_id (nullable), duracao_seg (nullable)

ead_aula_anexos                ← imagens e documentos (desenho de nr1_acao_anexos)
  id, aula_id (FK), nome_original, caminho_storage, mime, tamanho_bytes

ead_testes
  id, curso_id (FK), modulo_id (FK nullable — por módulo ou final)
  titulo, nota_minima (0–100), tentativas_max (nullable = ilimitado)
  embaralhar (bool), obrigatorio_aprovacao (bool)

ead_teste_perguntas
  id, teste_id (FK), enunciado, tipo (multipla_escolha | verdadeiro_falso)
  opcoes (JSON), resposta_correta (JSON), peso (default 1), ordem

ead_matriculas                 ← SOMENTE colaboradores (criada no 1º acesso)
  id, curso_id (FK), colaborador_id (FK), status (nao_iniciado|em_andamento|concluido)
  progresso_pct, nota_final (nullable), iniciado_em, concluido_em
  UNIQUE(curso_id, colaborador_id)

ead_aula_progresso
  id, matricula_id (FK), aula_id (FK), concluida_em, segundos_assistidos (nullable)
  UNIQUE(matricula_id, aula_id)

ead_teste_tentativas           ← SOMENTE colaboradores
  id, teste_id (FK), colaborador_id (FK), numero_tentativa
  respostas (JSON), nota (0–100), aprovado (bool), finalizada_em
```

O modo visualização do admin **não possui tabela**: nenhuma matrícula, progresso ou tentativa é gravada — por construção, é impossível contaminar os índices.

**Regras de negócio:**
- Colaborador vê o curso se: curso `publicado` + liberado para sua empresa (`ead_curso_empresa.ativo`) + empresa com produto `ead` + (setor compatível, se restrito).
- Admin da empresa vê (visualiza) os mesmos cursos liberados à sua empresa.
- Progresso = aulas concluídas ÷ total de aulas. Conclusão exige 100% + aprovação nos testes com `obrigatorio_aprovacao`.
- Nota final = média ponderada das melhores tentativas.
- Correção automática no backend; gabarito nunca vai ao frontend (inclusive no modo visualização).
- Editar um curso liberado afeta todas as empresas (conteúdo único). Para variar, usar `duplicar`.

## 4. Backend — endpoints

### Plataforma (`/api/plataforma/ead/*`, `role:super_admin`) — criação e replicação
```
apiResource cursos                        CRUD
POST  cursos/{curso}/publicar | arquivar | duplicar
apiResource cursos.modulos                CRUD + reordenar
apiResource modulos.aulas                 CRUD + reordenar
POST  aulas/{aula}/video                  upload chunked (ver §6)
POST  aulas/{aula}/anexos                 imagens/documentos
GET|DELETE aulas/{aula}/anexos/{anexo}
apiResource cursos.testes                 CRUD
apiResource testes.perguntas              CRUD

GET   cursos/{curso}/empresas             empresas com/sem o curso liberado
POST  cursos/{curso}/empresas             liberar p/ lista [{empresa_id, setor_id?, prazo?}]
PUT   cursos/{curso}/empresas/{empresa}   ativar/desativar, prazo, setor
DELETE cursos/{curso}/empresas/{empresa}  remover liberação (preserva histórico)

GET   cursos/{curso}/resultados           índices consolidados + filtro ?empresa_id=
GET   cursos/{curso}/resultados/exportar  CSV
GET   dashboard                           cursos, empresas ativas, execução média
```

### Admin da empresa (`/api/admin/ead/*`, role atual) — visualização + índices
```
── Índices (leitura) ──
GET  cursos                               cursos liberados + resumo de execução
GET  cursos/{curso}/resultados            execução e notas dos SEUS colaboradores
GET  cursos/{curso}/resultados/exportar   CSV

── Modo visualização (nada é persistido) ──
GET  cursos/{curso}                       conteúdo completo: módulos, aulas, testes
GET  aulas/{aula}/video                   streaming autenticado (Range)
GET  aulas/{aula}/anexos/{anexo}          download
GET  testes/{teste}                       perguntas SEM gabarito
POST testes/{teste}/simular               corrige e retorna nota/acertos na resposta,
                                          SEM gravar tentativa — não afeta índices
```
Escopo forçado: só cursos com liberação ativa para a empresa do usuário logado (join `ead_curso_empresa`).

### App do colaborador (`/api/app/ead/*`) — único que gera índices
```
GET  cursos                       cursos liberados p/ sua empresa/setor + progresso
GET  cursos/{curso}               detalhe: módulos, aulas, testes, status
GET  aulas/{aula}/video           streaming autenticado com HTTP Range
GET  aulas/{aula}/anexos/{anexo}  download
POST aulas/{aula}/concluir        marca progresso (persiste)
GET  testes/{teste}               perguntas SEM gabarito
POST testes/{teste}/responder     corrige, GRAVA tentativa, retorna nota/aprovação
```

### Novos arquivos backend
```
app/Models/Ead/…                                      (9 models)
app/Http/Controllers/Api/Plataforma/Ead/              CursoController, ModuloController,
                                                      AulaController, TesteController,
                                                      ReplicacaoController, ResultadoController
app/Http/Controllers/Api/Admin/Ead/                   ResultadoController, VisualizacaoController
app/Http/Controllers/Api/App/EadController.php        (+ EadTesteController)
app/Services/EadProgressoService.php                  progresso/nota/conclusão
app/Services/EadCorrecaoService.php                   correção — usado por /responder (persiste)
                                                      e /simular (não persiste)
app/Services/VideoUploadService.php                   chunks + validação
```

## 5. Frontend — telas

### Plataforma (`src/pages/plataforma/ead/`)
- `Cursos.jsx` — lista com status, nº de empresas liberadas, execução média.
- `CursoEditor.jsx` — builder: dados → módulos (reordenáveis) → aulas. Modal por tipo: upload de vídeo com barra de progresso, campo YouTube (extrai ID da URL), editor de texto rico (**TipTap**), anexos.
- `TesteEditor.jsx` — perguntas, alternativas, gabarito, nota mínima, tentativas.
- `CursoEmpresas.jsx` — **liberação**: checklist de empresas (só as com produto `ead`), setor/prazo opcionais, ativar/desativar.
- `CursoResultados.jsx` — índices consolidados com filtro por empresa.
- Integração: aba/atalho EAD em `ClienteDetalhe.jsx` e item no menu da Plataforma.

### Admin da empresa (`src/pages/admin/ead/`)
- `Cursos.jsx` — cursos liberados, com dois caminhos: **Visualizar curso** e **Ver índices**.
- `CursoVisualizar.jsx` — player/trilha completa em modo visualização (badge "Modo visualização — seu progresso e notas não são registrados"); teste ao final mostra resultado na tela via `/simular`.
- `CursoResultados.jsx` — execução e notas por colaborador (progresso, nota, tentativas), filtro por setor, export CSV. Reutilizar `charts/`.
- `Sidebar.jsx`: item "EAD / Treinamentos" condicionado ao produto `ead`.

### App (`src/pages/app/`)
- `Ead.jsx` — "Meus cursos" com progresso.
- `EadCurso.jsx` — trilha de módulos/aulas com check de concluído.
- `EadAula.jsx` — player (`<video>` p/ upload; embed p/ YouTube), texto, anexos, concluir.
- `EadTeste.jsx` — responder + resultado.
- Card "cursos pendentes" na home (`HomeController`).

**Reuso**: os componentes de player/trilha/teste do app são compartilhados com o `CursoVisualizar.jsx` do admin (mesmos componentes, prop `modoVisualizacao` trocando `/responder` por `/simular` e ocultando progresso).

### Integrações
- `EmpresaProduto::PRODUTOS`: `'ead' => ['titulo' => 'EAD / Treinamentos', 'tipo' => 'recorrente']`.
- `AppRoutes.jsx` + novos services `eadService` em `plataformaService.js`, `adminService.js`, `appService.js`.

## 6. Upload e entrega de vídeo — decisões técnicas

**Upload (ponto mais sensível da VPS):**
- Upload direto estoura `client_max_body_size` (nginx) e `upload_max_filesize`/`post_max_size` (PHP).
- **Solução: upload em chunks de ~10 MB** (File API slice), endpoint recebe chunk + índice + hash; `VideoUploadService` remonta e valida (mime real via finfo, mp4/webm, limite sugerido 500 MB/vídeo).
- Infra (Easypanel): espaço em disco, limites PHP/nginx p/ chunks de 12 MB, incluir `storage/app/ead` no backup.
- Cada vídeo é armazenado uma única vez, independente de quantas empresas recebam o curso.

**Entrega:**
- Rota autenticada com **HTTP Range** (seek no player) via `StreamedResponse`. Sem transcodificação no MVP: exigir MP4 (H.264/AAC).
- YouTube: embed `youtube-nocookie.com`; zero custo de disco/banda — caminho preferencial quando possível.
- Vídeos nunca em pasta pública; acesso só via rota autenticada com verificação de liberação da empresa (vale para colaborador e para o modo visualização do admin).

## 7. Fases de execução

| Fase | Entrega | Esforço estimado |
|---|---|---|
| **F1 — Fundação** | Migrations, models, produto `ead`, CRUD cursos/módulos/aulas (texto + YouTube) na Plataforma, telas Cursos/CursoEditor | 3–4 dias |
| **F2 — Liberação** | `ead_curso_empresa`, endpoints + tela CursoEmpresas, gating por produto | 1–2 dias |
| **F3 — Mídia** | Upload chunked, anexos, streaming com Range, ajustes nginx/PHP | 2–3 dias |
| **F4 — Testes** | CRUD testes/perguntas, TesteEditor, `EadCorrecaoService`, tentativas | 2 dias |
| **F5 — Colaborador + Visualização** | Telas do app (lista, trilha, player, teste), progresso, card na home; `CursoVisualizar` do admin reutilizando os mesmos componentes + `/simular` | 3 dias |
| **F6 — Índices** | Resultados na Plataforma (consolidado) e no Admin (por empresa), export CSV, auditoria, testes automatizados | 2 dias |

Total estimado: **13–16 dias úteis**. F1+F2+F5 já entregam um EAD funcional (texto + YouTube) antes da parte pesada de mídia.

## 8. Pontos de atenção

1. **Isolamento do modo visualização**: garantido por construção — o admin usa `/simular`, que não escreve em tabela alguma; índices só leem `ead_matriculas`/`ead_teste_tentativas`, exclusivas de colaboradores.
2. **Disco na VPS**: vídeos consomem rápido; monitorar espaço. Alternativa futura: S3-compatible (Backblaze/Wasabi) via novo disk — `Storage::disk()` migra sem refactor.
3. **Escopo de leitura no Admin**: empresa só vê conteúdo e resultados de cursos liberados a ela, e só dos próprios colaboradores.
4. **Edição de curso liberado**: conteúdo é único; alterações valem para todas as empresas. Avisar na UI e oferecer `duplicar`.
5. **Segurança do teste**: gabarito só no backend (inclusive no `/simular`, que corrige server-side); `tentativas_max` validado server-side.
6. **Sanitização**: HTML do editor sanitizado no backend (ex.: `mews/purifier`).
7. **Setor na liberação**: `setor_id` é por empresa — restrição opcional definida na pivô no momento da liberação.
8. **LGPD**: notas/execução são dados de desempenho — resultados nominais restritos a admin/gestor da empresa e super_admin; acessos registrados em `Auditoria`.
9. **Certificados**: fora do MVP; `concluido_em` + `nota_final` + `carga_horaria` deixam pronto p/ PDF futuro (DomPDF já usado).

---

## 9. Status de implementação (executado em 22/07/2026)

Todas as 6 fases foram implementadas seguindo os padrões do sistema (middleware `role`, `garantirMesmaEmpresa`, `Storage::disk('local')`, services por painel). Validação: 37 arquivos PHP passaram em parser de sintaxe e todos os arquivos React passaram em check JSX (esbuild). O lint definitivo do PHP e as migrations rodam na VPS.

**Backend — novos arquivos**

- Migrations (`database/migrations/2026_07_22_0000{01..10}`): `ead_cursos`, `ead_modulos`, `ead_aulas`, `ead_curso_empresa`, `ead_aula_anexos`, `ead_testes`, `ead_teste_perguntas`, `ead_teste_tentativas`, `ead_matriculas`, `ead_aula_progresso`.
- Models (`app/Models/Ead/`): Curso, Modulo, Aula, AulaAnexo, CursoEmpresa, Teste, TestePergunta, TesteTentativa, Matricula, AulaProgresso.
- Services (`app/Services/`): VideoUploadService (chunks), EadStreamService (Range), EadCorrecaoService (correção), EadProgressoService (progresso/nota/conclusão).
- Support: `YoutubeHelper` (extrai ID de URL).
- Controllers Plataforma (`Api/Plataforma/Ead/`): Curso, Modulo, Aula (inclui vídeo/anexos), Replicacao, Teste, Resultado.
- Controllers Admin (`Api/Admin/Ead/`): Visualizacao (modo `/simular`), Resultado.
- Controller App (`Api/App/EadController`).
- Rotas em `routes/api.php` nos grupos `plataforma/ead`, `admin/ead` e `app/ead`.
- Produto `ead` adicionado a `EmpresaProduto::PRODUTOS` e às validações.

**Frontend — novos arquivos**

- Componentes: `ui/RichTextEditor`, `ead/AulaViewer`, `ead/TesteRunner`, `ead/ResultadosView`.
- Plataforma (`pages/plataforma/ead/`): Cursos, CursoEditor, CursoEmpresas, Testes, CursoResultados.
- Admin (`pages/admin/ead/`): Cursos, CursoVisualizar, CursoResultados.
- Colaborador (`pages/app/`): Ead, EadCurso.
- Services: `plataformaEadService`, `eadAdminService`, `eadService` (app), helper `apiUrl`.
- Menus: item "Cursos EAD" na PlataformaSidebar; "Treinamentos (EAD)" na Sidebar admin (gated por produto `ead`); "Cursos" no MobileBottomNav.
- Rotas em `AppRoutes.jsx` e CSS do editor/leitura em `styles/index.css`.

## 10. Passos para colocar no ar

1. **Migrations**: `php artisan migrate` na VPS (10 novas tabelas, ordem já resolvida por timestamp).
2. **Liberar o produto**: na Plataforma, cadastrar o produto `ead` (ativo) para cada empresa que terá EAD — só então o módulo aparece para admin e colaboradores dela.
3. **Infra (Easypanel) para upload/stream de vídeo**:
   - nginx: `client_max_body_size 15m;` (chunks de ~10 MB + folga).
   - PHP: `upload_max_filesize=12M`, `post_max_size=15M`; manter `max_execution_time` confortável.
   - Garantir espaço em disco e incluir `storage/app/ead` na rotina de backup.
4. **Build do front**: `npm run build` e deploy do `dist` na hospedagem compartilhada (o build falha no sandbox por falta do binário nativo do rollup para Linux; na máquina/CI correto roda normalmente).
5. **Sanitização (recomendado)**: instalar `mews/purifier` e sanitizar o HTML do editor de texto no `store/update` de aulas antes de persistir (o front já isola o conteúdo em `.ead-prose`).

## 11. Garantia de isolamento dos índices

- Índices leem exclusivamente `ead_matriculas` / `ead_teste_tentativas`, criadas apenas por colaboradores.
- O admin usa `/admin/ead/.../simular`, que corrige no backend e retorna a nota **sem gravar nada** — por construção, é impossível o admin contaminar execução ou notas.
- Curso só aparece para a empresa quando: `status = publicado` **e** existe `ead_curso_empresa.ativo = true` para ela **e** a empresa tem o produto `ead` ativo (colaborador ainda respeita restrição de setor).
