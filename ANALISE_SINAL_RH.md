# Análise Técnica e de Produto — Sinal RH

> **Documento de diagnóstico** · Sara Linhar Consultoria
> Elaborado em 22/06/2026 · Análise exploratória (nenhum arquivo foi alterado)
> Escopo: leitura, investigação e documentação do estado atual do sistema

---

## 0. Sumário executivo

O **Sinal RH** é uma plataforma SaaS de gestão de pessoas e saúde organizacional construída para a **Sara Linhar Consultoria**, com foco central em **diagnóstico de riscos psicossociais e conformidade com a NR-1 (PGR)**. O sistema combina um questionário psicossocial estruturado, motor de cálculo de scores, geração de relatórios e planos de ação com apoio de IA, e um conjunto de ferramentas auxiliares de clima (pesquisas, check-in semanal, canal de escuta, comunicados).

A arquitetura é **moderna e bem separada**: frontend PWA em React/Vite e backend API em Laravel 11, com modelo multi-tenant de três níveis (plataforma da consultoria → empresa cliente → empregado). O domínio de NR-1 é a parte mais madura e cuidadosamente construída, inclusive com travas de anonimato voltadas à LGPD e um dossiê documental para auditoria.

O sistema está **funcional e comercializável em sua essência**, mas carrega marcas de evolução rápida: rebranding incompleto ("Radar Pessoas" → "Sinal RH"), dependências declaradas e não usadas, arquivos legados, ausência de testes no frontend e alguns pontos de segurança e consistência a endereçar antes de escalar.

**Avaliação geral por dimensão:**

| Dimensão | Estado | Comentário |
|---|---|---|
| Arquitetura técnica | 🟢 Boa | Stack moderna, separação clara, multi-tenant coerente |
| Domínio NR-1 / regras de negócio | 🟢 Forte | Motor de score sólido, anonimato, dossiê de auditoria |
| Banco de dados / modelagem | 🟢 Boa | Bem normalizado, índices, soft deletes, LGPD-aware |
| Segurança | 🟡 Atenção | Token em localStorage, abilities ok, revisar exposição |
| Qualidade / manutenção | 🟡 Atenção | Sem testes frontend, código legado, rebranding parcial |
| Produto / UX | 🟢 Boa | Jornada coerente; oportunidades de polimento e onboarding |

---

## 1. Visão geral do sistema

### 1.1 Objetivo principal

O Sinal RH é uma **solução de diagnóstico organizacional e gestão de saúde psicossocial** que instrumentaliza a consultoria da Sara Linhar para atender empresas clientes em quatro frentes:

1. **Conformidade legal (NR-1 / PGR)** — aplicar avaliações de riscos psicossociais, calcular níveis de risco, gerar relatórios técnicos, planos de ação e um dossiê documental apto a auditoria do Ministério do Trabalho.
2. **Diagnóstico de clima e cultura** — pesquisas (clima, pulse, NPS, 360, cultura) e check-ins semanais de humor/engajamento.
3. **Escuta ativa** — canal de denúncias/relatos (anônimo ou identificado) com triagem, priorização e tratativa.
4. **Comunicação e gestão** — comunicados internos, dashboards e relatórios executivos.

### 1.2 Problemas de RH que resolve

- **Risco de não conformidade com a NR-1** (obrigatória desde a atualização que inclui riscos psicossociais no PGR), com geração de evidência documental.
- **Falta de visibilidade sobre clima e riscos** por setor, gênero e faixa etária.
- **Subjetividade no diagnóstico** — substitui percepção informal por escala Likert padronizada e scores comparáveis.
- **Esforço manual de consultoria** — automatiza relatórios e planos de ação com IA, escalando o atendimento da consultoria a mais clientes.
- **Canais frágeis de denúncia** — oferece escuta estruturada com anonimato real.

### 1.3 Módulos / áreas funcionais

