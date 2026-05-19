# Radar Pessoas - Analise Estrategica & Plano de Melhorias

Documento de acompanhamento para evolucao B2B SaaS.

Data da analise original: 2026-05-18  
Ultima atualizacao: 2026-05-19  
Versao do sistema: 1.0.0-beta

---

## 1. Sumario Executivo

O Radar Pessoas segue com uma base funcional forte para um MVP B2B: PWA do colaborador, dashboard administrativo, API de plataforma super-admin, multi-tenant por `empresa_id`, pesquisas, check-ins, canal de escuta, mapa de riscos, relatorios com IA/PDF e modulo NR-1.

Desde a analise inicial, foram implementadas melhorias importantes em tres frentes:

- Fluxo operacional de cadastro: importacao unificada de colaboradores, setor e unidade/area em um unico CSV.
- Seguranca e governanca: politicas de autorizacao, isolamento multiempresa, trilha de auditoria e convite seguro para colaborador criar senha.
- Qualidade tecnica: testes automatizados de fluxos criticos com Pest/PHPUnit.

Veredito atualizado: o produto esta mais consistente para operacao assistida e pilotos comerciais. Ainda faltam itens estruturais para venda SaaS recorrente em escala, principalmente billing, onboarding self-service, UI da plataforma super-admin, LGPD operacional completa, notificacoes de engajamento e modulo NR-1/PGR formal regulatorio.

---

## 2. Status Atual por Capacidade

| Capacidade | Estado atualizado | Prioridade |
|---|---:|---:|
| Coleta de dados: check-in, pesquisa, escuta | Pronto | - |
| Dashboard analitico e mapa de riscos | Pronto | - |
| Relatorios com IA + PDF | Pronto | - |
| Envio de relatorio por e-mail | Implementado | - |
| Multi-tenant + super-admin API | Pronto | - |
| UI super-admin para Sara Linhar | Pronto | - |
| Importacao unica de colaboradores/setores/unidades | Implementado | - |
| Convite de colaborador por e-mail | Implementado | - |
| Politicas de autorizacao por tenant | Implementado | - |
| Audit log administrativo visivel | Implementado parcial | Alta |
| Testes automatizados de fluxos criticos | Implementado inicial | Alta |
| Billing / cobranca recorrente | Ausente | Critica |
| Onboarding self-service | Parcial (backend + cadastro publico) | Critica |
| NR-1/PGR formal - Onda 1 (versionamento, alerta, PDF) | Implementado | - |
| NR-1/PGR - Onda 2 (evidencias, historico de versoes) | Implementado | - |
| NR-1/PGR - Onda 3.A (cronograma Gantt) | Implementado | - |
| NR-1/PGR - Onda 3.B (XML e-Social S-2240) | Mapeado como melhoria futura | Media |
| Notificacoes push/e-mail de engajamento | Ausente | Alta |
| Integracoes SSO/HRIS/Slack/Teams | Ausente | Alta |
| LGPD operacional completa | Parcial | Alta |
| Site institucional / pricing publico | Ausente | Critica |

---

## 3. Ajustes Implementados

### 3.1 Importacao unificada da estrutura da empresa

Foi simplificado o fluxo de importacao em colaboradores/admin:

Arquivo unico aceito:

```csv
nome;email;cpf;cargo;unidade;setor;data_admissao
```

Tambem sao aceitos aliases para unidade:

- `area`
- `unidade_area`

Comportamento atual:

- cria colaboradores em lote;
- cria setores automaticamente quando nao existem;
- diferencia setores por `empresa_id + unidade + nome`;
- exige setor na importacao;
- aceita datas em `d/m/Y`, `Y-m-d` e `d-m-Y`;
- nao redefine senha de colaborador existente;
- template/exportacao CSV agora incluem `unidade`;
- retorno da importacao informa `setores_criados`;
- frontend recarrega a lista de setores apos importacao.

Impacto: remove a necessidade de importar/criar setores manualmente antes de importar colaboradores.

### 3.2 Convite de colaborador por e-mail

Foi implementado o fluxo para o colaborador definir a propria senha:

- campos adicionados em `colaboradores`:
  - `convite_token`
  - `convite_expira_em`
  - `convite_aceito_em`
