# Plano de Execução — Feedback 360 + PDI (Sinal RH)

> Documento de planejamento. Nenhuma alteração de código foi feita.
> Criado: 23/07/2026 — v1

Os dois módulos formam um ciclo único: **360 diagnostica → PDI desenvolve → EAD executa a teoria → próximo 360 mede a evolução**. Este é o diferencial frente a planilhas e ferramentas avulsas: o ciclo fecha dentro da plataforma.

## 1. Arquitetura de papéis

| Painel | Quem | Feedback 360 | PDI |
|---|---|---|---|
| **Plataforma** (`/plataforma`, `role:super_admin`) | Sara Linhar | Biblioteca global de **competências e questionários-modelo**; visão agregada por empresa | Modelos de ação sugeridos por competência; visão agregada |
| **Admin da empresa** (`/admin`, `role:admin,gestor,consultor`) | Cliente (RH) | **Configura e conduz ciclos**: período, participantes, avaliadores; acompanha adesão; vê relatórios consolidados | Acompanha PDIs da empresa (status, atrasos); não vê anotações privadas de 1-on-1 |
| **App do colaborador** (`/app`, `role:colaborador`) | Empregado | **Responde avaliações** (auto, pares, líder, liderados) e **vê seu próprio relatório** quando liberado | **Dono do seu PDI**: propõe/aceita ações, marca progresso, registra evidências |
| **Líder** (colaborador com liderados) | Gestor direto | Vê relatório dos liderados diretos | **Co-constrói o PDI** no app, conduz e registra 1-on-1s |

Regras centrais:
- **Gate**: produtos `feedback` e `pdi` já existem em `EmpresaProduto::PRODUTOS` — sem migration de produto.
- **Anonimato por construção**: respostas de pares e liderados nunca são exibidas individualmente. Mínimo de **3 respondentes por relação** para abrir o recorte; abaixo disso, agrega com outra relação ou suprime.
- **PDI pertence ao colaborador**; líder co-assina; RH vê status, não conteúdo sensível.

## 2. Pré-requisito estrutural: vínculo de liderança

Hoje `colaboradores` tem `setor_id` e `cargo`, mas **não tem gestor**. O 360 depende de saber quem lidera quem (define relações avaliador↔avaliado e quem vê o quê no PDI).

```
ALTER colaboradores
  + gestor_id (FK colaboradores, nullable, self-reference)
```

- UI: campo "Líder direto" no cadastro/edição de colaborador (`/admin`) + importação em massa.
- `Colaborador::liderados()` (hasMany self) e `lider()` (belongsTo self).
- Validação: sem ciclos (A lidera B que lidera A); no máximo 1 líder direto.
- Entra na **Fase 0** — sem isso o 360 não roda.

## 3. Modelo de dados — Feedback 360

Reaproveita o desenho `Pesquisa`/`Pergunta`/`Resposta` como referência, mas com tabelas próprias (o 360 tem relações avaliador↔avaliado que pesquisas de clima não têm).

```
fb_competencias                ← GLOBAL (Plataforma) + por empresa
  id, empresa_id (FK nullable — NULL = global/biblioteca)
  nome, descricao, comportamentos (JSON — âncoras observáveis)
  ativo, timestamps

fb_ciclos                      ← por empresa
  id, empresa_id (FK), titulo, descricao
  status (rascunho|coleta|consolidacao|devolutiva|encerrado)
  inicio_coleta, fim_coleta, liberacao_relatorios (nullable)
  anonimo_min (default 3), criado_por (FK users)
  softDeletes, timestamps

fb_ciclo_competencias
  id, ciclo_id (FK), competencia_id (FK), ordem
  UNIQUE(ciclo_id, competencia_id)

fb_perguntas
  id, ciclo_id (FK), competencia_id (FK nullable — NULL = pergunta geral)
  enunciado, tipo (escala_1_5|escala_1_10|texto_aberto)
  obrigatoria (bool), ordem

fb_participantes               ← quem É AVALIADO no ciclo
  id, ciclo_id (FK), colaborador_id (FK)
  status (pendente|em_coleta|consolidado|devolvido)
  UNIQUE(ciclo_id, colaborador_id)

fb_avaliacoes                  ← convite avaliador→avaliado
  id, participante_id (FK), avaliador_id (FK colaboradores)
  relacao (auto|lider|par|liderado)
  status (pendente|respondida|expirada), respondida_em
  UNIQUE(participante_id, avaliador_id)

fb_respostas
  id, avaliacao_id (FK), pergunta_id (FK)
  valor (int nullable), texto (TEXT nullable)

fb_relatorios                  ← consolidação materializada
  id, participante_id (FK), gerado_em
  medias (JSON — por competência × relação, já com regra de anonimato aplicada)
  destaques (JSON — maiores gaps auto×outros, pontos fortes)
  comentarios (JSON — textos abertos embaralhados, sem autoria)
```