| Módulo | Público | Maturidade | Descrição |
|---|---|---|---|
| **NR-1 / PGR** | Admin empresa + público | 🟢 Alta | Núcleo: avaliações, score, IA, plano de ação, dossiê, PDF, versionamento |
| **Pesquisas / Clima** | Admin + colaborador | 🟢 Média-alta | Clima, pulse, NPS, 360, cultura; perguntas Likert/múltipla/texto |
| **Check-in semanal** | Colaborador + admin | 🟢 Média | Pulso recorrente de humor/engajamento |
| **Canal de Escuta** | Colaborador + admin | 🟢 Média | Relatos anônimos/identificados com triagem |
| **Mapa de Riscos** | Admin | 🟡 Média | Riscos psicossociais por setor (clima-based, com IA) |
| **Relatórios Executivos** | Admin | 🟢 Média | Geração com IA, PDF, envio por e-mail |
| **Comunicados** | Admin + colaborador | 🟢 Média | Comunicação interna com confirmação de leitura |
| **Plataforma (super admin)** | Consultoria | 🟢 Média | Gestão de clientes, produtos contratados, billing Asaas |
| **Feedback 360 / PDI** | Admin | 🔴 Placeholder | Telas "Em Breve" |

### 1.4 Conexão com consultoria, NR-1 e gestão de pessoas

O sistema é desenhado como **ferramenta de uma consultoria que revende serviços** — não como SaaS self-service puro (o auto-cadastro de empresas foi inclusive removido, conforme histórico git). A camada **Plataforma** representa a Sara Linhar gerenciando seus clientes e os **produtos contratados** (`diagnostico_nr1`, `plano_acao_nr1`, `canal_escuta`), com cobrança via Asaas. A NR-1 é o produto âncora, e os demais módulos sustentam o relacionamento contínuo e o upsell.

---

## 2. Arquitetura técnica

### 2.1 Stack

**Frontend** (`/src`, raiz do projeto)
- React 18.3 + Vite 5 (build/dev)
- React Router DOM 6 (roteamento SPA)
- Tailwind CSS 3.4 + PostCSS
- Axios (HTTP), Recharts (gráficos), Lucide React (ícones)
- PWA via `vite-plugin-pwa` + Workbox (instalável, mobile-first para o app do colaborador)

**Backend** (`/backend`)
- Laravel 11 / PHP 8.2
- Laravel Sanctum 4 (autenticação por token + **abilities** para controle de papéis)
- `barryvdh/laravel-dompdf` (geração de PDFs — relatórios e dossiês NR-1)
- `openai-php/laravel` (relatórios e planos de ação com IA)
- `league/csv` (import/export de colaboradores), `intervention/image` (logos)
- `spatie/laravel-permission` e `spatie/laravel-query-builder` — **declarados no composer mas não utilizados no código** (ver §7)

**Infraestrutura / serviços**
- Banco: **MySQL** (produção) / SQLite (testes em CI)
- Cache e filas: **Redis** (`CACHE_DRIVER=redis`, `QUEUE_CONNECTION=redis`)
- E-mail: SMTP (Mailpit em dev)
- Armazenamento: disco local (anexos/dossiês), com suporte opcional a **AWS S3** (sa-east-1)
- Gateway de cobrança: **Asaas** (com kill switch `ASAAS_ENABLED`)
- CI: GitHub Actions (Pest no backend + build Vite no frontend)

### 2.2 Estrutura de pastas

```
PROJETO SINAL RH/
├── src/                      # Frontend React
│   ├── components/           # charts, layout, ui (design system próprio)
│   ├── contexts/             # AuthContext (estado de auth)
│   ├── constants/            # checklistSections.js (questionário NR-1)
│   ├── data/                 # mocks legados (NÃO importados — ver §7)
│   ├── pages/                # admin/ app/ auth/ nr1/ plataforma/ site/
│   ├── routes/AppRoutes.jsx  # rotas SPA
│   ├── services/             # api.js + *Service.js (camada de acesso à API)
│   └── utils/formatters.js
├── backend/                  # API Laravel 11
│   ├── app/
│   │   ├── Http/Controllers/Api/  # Admin/ App/ Plataforma/ + Auth, Cadastro, Webhook
│   │   ├── Http/Middleware/EnsureRoleMiddleware.php
│   │   ├── Models/           # 21 models
│   │   └── Services/         # Nr1ScoreService, *IAService, AsaasService, Nr1DossieService
│   ├── database/migrations/  # ~33 migrations
│   ├── routes/api.php        # todas as rotas da API
│   └── tests/                # Pest (Feature + Unit)
├── public/                   # assets e ícones PWA
├── imagens/                  # logos e identidade
├── DOCUMENTACAO.md           # documentação extensa existente
├── ANALISE-E-MELHORIAS.md    # análise anterior
├── prompt_agente_nr1_*.txt   # prompt de IA do agente NR-1
└── backend.zip               # artefato (não versionado, bloat — ver §7)
```