- endpoint admin para envio de convite;
- e-mail `ColaboradorConviteMail`;
- tela publica `/convite/:token`;
- endpoints publicos para validar e aceitar convite;
- login do colaborador funciona apos aceite;
- acao registrada em auditoria.

Impacto: reduz risco operacional de senha criada pelo admin e melhora onboarding do colaborador.

### 3.3 Relatorios por e-mail

Foi implementado envio de relatorio pronto por e-mail:

- `RelatorioMail` com PDF anexado;
- view de e-mail;
- envio enfileirado via `Mail::queue`;
- auditoria em `relatorio.enviar_email`;
- teste automatizado cobrindo envio e log.

### 3.4 Politicas de autorizacao e isolamento multiempresa

Foram adicionadas politicas para:

- `RelatorioPolicy`
- `PesquisaPolicy`

Tambem foi corrigido o controller base para expor `AuthorizesRequests`, habilitando corretamente `$this->authorize()`.

Foram reforcadas validacoes multiempresa:

- pesquisa so aceita `setor_id` da propria empresa;
- resposta publica NR-1 so aceita setor da empresa da avaliacao;
- endpoints sensiveis de relatorio e pesquisa usam policy;
- middleware de papel foi ajustado para funcionar corretamente com tokens Sanctum em testes.

### 3.5 Trilha de auditoria

Foi criada a tabela/model/helper de auditoria:

- migration `auditorias`;
- model `Auditoria`;
- helper `AuditLogger`;
- exibicao inicial na tela de Configuracoes.

Acoes ja registradas:

- configuracoes.atualizar
- colaborador.criar
- colaborador.atualizar
- colaborador.excluir
- colaborador.convite
- colaboradores.importar
- pesquisa.criar
- pesquisa.atualizar
- pesquisa.excluir
- pesquisa.publicar
- pesquisa.encerrar
- pesquisa.duplicar
- relatorio.gerar
- relatorio.exportar_pdf
- relatorio.enviar_email
- nr1.criar
- nr1.publicar
- nr1.encerrar
- nr1.exportar_pdf
- nr1.excluir

Impacto: melhora rastreabilidade administrativa, base para LGPD, compliance e suporte.

### 3.6 NR-1

O modulo NR-1 ja possui:

- avaliacao admin;
- publicacao;
- formulario publico por codigo;
- resposta anonima com 35 itens;
- calculo de score geral, por secao e itens criticos;
- PDF;
- auditoria nas principais acoes admin.

Foi corrigida a validacao publica para impedir uso de setor de outra empresa.

Pendencia: transformar o PDF/saida em um PGR regulatorio completo com inventario, plano de acao, evidencias, responsaveis, versionamento e rastreio de reavaliacao.

### 3.7 NR-1 / PGR formal - Onda 1 (2026-05-19)

Foi implementada a primeira onda do PGR regulatorio:

**Reavaliacao versionada**

- migration `add_versao_origem_to_nr1_avaliacoes_table` adicionando `versao_origem_id` (self-FK);
- model `Nr1Avaliacao` com relacionamentos `versaoOrigem()` e `novasVersoes()`;
- endpoint `POST /admin/nr1/{nr1}/duplicar` cria nova versao em rascunho:
  - incrementa o major da versao (1.0 -> 2.0 -> 3.0);
  - preserva titulo, observacoes e empresa;
  - gera novo codigo publico;
  - registra `versao_origem_id` para rastrear linhagem;
  - audit log `nr1.duplicar`;
- frontend: botao "Copy" (laranja) na lista NR-1 para status ativa/encerrada;
- badge de versao visivel na lista, com referencia a versao anterior quando aplicavel.

**Alerta de PGR no Dashboard**

- `DashboardController` agora consulta avaliacoes com `proxima_avaliacao_em` ate 30 dias;
- gera alerta `critico` se vencido, `atencao` se proximo;
- alertas com `link` ficam clicaveis no Dashboard (navegacao para `/admin/nr1`).

**PDF regulatorio reformulado** (`backend/resources/views/pdf/nr1.blade.php`)