**Regras de negócio — 360:**
- Montagem dos avaliadores: auto (sempre), líder (via `gestor_id`), liderados (inverso), pares (mesmo `setor_id`, seleção do RH com sugestão automática; recomendação 3–5).
- Respostas gravam `avaliacao_id`, mas o relatório **materializa apenas agregados** — a API de leitura nunca expõe resposta individual de par/liderado. Textos abertos aparecem embaralhados e sem relação/autor.
- Relação com menos de `anonimo_min` respondentes: funde com "pares" ou exibe apenas no total geral.
- Ciclo segue máquina de estados; reaberto só de `consolidacao` → `coleta` (antes da devolutiva).
- Colaborador vê o próprio relatório após `liberacao_relatorios`; líder vê o dos liderados diretos; RH vê todos da empresa; auditoria (`Auditoria`) em cada acesso a relatório.

## 4. Modelo de dados — PDI

```
pdi_planos
  id, empresa_id (FK), colaborador_id (FK)
  ciclo_origem_id (FK fb_ciclos nullable — 360 que originou)
  status (rascunho|ativo|concluido|cancelado|estagnado)
  inicio, fim_previsto, concluido_em (nullable)
  aceito_pelo_colaborador_em, aceito_pelo_lider_em   ← co-assinatura
  softDeletes, timestamps

pdi_competencias_foco          ← máx. 2 por plano (validação)
  id, plano_id (FK), competencia_id (FK fb_competencias)
  motivo (TEXT — vem do gap do 360 ou manual), ordem

pdi_acoes
  id, plano_id (FK), competencia_foco_id (FK)
  categoria (pratica|troca|teoria)               ← 70/20/10
  descricao, criterio_conclusao (TEXT — "como sei que foi feito")
  ead_curso_id (FK ead_cursos nullable — ação teoria linkada ao EAD)
  recurso_necessario (TEXT nullable), custo_estimado (nullable)
  inicio, fim_previsto
  status (pendente|em_andamento|concluida|cancelada)
  concluida_em, evidencia (TEXT nullable)

pdi_checkins                   ← 1-on-1s de acompanhamento
  id, plano_id (FK), realizado_em
  registrado_por (FK colaboradores — o líder)
  resumo (TEXT), proximos_passos (TEXT nullable)
  visivel_rh (bool default false)               ← anotações privadas por padrão
```

**Regras de negócio — PDI:**
- Criação a partir do 360: ao liberar a devolutiva, sistema sugere PDI pré-preenchido com as 1–2 competências de maior gap. Também pode nascer manual (sem ciclo).
- **70/20/10 como bússola, não como trava**: a UI mostra o equilíbrio das ações por categoria e alerta se 100% for teoria, mas não bloqueia.
- Toda ação exige `criterio_conclusao` preenchido (o campo é obrigatório — sem "meta vaga").
- Ação `teoria` pode linkar curso EAD liberado à empresa; conclusão da matrícula (`ead_matriculas.status = concluido`) marca a ação como concluída automaticamente.
- `estagnado` = automático: sem check-in e sem movimentação de ação por 45 dias → notifica líder e RH.
- Troca de líder (`gestor_id` alterado): PDI permanece; novo líder herda acompanhamento e é notificado; check-ins antigos continuam visíveis a ele.
- Novo ciclo 360: PDI ativo ganha marcador de "medição" — o relatório do novo ciclo mostra a evolução das competências foco (o número que fecha o loop).
- Visibilidade: colaborador vê tudo do seu plano; líder direto idem; RH vê plano/ações/status mas só check-ins com `visivel_rh = true`.
- Notificações (via `token_fcm` existente): ação vencendo → colaborador; 1-on-1 sem registro há 30 dias → líder; plano estagnado → RH.

## 5. Backend — endpoints

### Plataforma (`/api/plataforma/*`, `role:super_admin`)
```
apiResource fb/competencias            CRUD biblioteca global
GET  fb/visao-geral                    adesão e ciclos por empresa
GET  pdi/visao-geral                   PDIs ativos/estagnados por empresa
```

### Admin (`/api/admin/*`, `role:admin,gestor,consultor` + gate produto + garantirMesmaEmpresa)
```
apiResource fb/competencias            CRUD da empresa (clona da biblioteca)
apiResource fb/ciclos                  CRUD
POST fb/ciclos/{ciclo}/participantes   define avaliados + monta rede de avaliadores
POST fb/ciclos/{ciclo}/iniciar | consolidar | liberar-devolutiva | encerrar
GET  fb/ciclos/{ciclo}/adesao          % respondido por relação (sem expor quem)
GET  fb/participantes/{p}/relatorio    consolidado (auditado)
GET  pdi/planos                        lista da empresa (status, atraso, equilíbrio 70/20/10)
GET  pdi/planos/{plano}                detalhe (check-ins só visivel_rh)
```