A organização de `pages` por público (admin/app/plataforma/auth/nr1/site) é clara e espelha a separação de papéis. O backend segue o padrão Laravel idiomático com controllers agrupados por área e lógica de domínio extraída para **Services** — boa prática.

### 2.3 Arquivos de configuração principais

- `vite.config.js`, `tailwind.config.js`, `postcss.config.js` — build/estilo frontend
- `package.json` — scripts `dev`/`build`/`preview`
- `backend/composer.json` — dependências e scripts artisan
- `backend/.env.example` — template de ambiente (o `.env` real **não está versionado** ✅)
- `backend/bootstrap/app.php` — bootstrap Laravel 11, registro do alias de middleware `role`
- `backend/config/cors.php`, `config/auth.php`, `config/permission.php` — segurança e guards
- `.github/workflows/` — pipeline CI

### 2.4 Como o sistema é iniciado e mantido

**Frontend:** `npm install` → `npm run dev` (Vite, porta 5173) / `npm run build` (gera `dist/`).

**Backend:** `composer install` → copiar `.env` → `php artisan key:generate` → `php artisan migrate --seed` → servir (`php artisan serve` / php-fpm). A API expõe `/api/ping` para healthcheck e `/up` (health nativo Laravel 11).

**Comunicação front↔back:** `src/services/api.js` cria instância Axios com baseURL `http://localhost:8000/api` (dev) ou `https://sinalrh.saralinhar.com.br/api` (prod). Token Bearer injetado via interceptor; em `401` limpa storage e redireciona para `/login`.

---

## 3. Fluxos principais

### 3.1 Três níveis de acesso (multi-tenant)

1. **Plataforma / Super Admin (`super_admin`)** — equipe Sara Linhar. Gerencia empresas-clientes, produtos contratados e billing.
2. **Administração da empresa (`admin`, `gestor`, `consultor`)** — RH/gestão do cliente. Opera diagnósticos, pesquisas, riscos, relatórios.
3. **Colaborador / Empregado (`colaborador`)** — usa o PWA mobile para responder pesquisas, check-ins, ler comunicados e abrir relatos.

> Observação de modelagem: **colaboradores são uma entidade separada de `users`** (model `Colaborador`, tabela própria, guard próprio), enquanto admins/gestores/consultores/super_admin vivem em `users` (coluna `perfil`). São dois universos de autenticação distintos sob Sanctum.

### 3.2 Fluxo NR-1 (núcleo do produto)

```
Admin cria avaliação (rascunho) → gera código público de 12 chars
   → publica (status: ativa, define expiração)
   → empregados acessam /avaliacao/nr1/{codigo} SEM login (anônimo)
       → informam apenas setor, sexo, faixa etária (sem PII — LGPD)
       → respondem 10 seções × 4 itens em escala Likert 1–5
   → admin encerra → Nr1ScoreService calcula scores
   → gera relatório com IA (OpenAI) → plano de ação por risco
   → aprovação formal (responsável + cargo + data)
   → PDF + dossiê documental versionado para auditoria
   → versionamento (duplicar para próxima avaliação)
```

### 3.3 Fluxo de pesquisa de clima

Admin cria pesquisa → adiciona perguntas (Likert/múltipla/sim-não/NPS/texto) → publica → colaboradores respondem no app → admin vê resultados/exporta. Respostas têm **constraint de unicidade** (`pergunta_id` + `colaborador_id`) impedindo duplicidade, e `ip_hash` para auditoria sem expor IP.

### 3.4 Fluxo do colaborador (PWA)

Login (e-mail/código de acesso ou convite por token) → Home → Check-in semanal → Pesquisas pendentes → Comunicados (confirma leitura) → Canal de escuta → Perfil.

### 3.5 Autenticação e permissões

- **Sanctum com token abilities**: no login o token recebe abilities como `role:admin`, `role:colaborador`, `role:super_admin`.
- **`EnsureRoleMiddleware`** (alias `role`) verifica `token->can("role:{$role}")` — controle de acesso real do sistema (não usa Spatie apesar da dependência declarada).
- Convite de colaborador por **token com expiração**; código de acesso de 8 chars gerado automaticamente.

### 3.6 Fluxos administrativos da plataforma

