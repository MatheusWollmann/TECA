# 0001 — Workflow de desenvolvimento com agentes

- **Status:** aceito
- **Data:** 2026-09-10

## Contexto
TECA é tocado por um solo founder. Sem testes, sem CI, sem lint, sem observabilidade até
aqui. O risco é acumular slop e tickets de bug. Referência: o fluxo público do @gkpacker
(PM/design agents → Linear → execução paralela em worktrees → QA → CI → prod → métricas).

## Decisão
Adotar um pipeline com agentes especializados do Claude Code (`product-manager`,
`design-specialist`, `react-engineer`, `test-specialist`, `qa-tester`, `security-reviewer`),
specs versionadas em `docs/specs/`, tasks no Linear, execução paralela via Conductor
(worktrees), CI no GitHub Actions, e observabilidade com Sentry + PostHog.

## Alternativas consideradas
- **Continuar ad-hoc** — rápido no curtíssimo prazo, mas não escala e não previne regressão.
- **Só CI, sem agentes** — melhora a rede de segurança mas não muda a velocidade de entrega.
- **Ferramentas pagas de orquestração além do Conductor** — adiado; começar com o mínimo.

## Consequências
- Mais fácil: paralelizar trabalho, revisar, pegar regressão antes de prod, dar contexto a agentes.
- Mais difícil: overhead de escrever spec antes de codar; disciplina de manter o `CLAUDE.md` atualizado.
- Precisa: `npm install` das novas dev deps; branch protection + Merge Queue no GitHub;
  MCPs do Linear e do Chrome DevTools conectados.
- Primeiras tasks de dívida a agendar: zerar os erros de tipo (spec 0002), dividir
  `App.tsx`/`api.ts`, auditar `dangerouslySetInnerHTML`, code-splitting do bundle.

## Notas
- O scaffold do template do AI Studio (README, `metadata.json`, importmap `aistudiocdn.com`,
  `@google/genai` + `vite.config` define) foi removido — não tinha uso no código.