- capa institucional com blocos de informacao destacados;
- sumario numerado;
- secao 1 — Identificacao da Empresa e do Documento com razao social, CNPJ, total de colaboradores e setores, vigencia, caixa amarela quando e reavaliacao de versao anterior;
- secao 2 — Metodologia e Base Normativa (4 paragrafos: base legal, instrumento ISO 45003, escala S/P/N, LGPD, criterio de criticidade);
- secao 3 — Indicadores Gerais (com indicador de filtros aplicados);
- secao 4 — Avaliacao por dimensao;
- secao 5 — Inventario de Riscos (quando existem itens criticos);
- secao 6 — Plano de Acao (quando existem acoes cadastradas);
- secao final — Aprovacao e Vigencia com assinaturas formatadas e bloco azul de vigencia;
- secoes renumeradas dinamicamente conforme presenca de inventario/plano.

**Testes adicionados**

- duplicacao cria v2.0 em rascunho com auditoria;
- duplicacao bloqueada cross-tenant (403).

Suite total: 11 testes, 74 asserções, todos passando.

Pendencia operacional: rodar `php artisan migrate` no ambiente para aplicar a migration nova.

### 3.8 NR-1 / PGR - Onda 2: Evidencias + Historico de Versoes (2026-05-19)

Implementada a segunda onda do PGR regulatorio:

**Evidencias / Anexos por acao**

- migration `create_nr1_acao_anexos_table` com `acao_id`, `nome_original`, `caminho_storage`, `tamanho_bytes`, `mime_type`, `descricao`, `enviado_por`;
- model `Nr1AcaoAnexo` + relacionamento `anexos()` em `Nr1PlanoAcao`;
- 4 endpoints: listar, upload (10 MB, PDF/imagem/Office), download, remover;
- audit log `nr1.acao.anexo_upload` e `nr1.acao.anexo_excluir`;
- `excluirAcao` agora limpa arquivos fisicos antes do soft-delete;
- componente `AnexosAcao` em `Nr1Resultados.jsx`: collapse com lista + botao "Anexar evidencia" injetado em cada card de acao;
- PDF regulatorio ganhou coluna "Evidencias" com contagem + linha extra listando nomes/tamanhos dos anexos.

**Historico de versoes**

- endpoint `GET /admin/nr1/{nr1}/historico` retorna cadeia completa de versoes (subindo via `versao_origem_id` e descendo via `novasVersoes()`);
- cada versao inclui score geral + score por dimensao + total de respondentes;
- nova aba "Historico" em `Nr1Resultados.jsx`:
  - linha do tempo das versoes com badge ATUAL, status, respondentes e score colorido por nivel;
  - BarChart Recharts comparativo de score por dimensao entre versoes (paleta com 5 cores).

**Testes adicionados**

- upload/lista/download/exclusao de anexo (com `Storage::fake`);
- bloqueio cross-tenant para upload (403);
- historico retorna cadeia v1.0 + v2.0 com scores.

Suite total: 14 testes, 91 asserções, todos passando.

Pendencia operacional: rodar `php artisan migrate` para a tabela `nr1_acao_anexos`.

### 3.9 NR-1 / PGR - Onda 3.A: Cronograma Gantt (2026-05-19)

Implementada visualizacao temporal do plano de acao:

- nova aba "Cronograma" em `Nr1Resultados.jsx`;
- componente `GanttCronograma` em SVG/HTML puro (sem dependencia nova);
- regua de meses calculada dinamicamente entre o `created_at` mais antigo e a maior `data_prevista`/`data_conclusao`;
- cada acao vira uma barra horizontal posicionada percentualmente;
- cores por status (planejada, em_andamento, concluida, cancelada);
- linha vertical "hoje" em laranja para indicador temporal;
- destaque de acoes atrasadas com ring vermelho e flag "atrasada";
- filtros por status e por responsavel;
- legenda inferior + tooltip com detalhes ao passar o mouse na barra.

A aba carrega automaticamente o plano de acao (mesma chamada usada na aba Plano).

### 3.10 NR-1 / PGR - Onda 3.B mapeada (e-Social S-2240)

Decidido adiar a geracao do XML regulatorio S-2240 do e-Social ate ter:

1. Um cliente real querendo enviar para validar layout no certificador oficial.
2. Acesso a documentacao mais recente do leiaute do e-Social.
3. Mapping correto entre dimensoes psicossociais NR-1 e codigos oficiais de fatores de risco.