Super admin: dashboard consolidado → CRUD de empresas → gestão de produtos contratados (pontual ou recorrente mensal) → sincronização com Asaas → webhooks de cobrança (idempotentes).

---

## 4. Regras de negócio

### 4.1 Motor de cálculo NR-1 (`Nr1ScoreService`) — o coração do sistema

- **Questionário**: 10 seções temáticas × 4 itens cada (40 itens), escala Likert 1–5. As seções: Demandas de Trabalho, Controle e Autonomia, Clareza de Papel, Relacionamentos e Justiça, Reconhecimento e Recompensa, Suporte e Segurança Psicológica, Condições Organizacionais e Comunicação, Gestão de Mudanças, Segurança e Situações Críticas, Integração e Trabalho Remoto. (Definido tanto no frontend `checklistSections.js` quanto nos labels do service.)
- **Mapeamento S/P/N**: Satisfatório (notas 4–5), Parcial/Neutro (3), Negativo (1–2).
- **Score normalizado 0–100**: `(media_likert − 1) / 4 × 100`.
- **Itens críticos**: itens com **≥ 30% de respostas negativas** (1–2) são sinalizados e ordenados por gravidade (top 10).
- **Trava de anonimato (LGPD)**: ao filtrar por setor/sexo/faixa etária, se houver **menos de 5 respondentes** os dados sensíveis são ocultados (`amostra_insuficiente`). Aplicada também na coleta de contexto para a IA.
- Segmentação possível por **setor, sexo e faixa etária** (4 faixas: <18, 19–34, 35–44, 45+).

### 4.2 Conformidade e auditoria (PGR)

- Avaliações têm **versão, próxima avaliação, aprovação formal** (aprovado_por/cargo/em), suportando o ciclo de melhoria contínua exigido pela NR-1.
- **Dossiê documental** (`Nr1DossieService` + `nr1_dossie_arquivos`): árvore de pastas, subpastas mensais, upload, download e exportação em ZIP — evidência para fiscalização.
- **Plano de ação** (`nr1_plano_acoes`): risco → ação → responsável → prazo → status (planejada/em andamento/concluída/cancelada) → prioridade, com anexos.
- **Auditoria** (`auditorias`): trilha de alterações (ex.: configurações).
- Código público de acesso (12 chars) + expiração controlam a janela de coleta.

### 4.3 Regras de IA

- `Nr1RelatorioIAService` e `RelatorioIAService` montam contexto a partir dos scores (respeitando a trava de ≥5 respondentes) e chamam a OpenAI para gerar **relatório executivo** e **plano de ação** estruturados em JSON normalizado, com status (`gerando`/`pronto`/`erro`) e tratamento de falha logado.
- O `prompt_agente_nr1_riscos_psicossociais.txt` (raiz) documenta o agente especialista que orienta a geração.

### 4.4 Regras de clima / escuta / comunicados

- Pesquisas: anônimas por padrão; unicidade de resposta por colaborador/pergunta; tipos e dimensões configuráveis.
- Escuta: modo anônimo/identificado, categorização, prioridade (baixa→crítica), status de tratativa, nota interna e responsável.
- Comunicados: tipos (info/alerta/urgente), publicação, expiração e **confirmação de leitura** via pivot.

### 4.5 Regras comerciais (billing)

- `empresa_produtos`: produtos pontuais ou recorrentes mensais, valor por colaborador ou mensal, ciclo, próxima cobrança, status (inclui `inadimplente`).
- Limites de colaboradores por empresa (`max_colaboradores`); integração Asaas com **kill switch** e webhooks idempotentes (tabela `asaas_eventos`).

---

## 5. Banco de dados e modelos

### 5.1 Entidades principais

