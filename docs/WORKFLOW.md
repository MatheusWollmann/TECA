# Workflow de desenvolvimento com agentes — TECA

Inspirado no fluxo do @gkpacker, adaptado para o stack do TECA (Vite + React + Supabase).
O objetivo **não é velocidade** — é reliability: prevenir slop, garantir que tudo é
testado, reduzir tickets de bug e suporte.

```
                 ┌─────────────── Claude Code (sessão de planejamento) ───────────────┐
  Nova ideia ──▶ │  product-manager  ─┐                                               │
                 │  design-specialist ─┴─▶ spec em docs/specs/  ─▶  tasks no Linear    │
                 └───────────────────────────────────────────────────────────────────┘
                                                    │
                 ┌────────────── Conductor — 1 worktree por task, em paralelo ─────────┐
                 │  react-engineer ─┐                                                  │
                 │  test-specialist ─┴─▶ QA (qa-tester, browser real) ──┐              │
                 │       ▲                                              │ bug          │
                 │       └──────────────────────────────────────────────┘              │
                 │  ship-check: security-reviewer + npm run check + build ─┐ falha ────┘
                 └────────────────────────────────────────────────────────┘
                                                    │  ok
                 revisão humana do diff ──▶ PR ──▶ CI (GitHub Actions) ──┐ falha ──▶ volta
                                                    │ verde              │
                 teste manual (local / preview Vercel) ──▶ merge ──▶ CD (Vercel) ──▶ prod
                                                    │
                 teste manual em prod ──▶ Sentry (erros/traces) + PostHog (adoção) ──▶ novas ideias ──▶ (recomeça)
```

## Pré-requisitos (uma vez)

1. **Linear** — workspace/time criado. MCP oficial da Linear (servidor remoto, OAuth):
   ```
   claude mcp add --transport http --scope project linear https://mcp.linear.app/mcp
   ```
   Depois rode `/mcp` no Claude Code para autenticar no navegador.
2. **Conductor** — app instalado, repo aberto, integração com Linear e GitHub ativada.
3. **Browser MCP** para o `qa-tester`:
   ```
   claude mcp add --scope project chrome-devtools -- npx -y chrome-devtools-mcp@latest
   ```
4. **GitHub** — branch protection em `main`: exigir CI verde + 1 review. Ativar Merge Queue
   quando começar a rodar várias tasks em paralelo.
5. `.env.local` preenchido a partir de `.env.example`.
6. `npm install` (instala as dev deps de lint/test adicionadas por este setup).

## Etapa 1 — Da ideia à spec

Abra uma sessão do Claude Code na raiz do repo:

```
/plan-feature Quero um calendário mensal do cronograma de oração, com dias 100% concluídos destacados
```

O `product-manager` puxa o `design-specialist`. Eles fazem perguntas, avaliam impacto ×
esforço, cortam escopo até um MVP e escrevem `docs/specs/NNNN-nome.md` (template em
`docs/specs/TEMPLATE.md`). **Revise a spec** antes de seguir — é o artefato que todos os
agentes seguintes vão ler.

## Etapa 2 — Da spec às tasks

```
/breakdown docs/specs/0007-calendario-cronograma.md
```

O `product-manager` cria as issues no Linear:
- Cada task é pequena e independente sempre que possível.
- Dependências explícitas (`blocks` / `blocked by`).
- Tasks que tocam os mesmos arquivos ganham label `serial` — **não rodar em paralelo**.
- Ordem de início nas prioridades.

## Etapa 3 — Implementação (Conductor, em paralelo)

Para cada task sem bloqueio, abra um worktree no Conductor e rode:

```
/implement-task TEC-123
```

O `react-engineer` e o `test-specialist` primeiro **alinham o contrato** (assinaturas de
função, tipos em `types.ts`, formato de resposta da `api.ts`), depois trabalham em
paralelo — um no código, outro nos testes. Nada de teste é escrito depois "pra fechar":
o teste descreve o comportamento esperado antes.

> Sem Conductor: `scripts/worktree.sh new TEC-123` cria o worktree + branch manualmente.

## Etapa 4 — QA no browser

No worktree, com o server no ar (`npm run dev`):

```
/qa TEC-123
```

O `qa-tester` abre o Chrome via MCP, executa os fluxos da spec, verifica console/network,
e reporta bugs reproduzíveis. **Bug → volta pra Etapa 3** no mesmo worktree.

## Etapa 5 — Ship check

```
/ship-check
```

Roda em sequência:
1. `security-reviewer` no diff (RLS, auth, XSS, segredo no bundle).
2. `npm run check` (typecheck + lint + test).
3. `npm run build`.

Qualquer falha → volta pra Etapa 3.

## Etapa 6 — PR e CI

Você revisa o diff no Conductor, aplica ajustes, abre o PR (`cmd+shift+P` no Conductor).
O CI (`.github/workflows/ci.yml`) roda typecheck + lint + test + build. Falha → volta ao começo.

## Etapa 7 — Teste manual e merge

CI verde + QA ok → teste manual você mesmo, no preview da Vercel (deploy automático do PR)
ou local. Validado → merge (via Merge Queue quando houver paralelismo). Vercel publica prod.

## Etapa 8 — Observar

- Teste manual rápido em prod.
- **Sentry** — erros novos, traces lentos. Erro → issue no Linear, volta ao fluxo.
- **PostHog** — adoção da feature, funil, onde o usuário trava. Vira insumo pro
  `product-manager` na próxima ideia.

## Loops de correção (não pule)

| Onde falhou | Volta para |
|---|---|
| QA (browser) | Etapa 3, mesmo worktree |
| Ship check | Etapa 3 |
| CI | Etapa 3 |
| Teste manual | Etapa 3, ou re-scope na spec |
| Prod (Sentry) | Nova task no Linear |

## Próximo passo (automação)

Fazer o Linear disparar a Etapa 3 sozinho (sem `/implement-task` manual). Só depois de:
- Merge Queue ativo.
- Specs versionadas confiáveis (o agente autônomo só tem a spec + o CLAUDE.md de contexto).
- Gate: agente abre PR como **draft**; você aprova em lote.
- Serialização garantida de tasks que tocam schema, `App.tsx`, `api.ts` ou routing.
- Teto de custo / limite de tentativas por task.
