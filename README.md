# TECA

Plataforma católica de oração e comunidade: acervo de orações, devocionário rico,
círculos (comunidades) e cronograma de oração. Une pessoas pela fé, pela oração e pela
partilha espiritual.

Produção: **[teca.app.br](https://teca.app.br)**

## Stack

- **Vite 6 + React 19 + TypeScript** — SPA estática, sem SSR
- **Supabase** — autenticação, Postgres, Row Level Security, migrations
- **Tailwind CSS** (via CDN, config em `index.html`)
- **TipTap** — editor rico de orações e devoções
- **Vitest + Testing Library** — testes
- Deploy estático na **Vercel** (`dist/`)
- **PostHog** (analytics) e **Sentry** (erros/traces) — opcionais, ativados por env

## Rodando localmente

Pré-requisito: Node.js 20+.

```bash
npm install
cp .env.example .env.local     # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev                     # http://localhost:3000
```

Sem as variáveis do Supabase o app sobe, mas telas que dependem de dados vão pedir a configuração.

### Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `VITE_SUPABASE_URL` | sim | endpoint do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | sim | chave pública (anon) do Supabase |
| `VITE_POSTHOG_KEY` | não | analytics de produto (sem ela, `track()` é no-op) |
| `VITE_POSTHOG_HOST` | não | host do PostHog (padrão: US cloud) |
| `VITE_SENTRY_DSN` | não | captura de erros (sem ela, só `console.error`) |

Nunca coloque chave `service_role` nem chave de API de terceiros no frontend — use Supabase Edge Functions.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (porta 3000) |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o build localmente |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm run test` / `test:watch` | Vitest |
| `npm run check` | typecheck + lint + test (rodar antes de todo PR) |
| `npm run import-prayers:*` | importa o catálogo de `data/prayers-bulk.json` para SQL de seed |

## Estrutura

```
App.tsx              raiz da SPA, navegação por estado
api.ts               camada única de acesso a dados (Supabase)
types.ts             tipos de domínio
screens/             telas
components/           componentes reutilizáveis (+ components/rich = editor TipTap)
lib/                 supabaseClient, analytics (PostHog), observability (Sentry)
supabase/            migrations, seeds, config
scripts/             importação/scraping de orações
docs/                DEPLOY.md, WORKFLOW.md, specs/, adr/
.claude/             agentes e comandos do workflow de desenvolvimento
```

## Desenvolvimento

O projeto usa um workflow com agentes (planejamento → spec → tasks → implementação
paralela → QA → CI). Veja **[docs/WORKFLOW.md](docs/WORKFLOW.md)** e o contexto em
[CLAUDE.md](CLAUDE.md).

## Deploy

Passo a passo completo (Supabase, frontend, DNS, LGPD) em **[docs/DEPLOY.md](docs/DEPLOY.md)**.