| Entidade | Função | Campos sensíveis / críticos |
|---|---|---|
| `empresas` | Tenant cliente | CNPJ (único), configuracoes (JSON), dados Asaas |
| `users` | Admin/gestor/consultor/super_admin | password (hashed), perfil, empresa_id |
| `colaboradores` | Empregados (PWA) | **CPF, e-mail, codigo_acesso, password, token_fcm, convite_token** (CPF/token ocultos no model) |
| `setores` | Departamentos | — |
| `pesquisas` / `perguntas` / `respostas` | Clima | respostas com **ip_hash**, unicidade por colaborador |
| `checkins` | Pulso semanal | dado comportamental recorrente |
| `relatos_escuta` | Canal de denúncia | **texto do relato, modo anônimo/identificado** (sensível) |
| `riscos` | Mapa de risco psicossocial (clima) | score, dimensoes (JSON), nivel |
| `relatorios` | Relatórios executivos IA | conteúdo gerado, pdf_path |
| `comunicados` / `comunicado_leituras` | Comunicação | confirmação de leitura |
| `nr1_avaliacoes` | Avaliação NR-1/PGR | código público, versão, aprovação, dados IA |
| `nr1_respondentes` | Respondente NR-1 | **só setor/sexo/faixa — zero PII (LGPD by design)** ✅ |
| `nr1_respostas` | Respostas NR-1 | secao/item/valor Likert, unicidade |
| `nr1_plano_acoes` / `nr1_acao_anexos` | Plano de ação | responsável, prazos, anexos |
| `nr1_dossie_arquivos` | Dossiê auditoria | documentos legais |
| `auditorias` | Trilha de auditoria | rastreabilidade |
| `empresa_produtos` | Contratos/billing | valores, ciclo, status |
| `asaas_eventos` | Idempotência webhook | payload de pagamento |

### 5.2 Relações e boas práticas observadas

- **Multi-tenant por `empresa_id`** com `cascadeOnDelete`/`nullOnDelete` consistente.
- **Soft deletes** em empresas, colaboradores, pesquisas, comunicados, NR-1.
- **Índices compostos** em campos de filtro frequente (`empresa_id+status`, `empresa_id+periodo`, etc.).
- **Constraints de unicidade** que protegem integridade (CNPJ, e-mail, código de acesso, resposta única).
- **LGPD by design** na NR-1: respondentes sem qualquer identificador pessoal.

### 5.3 Pontos de atenção no modelo

- A tabela legada `riscos` (mapa de risco baseado em clima, com IA) **coexiste** com o domínio NR-1 — há sobreposição conceitual de "risco psicossocial" entre dois subsistemas (ver §7.3).
- Migration de `nr1_respostas` comenta "seções 1–7" enquanto o domínio real tem **10 seções** — inconsistência de documentação inline (não afeta runtime).
- Histórico de migrations mostra **muita evolução de schema da NR-1 e do billing** (faixas etárias, enums de produto, limites) — sinal de domínio em amadurecimento; vale consolidar.

---

## 6. APIs, rotas e integrações

### 6.1 Grupos de rotas (`backend/routes/api.php`)

- **Público / saúde**: `POST /cadastro` (legado — UI removida), `POST /webhooks/asaas`, `GET /ping`.
- **Auth** (`/auth`): login colaborador, validação/aceite de convite, login admin, logout, `me`.
- **App colaborador** (`/app`, `auth:sanctum` + `role:colaborador`): home, perfil, pesquisas (listar/ver/responder), check-in (atual/store/histórico), comunicados (listar/marcar lido), escuta.
- **NR-1 público** (`/nr1/{codigo}`): exibir e responder avaliação **sem autenticação** (acesso por código).
- **Plataforma** (`/plataforma`, `role:super_admin`): dashboard, CRUD empresas, produtos (incl. `sincronizar-asaas`).
- **Admin** (`/admin`, `role:admin,gestor,consultor`): dashboard/indicadores/alertas, empresas, setores, colaboradores (importar/exportar/template CSV/convite), pesquisas (publicar/encerrar/duplicar/resultados/exportar) e perguntas aninhadas, check-ins, riscos (+ plano de ação/revisão), escuta (status/nota), comunicados, relatórios (gerar IA/PDF/e-mail), **NR-1 completo** (CRUD, publicar/encerrar/aprovar/duplicar, resultados, PDF, plano de ação + anexos, **dossiê**, histórico, **IA**), usuários e configurações.

A API é **RESTful, coerente e versionável**, com uso correto de `apiResource`, rotas aninhadas e nomeação consistente em português.

### 6.2 Integrações externas

| Integração | Uso | Salvaguardas |
|---|---|---|
| **Asaas** (cobrança) | Cobrança de produtos contratados, sincronização de clientes | Kill switch `ASAAS_ENABLED`; webhook com **token verificado** (`hash_equals`) e **idempotência** por `event_id` |
| **OpenAI** | Relatórios executivos e planos de ação NR-1 | Status assíncrono, fallback de erro logado |
| **AWS S3** (opcional) | Armazenamento de anexos/dossiês | Configurável (sa-east-1) |
| **SMTP / Mail** | Envio de relatórios e convites | — |
| **FCM** (token armazenado) | Push notifications (preparado) | `token_fcm` em colaboradores |

