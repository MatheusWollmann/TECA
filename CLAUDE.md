# CLAUDE.md — TECA

## O que é o TECA
App católico: devocionário + acervo de orações + círculos/comunidades + cronograma de
oração. É uma SPA (sem SSR). Solo founder.

## Stack
- **Vite 6 + React 19 + TypeScript**, SPA estática. Sem SSR, sem router lib (navegação por estado em `App.tsx`).
- **Supabase** — auth, Postgres, RLS. Cliente em `lib/supabaseClient.ts`. Migrations em `supabase/migrations/`.
- **Tailwind via CDN** — config inline em `index.html`. Não há build de CSS nem `tailwind.config.js`.
- **TipTap** — editor rich em `components/rich/`.
- **Deploy:** Vercel (estático, publica `dist/`), config em `vercel.json`. `netlify.toml` é fallback.
- **Analytics:** PostHog — wrapper em `lib/analytics.ts`.
- **Erros / traces:** Sentry — wrapper em `lib/observability.ts`.

## Convenções de código
- Um componente por arquivo, PascalCase. Telas em `screens/`, reutilizáveis em `components/`.
- Sem state manager global. `useState` / `useMemo` / context. Introduzir Redux/Zustand só com ADR.
- Tipos centrais em `types.ts`. Toda entidade nova entra lá.
- **Acesso a dados só via `api.ts`.** Telas e componentes nunca importam `supabase` direto.
- Datas trafegam como string ISO; formata só na borda de renderização.
- `dangerouslySetInnerHTML` é proibido para conteúdo vindo de usuário sem sanitização. Usar o renderer do TipTap.
- Nenhum segredo no bundle client. Chave de serviço → Supabase Edge Function.
- Português nos textos de UI e nos nomes de domínio (oração, devoção, círculo, acervo).

## Dívida técnica conhecida (candidata a virar spec)
- `App.tsx` (~1067 linhas), `api.ts` (~853), `screens/CommunityDetailScreen.tsx` (~847) são monolíticos — difíceis para agentes editarem em paralelo. Dividir incrementalmente.
- 9 usos de `dangerouslySetInnerHTML` — auditar (XSS no acervo/wiki de orações).
- Bundle único de ~944 KB (sem code-splitting). Considerar `manualChunks` / `import()` dinâmico.
- Zero testes antes deste workflow.
- Se for adicionar IA (ex.: Gemini): a chamada vai numa Supabase Edge Function, nunca no bundle client. O projeto já teve `@google/genai` como scaffold do template do AI Studio (removido por não ter uso).

## Fluxo de trabalho
Detalhes em `docs/WORKFLOW.md`. Resumo:

1. `/plan-feature <ideia>` — `product-manager` + `design-specialist` discutem escopo, impacto×esforço, MVP e UI. Gravam a spec em `docs/specs/`.
2. `/breakdown <spec>` — quebra a spec em tasks no Linear, maximizando paralelismo, com dependências e prioridade.
3. Por task, 1 worktree (Conductor): `/implement-task <TASK-ID>` — `react-engineer` + `test-specialist` alinham o contrato e trabalham em paralelo.
4. `/qa` — `qa-tester` sobe o dev server e testa no browser real. Bug → volta ao passo 3.
5. `/ship-check` — `security-reviewer` + `npm run check` (types + lint + test) + `npm run build`. Falha → volta.
6. Você revisa o diff e abre o PR. CI roda (`.github/workflows/ci.yml`).
7. CI verde + QA + teste manual → merge → Vercel faz o deploy.
8. Teste manual em prod → observa Sentry + PostHog → novas ideias → volta ao passo 1.

### Agentes (`.claude/agents/`)
| Agente | Quando usar |
|---|---|
| `product-manager` | Escopo, impacto×esforço, MVP, escrever spec, criar tasks no Linear |
| `design-specialist` | UI/UX mobile + desktop, dentro do design system do TECA |
| `react-engineer` | Implementação em React / TS / Supabase |
| `test-specialist` | Vitest + Testing Library, define o contrato de teste antes do código |
| `qa-tester` | Testa no browser real via MCP, reporta bugs reproduzíveis |
| `security-reviewer` | Revisa o diff: RLS, auth, XSS, segredos no bundle |

## Comandos
- `npm run dev` — servidor local (porta 3000)
- `npm run build` — build de produção (`dist/`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` / `npm run lint:fix`
- `npm run test` / `npm run test:watch`
- `npm run check` — typecheck + lint + test. **Roda antes de todo PR.**

## Regras para os agentes
- Toda task começa lendo a spec correspondente em `docs/specs/`.
- Não fechar uma task sem: (a) teste novo cobrindo o comportamento, (b) `npm run check` verde, (c) nota no PR do que foi testado manualmente.
- Mudança em `supabase/migrations/` é sempre reversível (expand/contract). Nada destrutivo sem aprovação explícita no chat.
- Qualquer mudança em RLS ou auth exige passar pelo `security-reviewer`.
- PR pequeno. Passou de ~400 linhas de diff, quebrar em mais de um.
- Instrumentar evento no PostHog (`lib/analytics.ts`) para todo fluxo novo de usuário.