### App (`/api/app/*`, auth colaborador)
```
GET  fb/pendentes                      avaliações a responder
POST fb/avaliacoes/{av}/responder      grava respostas (uma vez)
GET  fb/meu-relatorio/{ciclo}          próprio relatório (após liberação)
GET  fb/liderados/{colab}/relatorio    líder → liderado direto
apiResource pdi/meu-plano              colaborador CRUD do próprio (rascunho)
POST pdi/planos/{plano}/aceitar        co-assinatura (colaborador ou líder)
POST pdi/acoes/{acao}/concluir         com evidência
POST pdi/planos/{plano}/checkins       líder registra 1-on-1
GET  pdi/liderados                     líder → planos dos liderados
```

## 6. Frontend — telas

### Admin (`/admin`)
1. **Competências** — CRUD + importar da biblioteca global.
2. **Ciclos 360** — lista; wizard de criação (dados → competências/perguntas → participantes → revisão da rede de avaliadores → iniciar).
3. **Acompanhamento do ciclo** — adesão por relação, reenvio de lembretes, consolidar/liberar.
4. **Relatório do participante** — radar por competência × relação, gaps auto×outros, comentários anônimos; botão "Gerar PDI".
5. **Painel PDI** — planos por status, alerta de estagnados, equilíbrio 70/20/10 agregado.

### App do colaborador (`/app`)
6. **Minhas avaliações** — fila de pendentes, formulário mobile-first, uma competência por tela.
7. **Meu relatório 360** — mesma visão radar, linguagem de devolutiva (não de nota).
8. **Meu PDI** — competências foco, ações em kanban simples (pendente/andamento/concluída), link direto pro curso EAD nas ações teoria.
9. **Área do líder** — liderados: relatórios 360, PDIs, registrar 1-on-1.

### Plataforma
10. **Biblioteca de competências** + visão agregada de ciclos e PDIs por empresa.

## 7. Padrões existentes reaproveitados

| Padrão | Onde está | Uso aqui |
|---|---|---|
| Gate por produto | `EmpresaProduto` (`feedback`, `pdi` já cadastrados) + `Sidebar.jsx` | Menus e rotas condicionados |
| Isolamento multi-tenant | `garantirMesmaEmpresa()` nos controllers admin | Todos os endpoints admin |
| Estrutura de questionário | `Pesquisa`/`Pergunta`/`Resposta` | Referência de desenho dos formulários |
| Sigilo com auditoria | `EscutaAcesso`/`Auditoria` | Acesso a relatórios 360 e check-ins |
| Liberação por empresa | `ead_curso_empresa` | Vínculo ação PDI ↔ curso EAD |
| Push notifications | `token_fcm` em colaboradores | Lembretes de avaliação, ação e 1-on-1 |

## 8. Fases de entrega

| Fase | Escopo | Entrega |
|---|---|---|
| **0** | `gestor_id` em colaboradores + UI de líder direto + importação | Pré-requisito estrutural |
| **1** | Competências (biblioteca + empresa) + ciclos 360 completos: wizard, coleta no app, consolidação, relatório com anonimato | 360 funcional ponta a ponta |
| **2** | PDI: planos, ações 70/20/10, co-assinatura, check-ins, painel RH | PDI funcional (nasce manual ou do 360) |
| **3** | Integrações: sugestão automática 360→PDI, link EAD com auto-conclusão, notificações push, detecção de estagnado | O ciclo fecha |
| **4** | Evolução entre ciclos (medição do PDI no 360 seguinte) + visões agregadas da Plataforma | Prova de valor mensurável |

## 9. Riscos e decisões em aberto

- **Empresa pequena e anonimato**: com equipes de 2–3 pessoas o recorte por relação quase nunca abre. Decidir mensagem-padrão ("respostas agregadas por sigilo") e testar com empresa piloto.
- **Líder que não é usuário do app**: hoje líder = colaborador com liderados. Se o gestor da empresa usa só o painel `/admin`, decidir se o papel de líder no PDI pode ser exercido por um `User` admin/gestor (impacta FKs de `pdi_checkins.registrado_por`).
- **Peso da consolidação**: relatório materializado em `fb_relatorios` evita recomputar agregados a cada acesso; gerar via job na transição `coleta → consolidacao`.
- **Calibração das escalas**: começar só com escala 1–5 + texto aberto; 1–10 e tipos extras ficam para depois (menos decisão pro RH cliente na v1).