### 6.3 Comunicação front ↔ back

Axios centralizado com interceptors (token Bearer + tratamento global de 401). Camada de serviços no frontend (`adminService`, `appService`, `authService`, `nr1Service`, `plataformaService`) isola chamadas HTTP das páginas — boa separação de responsabilidades.

---

## 7. Qualidade técnica

### 7.1 Pontos fortes

1. **Separação de camadas exemplar** — Services no backend, camada de serviços no frontend, controllers enxutos por área.
2. **Domínio NR-1 robusto e bem pensado** — score, anonimato, dossiê, versionamento e aprovação formal alinhados à exigência legal.
3. **LGPD by design** na coleta NR-1 (sem PII) e travas de amostra mínima.
4. **Segurança de webhook correta** (verificação de token com `hash_equals` + idempotência).
5. **Testes de backend reais** — Pest cobrindo fluxos críticos (NR-1, convites, import, Asaas, contratos, e-mail) + CI no GitHub Actions.
6. **Multi-tenancy consistente** com índices, soft deletes e constraints.
7. **PWA mobile-first** adequada ao público de empregados.
8. **Higiene de repositório** — `.env` e `backend.zip` **não versionados**.

### 7.2 Fragilidades técnicas

1. **Token de autenticação em `localStorage`** (`rp_token`) — vulnerável a XSS. O ideal seria cookie httpOnly/SameSite ou, no mínimo, mitigação de XSS rigorosa. (Risco de segurança — **alta**.)
2. **Dependências declaradas e não usadas** — `spatie/laravel-permission` e `spatie/laravel-query-builder` no composer, mas o controle de acesso é feito por middleware próprio + abilities. Peso e confusão. (**Média**.)
3. **Arquivos legados em `src/data/`** (mocks de colaboradores, pesquisas, riscos etc.) **não importados em lugar nenhum** — código morto. (**Baixa-média**.)
4. **Sem testes no frontend** — apenas build no CI; nenhuma cobertura de componentes/fluxos React. (**Média**.)
5. **Rebranding incompleto "Radar Pessoas → Sinal RH"** — chaves `localStorage` `rp_*`, `MAIL_FROM` `@radarapessoas.com.br`, `DB radar_pessoas`, vars `RADAR_*`, PDF de identidade "Radar Pessoas". Risco de inconsistência de marca e confusão de manutenção. (**Média**.)
6. **`backend.zip` (35 MB) e PDF de 4 MB na raiz** — bloat do diretório de trabalho (ainda que não versionados). (**Baixa**.)
7. **Inconsistências de documentação inline** — comentário "seções 1–7" vs. 10 seções reais; histórico de enums de faixa etária remendado em várias migrations. (**Baixa**.)
8. **Dois subsistemas de "risco psicossocial"** (tabela `riscos` baseada em clima/IA × domínio NR-1) com possível sobreposição conceitual não unificada. (**Média** — ver §7.3.)

### 7.3 Riscos de manutenção, segurança, performance e escalabilidade

- **Manutenção**: rebranding parcial e duplicidade conceitual de risco aumentam carga cognitiva; consolidar reduz bugs futuros.
- **Segurança**: além do token em localStorage, revisar exposição de dados sensíveis (CPF de colaborador, texto de relatos de escuta) em respostas de API e logs; confirmar criptografia/ocultação consistente.
- **Performance**: cálculo de score NR-1 e coleta de contexto para IA fazem **múltiplas queries por setor/segmento** (`whereHas` repetidos) — pode ficar custoso em empresas grandes; cachear/otimizar agregações. Geração de IA e PDF devem rodar em **fila (Redis)** para não bloquear requests.
- **Escalabilidade**: modelo multi-tenant por coluna `empresa_id` é adequado ao porte atual; em grande escala avaliar particionamento e índices adicionais.

### 7.4 Duplicidades e acoplamentos

- `RelatorioIAService` × `Nr1RelatorioIAService` — lógica de IA parcialmente paralela.
- Tabela `riscos` × NR-1 — conceito de risco em dois lugares.
- Mocks `src/data/` × dados reais via API — legado a remover.

---

