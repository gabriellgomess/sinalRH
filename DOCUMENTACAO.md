# Radar Pessoas — Documentação Completa

**Sara Linhar Consultoria** | SaaS B2B de Clima Organizacional e Riscos Psicossociais  
Stack: React 18 + Vite PWA + TailwindCSS | Laravel 11 + Sanctum + OpenAI

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura de Pastas](#2-estrutura-de-pastas)
3. [Frontend — Setup e Execução](#3-frontend--setup-e-execução)
4. [Backend — Setup e Execução](#4-backend--setup-e-execução)
5. [Banco de Dados](#5-banco-de-dados)
6. [Autenticação e Autorização](#6-autenticação-e-autorização)
7. [API Reference](#7-api-reference)
8. [Guia de Integração Frontend ↔ Backend](#8-guia-de-integração-frontend--backend)
9. [Módulo de IA — Relatórios](#9-módulo-de-ia--relatórios)
10. [PWA — Configuração e Deploy](#10-pwa--configuração-e-deploy)
11. [Segurança e LGPD](#11-segurança-e-lgpd)
12. [Arquivos Pendentes (Next Steps)](#12-arquivos-pendentes-next-steps)
13. [Roadmap de Produto](#13-roadmap-de-produto)
14. [Deploy em Produção](#14-deploy-em-produção)
15. [Variáveis de Ambiente](#15-variáveis-de-ambiente)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     RADAR PESSOAS PLATFORM                       │
├──────────────────────────┬──────────────────────────────────────┤
│   FRONTEND (React PWA)   │         BACKEND (Laravel API)         │
│                          │                                       │
│  ┌─────────────────────┐ │  ┌─────────────────────────────────┐ │
│  │  Mobile PWA (App)   │ │  │  Auth API (/auth/*)             │ │
│  │  - Login            │ │  │  Sanctum Tokens + Abilities     │ │
│  │  - Home/Dashboard   │◄├─►│                                 │ │
│  │  - Check-in diário  │ │  │  App API (/app/*)               │ │
│  │  - Pesquisas        │ │  │  role:colaborador                │ │
│  │  - Canal de Escuta  │ │  │                                 │ │
│  │  - Comunicados      │ │  │  Admin API (/admin/*)           │ │
│  └─────────────────────┘ │  │  role:admin|gestor|consultor    │ │
│                          │  └────────────┬────────────────────┘ │
│  ┌─────────────────────┐ │               │                       │
│  │  Admin Dashboard    │ │  ┌────────────▼────────────────────┐ │
│  │  - KPIs & Gráficos  │ │  │  MySQL Database                 │ │
│  │  - Mapa de Riscos   │◄├─►│  13 tabelas + soft deletes      │ │
│  │  - Relatórios IA    │ │  └────────────┬────────────────────┘ │
│  │  - Colaboradores    │ │               │                       │
│  │  - Pesquisas CRUD   │ │  ┌────────────▼────────────────────┐ │
│  └─────────────────────┘ │  │  OpenAI GPT-4o-mini             │ │
│                          │  │  Geração de relatórios IA       │ │
│  Vite PWA + Workbox      │  └─────────────────────────────────┘ │
│  Service Worker          │                                       │
│  Offline-first caching   │  Queue (Redis/DB) → Jobs assíncronos │
└──────────────────────────┴──────────────────────────────────────┘
```

### Fluxo de Dados

1. **Colaborador** → Login → JWT via Sanctum → Mobile App → Check-in/Pesquisa/Escuta
2. **Admin** → Login → JWT (abilities: role:admin) → Dashboard → Visualiza dados agregados
3. **IA** → Admin cria relatório → Job assíncrono → OpenAI → Relatório pronto
4. **Riscos** → Calculados automaticamente a partir dos check-ins semanais por setor

---

## 2. Estrutura de Pastas

```
PROJETO RADAR PESSOAS/
├── src/                          # Frontend React
│   ├── components/
│   │   ├── ui/                   # Componentes reutilizáveis
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── RiskBadge.jsx
│   │   │   ├── PageTitle.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── LoadingState.jsx
│   │   ├── layout/               # Estruturas de layout
│   │   │   ├── RadarLogo.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── AdminHeader.jsx
│   │   │   ├── MobileBottomNav.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   └── AppLayout.jsx
│   │   └── charts/               # Gráficos Recharts
│   │       ├── EvolutionChart.jsx
│   │       ├── SectorChart.jsx
│   │       └── RadarChart.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx       # Estado global de auth
│   ├── data/                     # Mock data (dev/demo)
│   │   ├── empresa.js
│   │   ├── setores.js
│   │   ├── colaboradores.js
│   │   ├── pesquisas.js
│   │   ├── indicadores.js
│   │   ├── riscos.js
│   │   ├── comunicados.js
│   │   └── relatorio.js
│   ├── pages/
│   │   ├── app/                  # App mobile colaborador
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── CheckIn.jsx
│   │   │   ├── Pesquisas.jsx
│   │   │   ├── PesquisaDetalhe.jsx
│   │   │   ├── Comunicados.jsx
│   │   │   ├── Escuta.jsx
│   │   │   └── Perfil.jsx
│   │   └── admin/                # Dashboard admin web
│   │       ├── AdminLogin.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Riscos.jsx
│   │       ├── Pesquisas.jsx
│   │       ├── NovaPesquisa.jsx
│   │       ├── Relatorios.jsx
│   │       ├── Colaboradores.jsx
│   │       ├── Empresas.jsx
│   │       ├── Configuracoes.jsx
│   │       ├── CheckIns.jsx
│   │       └── CanalEscuta.jsx
│   ├── routes/
│   │   └── AppRoutes.jsx         # Roteamento protegido
│   ├── services/                 # Camada API
│   │   ├── api.js                # Instância Axios + interceptors
│   │   ├── authService.js
│   │   ├── appService.js
│   │   └── adminService.js
│   ├── styles/
│   │   └── index.css             # Design tokens + classes utilitárias
│   ├── App.jsx
│   └── main.jsx
├── public/
│   ├── icons/
│   │   ├── favicon.svg
│   │   ├── icon-192.svg
│   │   └── icon-512.svg
│   └── manifest.webmanifest      # Gerado pelo vite-plugin-pwa
├── backend/                      # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/
│   │   │   │   │   ├── AuthController.php
│   │   │   │   │   ├── Admin/
│   │   │   │   │   │   ├── DashboardController.php
│   │   │   │   │   │   ├── PesquisaController.php
│   │   │   │   │   │   ├── RelatorioController.php
│   │   │   │   │   │   ├── RiscoController.php
│   │   │   │   │   │   ├── ColaboradorController.php
│   │   │   │   │   │   └── [pendentes: ver seção 12]
│   │   │   │   │   └── App/
│   │   │   │   │       ├── HomeController.php
│   │   │   │   │       ├── CheckInController.php
│   │   │   │   │       ├── PesquisaController.php
│   │   │   │   │       └── EscutaController.php
│   │   │   └── Middleware/
│   │   │       └── EnsureRoleMiddleware.php
│   │   ├── Models/
│   │   │   ├── Empresa.php
│   │   │   ├── Setor.php
│   │   │   ├── Colaborador.php
│   │   │   ├── Pesquisa.php
│   │   │   ├── Pergunta.php
│   │   │   ├── Resposta.php
│   │   │   ├── CheckIn.php
│   │   │   ├── RelatoEscuta.php
│   │   │   ├── Risco.php
│   │   │   ├── Comunicado.php
│   │   │   └── Relatorio.php
│   │   ├── Services/
│   │   │   └── RelatorioIAService.php
│   │   └── Jobs/
│   │       └── [GerarRelatorioJob.php — pendente]
│   ├── database/
│   │   └── migrations/           # 7 migrations criadas
│   └── routes/
│       └── api.php               # Todas as rotas
├── package.json
├── vite.config.js
├── tailwind.config.js
└── DOCUMENTACAO.md               # Este arquivo
```

---

## 3. Frontend — Setup e Execução

### Pré-requisitos

- Node.js 20+ e npm 10+

### Instalação

```bash
cd "PROJETO RADAR PESSOAS"
npm install
```

### Desenvolvimento

```bash
npm run dev
# Acesso: http://localhost:5173
```

### Build de Produção

```bash
npm run build
# Saída em /dist — inclui service worker Workbox
```

### Preview do Build

```bash
npm run preview
```

### Credenciais de Demo (Mock)

| Perfil        | Login                            | Senha       |
|---------------|----------------------------------|-------------|
| Colaborador   | ana.silva@acmebrasil.com.br      | qualquer 4+ |
| Colaborador   | colaborador@empresa.com          | qualquer 4+ |
| Admin         | marina.souza@acmebrasil.com.br   | qualquer 4+ |
| Admin         | admin@saralinhar.com.br          | qualquer 4+ |

### Substituir Mock por API Real

Em `src/services/api.js`, defina a URL base:

```js
// Desenvolvimento
const BASE_URL = 'http://localhost:8000/api'

// Produção
const BASE_URL = 'https://api.seudominio.com.br/api'
```

Descomente o interceptor de auth (já preparado) e remova as chamadas a `src/data/*` nas páginas, substituindo pelos hooks de serviço.

---

## 4. Backend — Setup e Execução

### Pré-requisitos

- PHP 8.2+
- Composer 2+
- MySQL 8+ ou MariaDB 10.6+
- Redis (recomendado para filas) ou usar `QUEUE_CONNECTION=database`

### Instalação

```bash
cd "PROJETO RADAR PESSOAS/backend"
composer install
cp .env.example .env
php artisan key:generate
```

### Configurar `.env`

```env
DB_HOST=127.0.0.1
DB_DATABASE=radar_pessoas
DB_USERNAME=root
DB_PASSWORD=sua_senha

OPENAI_API_KEY=sk-...

QUEUE_CONNECTION=database   # ou redis
```

### Banco de Dados

```bash
# Criar banco
mysql -u root -p -e "CREATE DATABASE radar_pessoas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Migrations
php artisan migrate

# Seeders (quando criados — ver seção 12)
php artisan db:seed
```

### Registrar Middleware

Em `bootstrap/app.php`, adicionar alias:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\EnsureRoleMiddleware::class,
    ]);
})
```

### Executar Servidor

```bash
php artisan serve
# API disponível em: http://localhost:8000/api
```

### Fila de Jobs

```bash
# Em outro terminal:
php artisan queue:work
```

---

## 5. Banco de Dados

### Diagrama de Entidades

```
empresas ──< setores ──< colaboradores ──< check_ins
    │              │              │
    │              │              ├──< respostas ──< perguntas ──< pesquisas
    │              │              └──< relatos_escuta
    │              └──< riscos
    ├──< pesquisas
    ├──< relatorios
    └──< comunicados >──< comunicado_leituras >──< colaboradores
```

### Tabelas

#### `empresas`
| Coluna             | Tipo        | Descrição                        |
|--------------------|-------------|----------------------------------|
| id                 | bigint PK   |                                  |
| nome_fantasia      | varchar     | Nome exibido                     |
| razao_social       | varchar     | Razão social                     |
| cnpj               | varchar(18) | Único                            |
| email_contato      | varchar     |                                  |
| telefone           | varchar     |                                  |
| logo_url           | varchar     | URL da logo                      |
| plano              | enum        | basico, profissional, enterprise |
| status             | enum        | ativa, suspensa, cancelada       |
| max_colaboradores  | int         | Limite por plano                 |
| configuracoes      | json        | Configurações customizadas       |
| deleted_at         | timestamp   | Soft delete                      |

#### `setores`
| Coluna        | Tipo      | Descrição                  |
|---------------|-----------|----------------------------|
| id            | bigint PK |                            |
| empresa_id    | bigint FK |                            |
| setor_pai_id  | bigint FK | Auto-referência (nullable) |
| nome          | varchar   |                            |
| unidade       | varchar   | SP, Recife, etc.           |
| responsavel   | varchar   | Nome do responsável        |

#### `colaboradores`
| Coluna            | Tipo      | Descrição                          |
|-------------------|-----------|------------------------------------|
| id                | bigint PK |                                    |
| empresa_id        | bigint FK |                                    |
| setor_id          | bigint FK |                                    |
| nome              | varchar   |                                    |
| email             | varchar   | Único por empresa                  |
| cpf               | varchar   | Único, criptografado               |
| codigo_acesso     | varchar   | 6 dígitos gerados automaticamente  |
| cargo             | varchar   |                                    |
| password          | varchar   | Bcrypt (para login mobile)         |
| status            | enum      | ativo, inativo, ferias, afastado   |
| token_fcm         | text      | Push notifications (oculto)        |
| deleted_at        | timestamp | Soft delete                        |

#### `pesquisas`
| Coluna              | Tipo      | Descrição                           |
|---------------------|-----------|-------------------------------------|
| id                  | bigint PK |                                     |
| empresa_id          | bigint FK |                                     |
| titulo              | varchar   |                                     |
| descricao           | text      |                                     |
| status              | enum      | rascunho, ativa, encerrada          |
| tipo                | enum      | pulso, engajamento, clima, saude    |
| anonima             | boolean   | Se oculta identidade                |
| data_inicio         | date      |                                     |
| data_fim            | date      |                                     |
| publicada_em        | timestamp |                                     |
| criada_por          | bigint FK | → users (admin)                     |

#### `perguntas`
| Coluna     | Tipo      | Descrição                              |
|------------|-----------|----------------------------------------|
| id         | bigint PK |                                        |
| pesquisa_id| bigint FK |                                        |
| texto      | text      |                                        |
| tipo       | enum      | likert, multipla_escolha, texto_livre  |
| dimensao   | varchar   | ISO 45003 dimension                    |
| ordem      | int       | Ordenação drag-and-drop                |
| obrigatoria| boolean   |                                        |
| opcoes     | json      | Para múltipla escolha                  |

#### `respostas`
| Coluna        | Tipo      | Descrição                     |
|---------------|-----------|-------------------------------|
| id            | bigint PK |                               |
| pesquisa_id   | bigint FK |                               |
| pergunta_id   | bigint FK |                               |
| colaborador_id| bigint FK |                               |
| valor_likert  | tinyint   | 1-5 (nullable)                |
| valor_texto   | text      | Para texto livre (nullable)   |
| valor_opcao   | varchar   | Para múltipla escolha         |

**Unique:** `[pergunta_id, colaborador_id]` — evita duplicatas

#### `check_ins`
| Coluna        | Tipo      | Descrição                        |
|---------------|-----------|----------------------------------|
| id            | bigint PK |                                  |
| empresa_id    | bigint FK |                                  |
| setor_id      | bigint FK |                                  |
| colaborador_id| bigint FK |                                  |
| humor         | tinyint   | 1-5 (péssimo a ótimo)            |
| nota          | text      | Observação livre (nullable)      |
| semana        | varchar   | Formato YYYY-WXX (ISO 8601)      |

**Unique:** `[colaborador_id, semana]` — um check-in por semana

#### `relatos_escuta`
| Coluna        | Tipo      | Descrição                          |
|---------------|-----------|------------------------------------|
| id            | bigint PK |                                    |
| empresa_id    | bigint FK |                                    |
| setor_id      | bigint FK |                                    |
| colaborador_id| bigint FK | NULL para anônimos (oculto no model)|
| modo          | enum      | anonimo, identificado              |
| categoria     | varchar   | Tipo do relato                     |
| tag           | varchar   | Tag opcional                       |
| texto         | text      | Conteúdo do relato                 |
| status        | enum      | pendente, em_analise, resolvido    |
| prioridade    | enum      | alta, media, baixa                 |
| nota_interna  | text      | Nota do admin (oculta no model)    |

#### `riscos`
| Coluna     | Tipo      | Descrição                           |
|------------|-----------|-------------------------------------|
| id         | bigint PK |                                     |
| empresa_id | bigint FK |                                     |
| setor_id   | bigint FK | Unique por empresa                  |
| nivel      | enum      | critico, alto, moderado, baixo      |
| score      | decimal   | 0-100                               |
| dimensoes  | json      | Scores ISO 45003 por dimensão       |
| plano_acao | json      | Array de ações planejadas           |
| calculado_em| timestamp |                                    |

#### `comunicados`
| Coluna     | Tipo      | Descrição                      |
|------------|-----------|--------------------------------|
| id         | bigint PK |                                |
| empresa_id | bigint FK |                                |
| titulo     | varchar   |                                |
| corpo      | text      | HTML ou markdown               |
| tipo       | enum      | info, alerta, urgente          |
| publicado  | boolean   |                                |
| criado_por | bigint FK | → users                        |

**Pivot:** `comunicado_leituras (comunicado_id, colaborador_id, lido_em)`

#### `relatorios`
| Coluna           | Tipo      | Descrição                       |
|------------------|-----------|---------------------------------|
| id               | bigint PK |                                 |
| empresa_id       | bigint FK |                                 |
| periodo          | varchar   | Ex: 2024-Q1                     |
| tipo             | enum      | executivo, tecnico, setorial    |
| status           | enum      | gerando, pronto, erro           |
| resumo_executivo | text      | Gerado pela IA                  |
| pontos_positivos | json      | Array de strings                |
| pontos_atencao   | json      | Array de strings                |
| recomendacoes    | json      | Array de strings                |
| plano_acao       | json      | Array de objetos {prazo, acao}  |
| gerado_por       | bigint FK | → users                         |

---

## 6. Autenticação e Autorização

### Modelo de Tokens (Sanctum)

O sistema usa dois tipos de usuário com tokens Sanctum diferenciados por **abilities**:

```
role:colaborador  → acesso às rotas /app/*
role:admin        → acesso total às rotas /admin/*
role:gestor       → acesso às rotas /admin/* (escopo de empresa)
role:consultor    → acesso somente-leitura a /admin/*
```

### Fluxo de Login — Colaborador

```
POST /api/auth/colaborador/login
Body: { "login": "email|cpf|codigo_acesso", "senha": "..." }

Response: {
  "token": "1|abc123...",
  "tipo": "colaborador",
  "user": { "id": 1, "nome": "...", "empresa_id": 1, ... }
}
```

O frontend armazena em `localStorage`:
- `rp_token` — Bearer token para requests
- `rp_tipo` — "colaborador" | "admin"
- `rp_user` — dados do colaborador
- `rp_admin` — dados do admin (quando admin)

### Fluxo de Login — Admin

```
POST /api/auth/admin/login
Body: { "email": "...", "senha": "..." }

Response: {
  "token": "2|xyz456...",
  "tipo": "admin",
  "user": { "id": 1, "nome": "...", "perfil": "admin", ... }
}
```

### Headers Obrigatórios

```
Authorization: Bearer {rp_token}
Accept: application/json
Content-Type: application/json
```

### Middleware de Roles

`EnsureRoleMiddleware` verifica `token->abilities` para `role:{role}`:

```php
// Em routes/api.php:
Route::middleware(['auth:sanctum', 'role:admin,gestor'])->group(function () {
    // rotas acessíveis por admin e gestor
});
```

---

## 7. API Reference

### Auth

| Método | Endpoint                       | Descrição                    | Auth |
|--------|--------------------------------|------------------------------|------|
| POST   | `/auth/colaborador/login`      | Login colaborador            | ✗    |
| POST   | `/auth/admin/login`            | Login admin/gestor/consultor | ✗    |
| POST   | `/auth/logout`                 | Revogar token atual          | ✓    |
| GET    | `/auth/me`                     | Usuário autenticado          | ✓    |

---

### App (Colaborador) — requer `role:colaborador`

| Método | Endpoint                              | Descrição                        |
|--------|---------------------------------------|----------------------------------|
| GET    | `/app/home`                           | Dados home: KPIs, pesquisas ativas, comunicados |
| GET    | `/app/perfil`                         | Dados do colaborador logado      |
| GET    | `/app/checkin`                        | Status do check-in desta semana  |
| POST   | `/app/checkin`                        | Registrar check-in (1x/semana)   |
| GET    | `/app/pesquisas`                      | Pesquisas ativas da empresa      |
| GET    | `/app/pesquisas/{id}`                 | Detalhes + perguntas             |
| POST   | `/app/pesquisas/{id}/responder`       | Enviar respostas em bulk         |
| GET    | `/app/comunicados`                    | Comunicados da empresa           |
| POST   | `/app/comunicados/{id}/ler`           | Marcar como lido                 |
| POST   | `/app/escuta`                         | Enviar relato (anônimo/identificado) |

#### POST `/app/checkin`
```json
{ "humor": 4, "nota": "Semana produtiva!" }
```

#### POST `/app/pesquisas/{id}/responder`
```json
{
  "respostas": [
    { "pergunta_id": 1, "valor_likert": 4 },
    { "pergunta_id": 2, "valor_likert": 5 },
    { "pergunta_id": 3, "valor_texto": "Muito bom o ambiente." }
  ]
}
```

#### POST `/app/escuta`
```json
{
  "modo": "anonimo",
  "categoria": "clima_equipe",
  "tag": "liderança",
  "texto": "Gostaria de reportar que..."
}
```

---

### Admin — requer `role:admin|gestor|consultor`

#### Dashboard

| Método | Endpoint                | Descrição                                  |
|--------|-------------------------|--------------------------------------------|
| GET    | `/admin/dashboard`      | KPIs + evolução + alertas                  |
| GET    | `/admin/alertas`        | Lista de alertas críticos                  |

**GET `/admin/dashboard`** — parâmetros opcionais:
- `periodo` — ex: `2024-Q1`
- `setor_id` — filtrar por setor
- `unidade` — filtrar por unidade

---

#### Pesquisas

| Método | Endpoint                               | Descrição               |
|--------|----------------------------------------|-------------------------|
| GET    | `/admin/pesquisas`                     | Listar (filtros: status, tipo) |
| POST   | `/admin/pesquisas`                     | Criar pesquisa + perguntas |
| GET    | `/admin/pesquisas/{id}`                | Detalhes                |
| PUT    | `/admin/pesquisas/{id}`                | Editar                  |
| DELETE | `/admin/pesquisas/{id}`                | Excluir (soft delete)   |
| POST   | `/admin/pesquisas/{id}/publicar`       | → status: ativa         |
| POST   | `/admin/pesquisas/{id}/encerrar`       | → status: encerrada     |
| POST   | `/admin/pesquisas/{id}/duplicar`       | Clonar pesquisa         |
| GET    | `/admin/pesquisas/{id}/resultados`     | Resultados agregados    |
| GET    | `/admin/pesquisas/{id}/exportar`       | CSV download            |

**POST `/admin/pesquisas`**
```json
{
  "titulo": "Pesquisa de Clima Q1 2025",
  "descricao": "...",
  "tipo": "clima",
  "anonima": true,
  "data_inicio": "2025-01-06",
  "data_fim": "2025-01-31",
  "perguntas": [
    {
      "texto": "Como você avalia o ambiente de trabalho?",
      "tipo": "likert",
      "dimensao": "ambiente_trabalho",
      "ordem": 1,
      "obrigatoria": true
    }
  ]
}
```

---

#### Colaboradores

| Método | Endpoint                                   | Descrição                  |
|--------|--------------------------------------------|----------------------------|
| GET    | `/admin/colaboradores`                     | Listar (busca, setor, status) |
| POST   | `/admin/colaboradores`                     | Criar individualmente      |
| PUT    | `/admin/colaboradores/{id}`                | Atualizar                  |
| DELETE | `/admin/colaboradores/{id}`                | Desativar (soft delete)    |
| POST   | `/admin/colaboradores/importar`            | Upload CSV (multipart)     |
| GET    | `/admin/colaboradores/template-csv`        | Download template CSV      |

**Formato do CSV de importação:**
```csv
nome,email,cpf,cargo,setor_id,status
Ana Silva,ana@empresa.com,123.456.789-00,Analista,3,ativo
```

---

#### Riscos Psicossociais

| Método | Endpoint                                | Descrição                       |
|--------|-----------------------------------------|---------------------------------|
| GET    | `/admin/riscos`                         | Listar riscos por setor         |
| GET    | `/admin/riscos/{setorId}`               | Detalhes do setor + dimensões   |
| POST   | `/admin/riscos/{setorId}/plano-acao`    | Salvar plano de ação            |

**Dimensões ISO 45003 monitoradas:**
- `demanda_trabalho` — Carga e intensidade
- `autonomia` — Controle sobre o trabalho
- `suporte_social` — Apoio de colegas e liderança
- `reconhecimento` — Valorização e recompensas
- `seguranca_emprego` — Estabilidade percebida
- `justica_organizacional` — Equidade e transparência
- `assedio_moral` — Comportamentos hostis
- `comunicacao` — Clareza e abertura

---

#### Relatórios

| Método | Endpoint                              | Descrição                       |
|--------|---------------------------------------|---------------------------------|
| GET    | `/admin/relatorios`                   | Listar relatórios               |
| POST   | `/admin/relatorios/gerar`             | Disparar geração (assíncrono)   |
| GET    | `/admin/relatorios/{id}`              | Buscar relatório pronto         |
| GET    | `/admin/relatorios/{id}/pdf`          | Download PDF (DomPDF)           |
| POST   | `/admin/relatorios/{id}/enviar`       | Enviar por email                |

**POST `/admin/relatorios/gerar`**
```json
{ "periodo": "2024-Q4", "tipo": "executivo" }
```

**Fluxo de geração:**
1. Request → cria registro com `status: gerando`
2. Dispatch `GerarRelatorioJob` na fila
3. Job chama `RelatorioIAService::gerar()`
4. Service coleta contexto → chama OpenAI → atualiza `status: pronto`
5. Frontend faz polling a cada 5s em `GET /admin/relatorios/{id}`

---

#### Empresa

| Método | Endpoint                   | Descrição                  |
|--------|----------------------------|----------------------------|
| GET    | `/admin/empresas`          | Dados da empresa do admin  |
| PUT    | `/admin/empresas/{id}`     | Atualizar dados da empresa |

---

#### Canal de Escuta (Admin)

| Método | Endpoint                              | Descrição                    |
|--------|---------------------------------------|------------------------------|
| GET    | `/admin/escuta`                       | Listar relatos (filtros)     |
| GET    | `/admin/escuta/{id}`                  | Detalhes do relato           |
| PUT    | `/admin/escuta/{id}/status`           | Atualizar status             |
| POST   | `/admin/escuta/{id}/nota`             | Adicionar nota interna       |

---

### Códigos de Resposta

| Código | Significado                                   |
|--------|-----------------------------------------------|
| 200    | Sucesso                                       |
| 201    | Criado com sucesso                            |
| 204    | Sem conteúdo (DELETE bem-sucedido)            |
| 401    | Não autenticado (token inválido/expirado)     |
| 403    | Sem permissão (role insuficiente)             |
| 404    | Recurso não encontrado                        |
| 422    | Erro de validação (`errors` no body)          |
| 429    | Rate limit excedido                           |
| 500    | Erro interno                                  |

---

## 8. Guia de Integração Frontend ↔ Backend

### Passo 1 — Configurar a URL da API

Em `src/services/api.js`:

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Accept': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('rp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

### Passo 2 — Variáveis de Ambiente

Criar `.env.local` na raiz do frontend:

```env
VITE_API_URL=http://localhost:8000/api
```

### Passo 3 — Substituir Mock por API nas Páginas

Exemplo — `Home.jsx` com API real:

```jsx
import { useEffect, useState } from 'react'
import { homeService } from '../../services/appService'

export default function Home() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    homeService.getDados()
      .then(setDados)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  // resto do componente usa `dados` ao invés de mock
}
```

### Passo 4 — Atualizar AuthContext

Em `AuthContext.jsx`, substituir mock por chamadas reais:

```jsx
import { authService } from '../services/authService'

const login = async (email, senha) => {
  const data = await authService.loginColaborador(email, senha)
  setUser(data.user)
  return data
}
```

### CORS — Configuração Laravel

Em `.env` do backend:

```env
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

Em `config/cors.php`:

```php
'allowed_origins' => [env('FRONTEND_URL')],
'supports_credentials' => true,
```

---

## 9. Módulo de IA — Relatórios

### Fluxo Completo

```
Admin clica "Gerar Relatório"
        ↓
POST /admin/relatorios/gerar { periodo, tipo }
        ↓
RelatorioController → cria Relatorio (status: gerando)
        ↓
dispatch(new GerarRelatorioJob($relatorio, $empresa))
        ↓
[FILA] GerarRelatorioJob → RelatorioIAService::gerar()
        ↓
coletarContexto() → agrega dados de CheckIns + Riscos
        ↓
chamarOpenAI() → GPT-4o-mini com JSON mode
        ↓
relatorio->update(status: pronto, conteúdo...)
        ↓
Frontend polling GET /admin/relatorios/{id}
        ↓
status === 'pronto' → renderiza relatório
```

### Dados Enviados para OpenAI

- Nome da empresa e período
- Total de colaboradores e setores
- Índice geral de clima (0-100)
- Total de check-ins no período
- Setores em risco crítico
- Dados por setor: média + total check-ins

### Estrutura de Retorno da IA

```json
{
  "resumo_executivo": "Texto analítico 2-3 parágrafos...",
  "pontos_positivos": ["item 1", "item 2", ...],
  "pontos_atencao": ["item 1", "item 2", ...],
  "recomendacoes": ["ação 1", "ação 2", ...],
  "plano_acao": [
    { "prazo": "30/06/2025", "acao": "...", "responsavel": "RH" }
  ]
}
```

### Custo Estimado OpenAI

- GPT-4o-mini: ~$0.15/M tokens input, ~$0.60/M tokens output
- Estimativa por relatório: ~2.000 tokens = **< $0.01 por relatório**

---

## 10. PWA — Configuração e Deploy

### Funcionalidades PWA Implementadas

- **Manifest** — nome, ícones, display: standalone, orientation: portrait, theme_color: #003366
- **Service Worker** — Workbox auto-gerado pelo `vite-plugin-pwa`
- **Caching** — NetworkFirst para API, CacheFirst para assets estáticos e Google Fonts
- **Offline** — Shell da aplicação disponível offline; dados mostram estado em cache

### Instalação no Dispositivo

No Chrome Mobile (Android): banner automático "Adicionar à tela inicial"
No Safari (iOS): Compartilhar → Adicionar à tela de início

### Verificar Service Worker

```bash
# Após build:
npm run build && npm run preview
# Abrir Chrome DevTools → Application → Service Workers
```

---

## 11. Segurança e LGPD

### Dados Sensíveis

| Dado          | Proteção                                          |
|---------------|---------------------------------------------------|
| CPF           | Criptografado no banco (nunca retornado na API)   |
| Senha         | Bcrypt via `Collaborador::booted()`               |
| Token FCM     | Oculto no model (`$hidden`)                       |
| Relatos anônimos | `colaborador_id` NULL + oculto no model        |
| Nota interna  | Campo `nota_interna` oculto no model público      |

### Anonimato no Canal de Escuta

Quando `modo: anonimo`:
- `colaborador_id` é `null` no banco
- O campo está no `$hidden` do model `RelatoEscuta`
- Admins nunca conseguem identificar o autor por API

### Boas Práticas Implementadas

- **Rate limiting** — Sanctum limita requisições por IP
- **CORS** — Apenas `FRONTEND_URL` autorizado
- **Sanctum tokens** — Stateless, com abilities granulares
- **Soft deletes** — Dados não são destruídos imediatamente
- **Validações** — Todos os inputs validados no backend (FormRequest)

### LGPD — Recomendações Adicionais (pendentes)

- [ ] Página de política de privacidade no frontend
- [ ] Endpoint `DELETE /app/minha-conta` para exclusão de dados
- [ ] Consentimento explícito na tela de login
- [ ] Log de auditoria para ações administrativas
- [ ] Prazo de retenção de dados por tipo

---

## 12. Arquivos Pendentes (Next Steps)

Esta seção lista tudo que precisa ser criado para o sistema estar 100% funcional.

### Prioridade Alta (Bloqueadores)

#### 1. `bootstrap/app.php` — Registro do middleware

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\EnsureRoleMiddleware::class,
    ]);
})
```

#### 2. `app/Jobs/GerarRelatorioJob.php`

```php
<?php

namespace App\Jobs;

use App\Models\Relatorio;
use App\Models\Empresa;
use App\Services\RelatorioIAService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GerarRelatorioJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Relatorio $relatorio,
        public Empresa $empresa
    ) {}

    public function handle(RelatorioIAService $service): void
    {
        $service->gerar($this->relatorio, $this->empresa);
    }
}
```

#### 3. `resources/views/pdf/relatorio.blade.php`

Template HTML para DomPDF com:
- Logo da empresa
- Cabeçalho com período e data de geração
- Resumo executivo
- Seções de pontos positivos/atenção
- Recomendações numeradas
- Plano de ação em tabela
- Rodapé com assinatura Sara Linhar Consultoria

---

### Prioridade Média (Funcionalidades)

#### 4. Controllers Admin Faltantes

**`app/Http/Controllers/Api/Admin/EmpresaController.php`**
```
GET    /admin/empresas          → buscar empresa do admin logado
PUT    /admin/empresas/{id}     → atualizar dados
POST   /admin/empresas/{id}/logo → upload logo
```

**`app/Http/Controllers/Api/Admin/EscutaController.php`**
```
GET    /admin/escuta            → listar (filtros: status, prioridade, setor)
GET    /admin/escuta/{id}       → detalhes
PUT    /admin/escuta/{id}/status → atualizar status
POST   /admin/escuta/{id}/nota  → nota interna
```

**`app/Http/Controllers/Api/Admin/ComunicadoController.php`**
```
GET    /admin/comunicados       → listar
POST   /admin/comunicados       → criar
PUT    /admin/comunicados/{id}  → editar
DELETE /admin/comunicados/{id}  → excluir
POST   /admin/comunicados/{id}/publicar → publicar
```

**`app/Http/Controllers/Api/Admin/SetorController.php`**
```
GET    /admin/setores           → listar por empresa
POST   /admin/setores           → criar
PUT    /admin/setores/{id}      → editar
DELETE /admin/setores/{id}      → excluir
```

**`app/Http/Controllers/Api/Admin/UsuarioController.php`**
```
GET    /admin/usuarios          → admins/gestores da empresa
POST   /admin/usuarios          → criar acesso
PUT    /admin/usuarios/{id}     → editar perfil/permissões
DELETE /admin/usuarios/{id}     → revogar acesso
```

**`app/Http/Controllers/Api/Admin/ConfiguracaoController.php`**
```
GET    /admin/configuracoes     → buscar configurações
PUT    /admin/configuracoes     → salvar (notificações, integrações, etc.)
```

#### 5. `app/Http/Controllers/Api/App/ComunicadoController.php`

```
GET    /app/comunicados         → listar comunicados ativos
POST   /app/comunicados/{id}/ler → marcar como lido
```

#### 6. Policies (Autorização por Recurso)

```bash
php artisan make:policy PesquisaPolicy --model=Pesquisa
php artisan make:policy RelatorioPolicy --model=Relatorio
php artisan make:policy ColaboradorPolicy --model=Colaborador
```

#### 7. Seeders

**`database/seeders/DatabaseSeeder.php`**

```php
public function run(): void
{
    $empresa = Empresa::create([
        'nome_fantasia' => 'Acme Brasil',
        'razao_social'  => 'Acme Brasil Ltda.',
        'cnpj'          => '00.000.000/0001-00',
        'email_contato' => 'rh@acmebrasil.com.br',
        'plano'         => 'profissional',
        'status'        => 'ativa',
    ]);

    $setor = Setor::create([
        'empresa_id' => $empresa->id,
        'nome' => 'Tecnologia',
        'unidade' => 'São Paulo',
    ]);

    Colaborador::create([
        'empresa_id' => $empresa->id,
        'setor_id'   => $setor->id,
        'nome'       => 'Ana Silva',
        'email'      => 'ana.silva@acmebrasil.com.br',
        'cargo'      => 'Desenvolvedora Sênior',
        'status'     => 'ativo',
        'password'   => '123456',
    ]);

    // User admin
    User::create([
        'name'     => 'Marina Souza',
        'email'    => 'marina.souza@acmebrasil.com.br',
        'password' => Hash::make('admin123'),
        'perfil'   => 'admin',
        'empresa_id' => $empresa->id,
    ]);
}
```

---

### Prioridade Baixa (Melhorias)

#### 8. FormRequests (Validação)

```bash
php artisan make:request StorePesquisaRequest
php artisan make:request StoreColaboradorRequest
php artisan make:request StoreCheckInRequest
```

#### 9. Resources (API Responses)

```bash
php artisan make:resource PesquisaResource
php artisan make:resource ColaboradorResource
php artisan make:resource RelatorioResource
```

#### 10. Testes

```bash
php artisan make:test AuthTest
php artisan make:test CheckInTest
php artisan make:test PesquisaTest
```

#### 11. `app/Http/Controllers/Api/App/PesquisaController.php` — Ajuste

Adicionar verificação se colaborador já respondeu antes de enviar respostas.

---

## 13. Roadmap de Produto

### v1.0 — MVP (atual)
- [x] PWA mobile para colaboradores
- [x] Check-in diário de humor
- [x] Pesquisas com Likert
- [x] Canal de escuta (anônimo/identificado)
- [x] Dashboard admin com KPIs
- [x] Mapa de riscos psicossociais (ISO 45003)
- [x] Relatórios executivos com IA
- [x] Gestão de colaboradores (CSV)

### v1.1 — Notificações e Engajamento
- [ ] Push notifications (Firebase FCM) para novos check-ins/pesquisas
- [ ] Lembretes semanais automáticos
- [ ] Streak de engajamento gamificado
- [ ] Comunicados com confirmação de leitura
- [ ] Célula de bem-estar: recursos de saúde mental

### v1.2 — NR-1 / PGR Compliance
- [ ] Módulo PGR — Programa de Gerenciamento de Riscos formal
- [ ] Geração de documento PGR em PDF (formato regulatório)
- [ ] Cronograma de ações PGR com prazos e responsáveis
- [ ] Evidências de cumprimento de medidas
- [ ] Relatório para e-Social

### v1.3 — Integrações
- [ ] HRIS: conectores para TOTVS, Senior, ADP
- [ ] SSO: Azure AD, Google Workspace, Okta
- [ ] Webhooks para Slack/Teams
- [ ] BI: export para Power BI / Tableau
- [ ] Integração com EAP (Programa de Assistência ao Empregado)

### v2.0 — Multi-empresa (Sara Linhar SaaS)
- [ ] Portal de consultores Sara Linhar (visão multi-empresa)
- [ ] Benchmark setorial anônimo entre empresas
- [ ] White-label para clientes enterprise
- [ ] Billing e gestão de planos no-code
- [ ] App nativo (React Native ou Capacitor)

---

## 14. Deploy em Produção

### Frontend (Vercel / Cloudflare Pages)

```bash
# Build
npm run build

# Vercel
npx vercel --prod

# Ou Cloudflare Pages
# Configure: build command = npm run build, output dir = dist
```

**Variáveis de ambiente no painel:**
```
VITE_API_URL=https://api.radarapessoas.com.br/api
```

**Importante:** Configurar redirect de SPA — todas as rotas para `index.html`:
- Vercel: `vercel.json` com rewrites
- Cloudflare: `_redirects` com `/* /index.html 200`

### Backend (Laravel Forge / Railway / VPS)

**Recomendado: Laravel Forge + DigitalOcean**

```bash
# No servidor:
composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Supervisor para filas:
php artisan queue:work --sleep=3 --tries=3 --daemon
```

**Nginx config essencial:**
```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

### Variáveis de Produção

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.radarapessoas.com.br

DB_HOST=...
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

OPENAI_API_KEY=sk-...
MAIL_MAILER=ses  # ou smtp
```

---

## 15. Variáveis de Ambiente

### Frontend (`.env.local`)

| Variável      | Exemplo                              | Descrição           |
|---------------|--------------------------------------|---------------------|
| VITE_API_URL  | `http://localhost:8000/api`          | Base URL da API     |

### Backend (`.env`)

| Variável                   | Exemplo                           | Descrição                    |
|----------------------------|-----------------------------------|------------------------------|
| APP_NAME                   | `Radar Pessoas`                   |                              |
| APP_ENV                    | `local` / `production`            |                              |
| APP_KEY                    | `base64:...`                      | Gerado por artisan key:generate |
| APP_URL                    | `http://localhost:8000`           |                              |
| DB_HOST                    | `127.0.0.1`                       |                              |
| DB_DATABASE                | `radar_pessoas`                   |                              |
| DB_USERNAME                | `root`                            |                              |
| DB_PASSWORD                | `secret`                          |                              |
| QUEUE_CONNECTION           | `database` / `redis`              |                              |
| OPENAI_API_KEY             | `sk-...`                          | OpenAI para relatórios IA    |
| FRONTEND_URL               | `http://localhost:5173`           | CORS origin                  |
| SANCTUM_STATEFUL_DOMAINS   | `localhost:5173`                  |                              |
| MAIL_MAILER                | `smtp` / `ses`                    |                              |
| MAIL_FROM_ADDRESS          | `no-reply@radarapessoas.com.br`   |                              |

---

*Documentação gerada em: Mai/2025*  
*Versão do sistema: 1.0.0-beta*  
*Stack: React 18.3 + Vite 5 + Laravel 11 + Sanctum 4 + OpenAI GPT-4o-mini*