Sem isso, gastariamos esforco em XML potencialmente errado sem validacao real.

Permanece no backlog como melhoria futura de prioridade media.

### 3.11 Comando de seed de respostas NR-1 (2026-05-19)

Criado Artisan command `nr1:seed-respostas` para simular respondentes anonimos:

- argumentos: codigo publico + `--respondentes` (qtd) + `--perfil` (otimo, variado, atencao, critico);
- distribuicao probabilistica S/P/N por secao parametrizada por perfil;
- demografia (sexo, faixa etaria, setor) sorteada;
- util para demos, testes manuais e validacao do historico/cronograma.

Exemplo:

```bash
php artisan nr1:seed-respostas BJF2CLEWSX --respondentes=18 --perfil=variado
```

### 3.12 Testes automatizados

Foi configurada a base de testes:

- `phpunit.xml.dist`
- `tests/TestCase.php`
- `tests/Pest.php`
- helpers em `tests/Feature/Support/TestModels.php`
- SQLite em memoria;
- fila e e-mail em modo de teste.

Testes adicionados:

- convite de colaborador;
- importacao de colaboradores com criacao de setores por unidade;
- auditoria de configuracoes;
- fluxo de pesquisa: criar, publicar, duplicar;
- bloqueio de setor de outra empresa em pesquisa;
- envio de relatorio por e-mail;
- fluxo NR-1: publicar, responder publico e calcular resultado;
- bloqueio de setor de outra empresa em resposta NR-1.

Ultima verificacao:

```bash
php artisan test
```

Resultado:

```text
9 passed (67 assertions)
```

---

## 4. Backlog Atualizado

### P0 - Necessario para vender

1. ~~UI da Plataforma super-admin para Sara Linhar.~~ (Implementado)
2. Site institucional + pagina de pricing.
3. Onboarding self-service de empresa (wizard completo: empresa -> importacao -> convites -> setup).
4. Modulo NR-1/PGR formal regulatorio:
   - ~~Onda 1: reavaliacao versionada + alerta no Dashboard + PDF regulatorio reformulado.~~ (Implementado em 2026-05-19)
   - ~~Onda 2: evidencias/anexos por acao + historico de versoes (comparativo v1.0 -> v2.0).~~ (Implementado em 2026-05-19)
   - ~~Onda 3.A: cronograma Gantt do plano de acao.~~ (Implementado em 2026-05-19)
   - Onda 3.B: geracao XML e-Social S-2240 (adiada para quando houver cliente real e acesso a documentacao oficial).
5. Integracao de pagamento: Asaas/Pagar.me e/ou Stripe.

Concluido desde a analise inicial:

- Importacao unica de estrutura/colaboradores.
- Convite de colaborador por e-mail.
- Relatorio por e-mail com PDF.
- Politicas iniciais de autorizacao.
- Auditoria administrativa inicial.
- Testes automatizados de fluxos criticos.
- NR-1/PGR Onda 1: versionamento, alerta de vencimento, PDF regulatorio reformulado.
- NR-1/PGR Onda 2: evidencias/anexos por acao + historico de versoes com comparativo de scores.
- NR-1/PGR Onda 3.A: cronograma Gantt do plano de acao com filtros e indicador "hoje".
- Comando Artisan `nr1:seed-respostas` para simulacao de respondentes em demos.

### P1 - Necessario para escalar

1. Push notifications com Firebase Cloud Messaging.
2. E-mail digest semanal para colaborador e admin.
3. SSO Google Workspace e Microsoft 365/Azure AD.
4. LGPD operacional completa:
   - politica publica;
   - consentimento no primeiro login;
   - exclusao/anonimizacao de conta;
   - RIPD;
   - DPO em contrato;
   - revisao de cache/service worker.
5. Health score interno por empresa-cliente.
6. 2FA para admins.
7. Webhooks Slack/Teams.
8. Ampliar cobertura de testes para app do colaborador, check-ins, escuta, riscos e auth.

### P2 - Diferencial competitivo