## 8. Produto e experiência do usuário

### 8.1 Coerência com uma plataforma de RH

O sistema é **coerente e bem posicionado** como plataforma de RH com âncora em conformidade NR-1 — um diferencial comercial forte e atual. A separação plataforma/empresa/colaborador reflete corretamente o modelo de consultoria B2B2C. O design system próprio (`components/ui`) e a PWA indicam preocupação com experiência.

### 8.2 Oportunidades na jornada do usuário

- **Onboarding do admin** existe (`OnboardingWizard`, `concluirOnboarding`), mas vale reforçar o "primeiro diagnóstico em X passos" para reduzir tempo até valor.
- **Feedback de coleta em tempo real** (taxa de adesão, lembrete a quem não respondeu) aumenta a qualidade da amostra — crítico dada a trava de ≥5 respondentes.
- **Telas "Em Breve" (Feedback 360, PDI)** expostas ao cliente podem passar imagem de produto incompleto; considerar esconder até lançar.
- **Comunicação da garantia de anonimato** ao empregado (na tela da avaliação NR-1) aumenta sinceridade das respostas.

### 8.3 Melhorias para profissionalizar e comercializar

- **Unificar a marca "Sinal RH"** em todo o sistema (chaves, e-mails, domínios, assets) — essencial para credibilidade comercial.
- **Relatórios em PDF com identidade visual consistente** (a identidade ainda referencia "Radar Pessoas").
- **Painel de benchmark** entre setores/períodos para reforçar o valor consultivo.
- **Exportações e dossiê com selo/assinatura** reforçando o apelo de "pronto para auditoria".

---

## 9. Próximos passos recomendados (priorizados)

### 🔴 Prioridade ALTA

**Técnico**
- Mitigar risco de token em `localStorage` (cookie httpOnly/SameSite ou endurecimento anti-XSS).
- Auditar exposição de dados sensíveis (CPF, relatos de escuta) em respostas de API e logs.
- Garantir que geração de IA e PDF rodem em **fila Redis** (não bloquear request) e tratar timeouts.

**Regra de negócio**
- Validar e padronizar enums de faixa etária entre migrations, score service e IA (eliminar remendos).

**Produto**
- Concluir o **rebranding "Sinal RH"** (chaves `rp_*`, e-mails, domínios, DB, vars `RADAR_*`, identidade de PDFs).

### 🟡 Prioridade MÉDIA

**Técnico**
- Remover dependências não usadas (`spatie/*`) ou passar a usá-las de fato.
- Excluir código legado `src/data/*` e o `backend.zip` do diretório.
- Otimizar/cachear o cálculo de score NR-1 e a coleta de contexto da IA (reduzir N+1 de `whereHas`).
- Introduzir **testes no frontend** (Vitest + Testing Library) para fluxos críticos.

**Regra de negócio**
- Decidir o futuro do subsistema `riscos` (clima) × NR-1 — unificar ou delimitar claramente.

**Produto**
- Esconder/sinalizar módulos "Em Breve" (Feedback 360, PDI).
- Adicionar acompanhamento de adesão e lembretes de coleta.

### 🟢 Prioridade BAIXA

**Técnico**
- Corrigir comentários inline desatualizados (seções "1–7" → 10).
- Consolidar histórico de migrations em squash para nova instalação limpa.

**Visual / UX**
- Padronizar identidade visual de relatórios e dossiês.
- Reforçar mensagem de anonimato na avaliação NR-1.
- Painel de benchmark e comparativos históricos.

---

## 10. Conclusão

O Sinal RH é um produto **tecnicamente sólido e estrategicamente bem posicionado**, cujo núcleo de NR-1/riscos psicossociais demonstra maturidade real (score padronizado, anonimato LGPD, dossiê de auditoria, IA e versionamento). As pendências são, em sua maioria, de **higiene e consolidação** (rebranding, código legado, dependências, testes de frontend) e de **endurecimento de segurança** (token, dados sensíveis), não de fundação arquitetural — o que é um excelente ponto de partida.

A recomendação é tratar primeiro os itens de segurança e o rebranding (impacto comercial direto), seguidos da limpeza técnica e da decisão sobre a duplicidade conceitual de "risco". Com esses ajustes, o sistema fica significativamente mais profissional, confiável e pronto para escalar comercialmente.

*Aguardando suas próximas instruções antes de executar qualquer alteração.*
