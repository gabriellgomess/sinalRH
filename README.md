# SinalRH · Plataforma Sara Linhar Consultoria

People Analytics + cumprimento de NR-1 / PGR para empresas brasileiras.
Consultoria especializada em saúde organizacional + plataforma estruturada
para coletar, organizar e auditar o ciclo psicossocial.

![CI](https://github.com/SEU-USUARIO/SEU-REPO/actions/workflows/ci.yml/badge.svg)

## Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts + PWA
- **Backend**: Laravel 11 + Sanctum + Pest + DomPDF + OpenAI
- **Banco**: MySQL (produção) / SQLite (testes em memória)
- **Filas**: Redis (recomendado) ou database

## Estrutura

```
.
├── src/              # Frontend React
├── public/           # Assets estáticos (logos, ícones, manifesto PWA)
├── backend/          # API Laravel 11
│   ├── app/
│   ├── database/migrations/
│   ├── routes/api.php
│   ├── resources/views/pdf/
│   └── tests/Feature/
└── .github/workflows/ci.yml
```

## Setup local

### Pré-requisitos

- Node 20+
- PHP 8.2+
- Composer 2+
- MySQL 8+ (ou MariaDB 10.6+) para desenvolvimento; SQLite serve para testes

### Frontend

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build de produção em dist/
```

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve    # http://localhost:8000
```

## Testes

```bash
cd backend && php artisan test
```

Atualmente: **28 testes Pest / 142 asserções** cobrindo NR-1, dossiê de
auditoria, plano de ação, anexos, histórico de versões, importação de
colaboradores, convite, relatórios, configurações e produtos contratados.

## CI

Workflow GitHub Actions roda automaticamente em cada `push` e `pull_request`
para `main`, `master` ou `develop`. Dois jobs paralelos:

- **Backend**: `composer install` + `php artisan test`
- **Frontend**: `npm ci` + `npm run build`

Veja `.github/workflows/ci.yml`.

## Módulos principais

| Módulo | Status |
|---|---|
| Check-ins semanais de humor | OK |
| Pesquisas de clima customizáveis | OK |
| Canal de escuta anônimo | OK |
| Mapa de riscos psicossociais | OK |
| Relatórios executivos automatizados | OK |
| NR-1 / PGR — Onda 1 (versionamento, alerta, PDF regulatório) | OK |
| NR-1 / PGR — Onda 2 (evidências por ação, histórico de versões) | OK |
| NR-1 / PGR — Onda 3.A (cronograma Gantt) | OK |
| NR-1 / PGR — Dossiê de auditoria (11 pastas + ZIP) | OK |
| Plataforma super-admin (Sara Linhar) | OK |
| Catálogo de produtos contratados | OK |
| Onboarding self-service em 3 passos | OK |
| Site institucional + pricing | OK |
| Integração Asaas (billing recorrente) | Pendente |
| NR-1 / PGR — Onda 3.B (XML e-Social S-2240) | Pendente |

## Documentação

Documentação detalhada do projeto em [`DOCUMENTACAO.md`](DOCUMENTACAO.md) e
roadmap evolutivo em [`ANALISE-E-MELHORIAS.md`](ANALISE-E-MELHORIAS.md).