1. EAP integrado.
2. Conteudo psicoeducativo no app.
3. Analise de sentimento das respostas abertas.
4. Benchmark setorial anonimo.
5. Predicao de turnover/burnout.
6. Integracoes HRIS: TOTVS, Senior, ADP, Gupy, Pontomais.
7. White-label.
8. Acessibilidade WCAG 2.1 AA.

---

## 5. Riscos e Dividas Tecnicas Atualizados

| Risco / divida | Status atualizado | Proxima acao |
|---|---:|---|
| Sem testes automatizados | Mitigado parcialmente | Expandir cobertura para app, riscos, escuta e auth |
| Sem CI/CD | Pendente | GitHub Actions com lint/test/build |
| Billing ausente | Pendente | Definir gateway e modelagem de assinatura |
| UI super-admin ausente | Implementado | - |
| Onboarding self-service ausente | Pendente | Wizard empresa + importacao + convites |
| NR-1 ainda nao e PGR formal | Implementado (Ondas 1, 2 e 3.A) | Onda 3.B (e-Social) aguardando cliente real |
| LGPD operacional incompleta | Pendente | Consentimento, politica, exclusao e RIPD |
| Notificacoes de engajamento ausentes | Pendente | FCM + e-mails agendados |
| Audit log ainda inicial | Parcial | Filtros, exportacao e cobertura em mais acoes |
| Backup automatico nao declarado | Pendente | Rotina diaria MySQL + retencao |
| Service worker nao auditado para dados sensiveis | Pendente | Excluir rotas sensiveis de cache |

---

## 6. Roadmap Recomendado

### Sprint 1 - Base comercial e plataforma

- ~~Criar UI super-admin.~~ (Implementado)
- Criar site institucional/pricing.
- Definir fluxo de onboarding self-service.
- Modelar billing e status de assinatura.

### Sprint 2 - Compliance NR-1 vendavel

- ~~Reavaliacao versionada (v1.0 -> v2.0).~~ (Implementado)
- ~~Alerta de PGR vencido no Dashboard.~~ (Implementado)
- ~~PDF regulatorio reformulado com capa, sumario, metodologia, identificacao, assinaturas.~~ (Implementado)
- ~~Anexar evidencias por acao do plano (upload de PDF/foto/Office).~~ (Implementado)
- ~~Historico de versoes com comparativo de scores entre v1.0 -> v2.0.~~ (Implementado)
- ~~Cronograma Gantt do plano de acao com filtros e indicador "hoje".~~ (Implementado)
- Onda 3.B (futuro): geracao XML formato e-Social S-2240 quando houver cliente real para validar.

### Sprint 3 - Engajamento e LGPD

- Push/e-mail de lembrete.
- Consentimento no primeiro login.
- Politica de privacidade.
- Exclusao/anonimizacao de conta.
- 2FA admin.

### Sprint 4 - Escala operacional

- CI/CD.
- Health score interno.
- Filtros e exportacao da auditoria.
- SSO Google/Microsoft.
- Webhooks Slack/Teams.

---

## 7. Proximos Passos Imediatos

1. ~~Implementar UI da Plataforma super-admin.~~ (Implementado)
2. ~~NR-1/PGR Onda 1: versionamento + alerta + PDF reformulado.~~ (Implementado em 2026-05-19)
3. ~~NR-1/PGR Onda 2: evidencias/anexos + historico de versoes.~~ (Implementado em 2026-05-19)
4. ~~NR-1/PGR Onda 3.A: cronograma Gantt do plano de acao.~~ (Implementado em 2026-05-19)
5. Site institucional + pagina de pricing publica.
6. Onboarding self-service: wizard completo (empresa -> importacao -> convites -> setup).
7. Definir gateway de pagamento e modelagem de assinaturas (Asaas/Pagar.me/Stripe).
8. Criar CI/CD com `php artisan test` e `npm run build` no GitHub Actions.
9. Expandir testes para check-ins, escuta, app do colaborador e riscos.
10. Iniciar LGPD operacional: consentimento, politica, exclusao/anonimizacao e RIPD.
11. NR-1/PGR Onda 3.B (futuro): XML e-Social S-2240 quando houver cliente real para validar layout.

---

Documento atualizado a partir dos ajustes implementados no projeto em `d:/PROJETO RADAR PESSOAS/` em 2026-05-19.
