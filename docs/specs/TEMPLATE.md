# NNNN — <Título da feature>

- **Status:** rascunho | aprovada | implementada | arquivada
- **Data:** AAAA-MM-DD
- **Linear:** <link do projeto/épico, quando existir>

## Problema
Quem é o usuário, o que ele quer fazer, como resolve isso hoje, por que isso incomoda.

## Sucesso
Como sabemos que deu certo (métrica no PostHog, comportamento observável). Número quando possível.

## Escopo do MVP
O que a primeira versão faz. Lista curta.

## Fora de escopo (por enquanto)
O que fica de fora e por quê.

## Impacto × esforço
- Impacto: alto | médio | baixo — porquê
- Esforço: alto | médio | baixo — porquê

## Design
(preenchido pelo design-specialist)

- Fluxo de telas:
- Layout mobile:
- Layout desktop:
- Estados: vazio / carregando / erro / sucesso
- Microcopy:
- Acessibilidade:

## Impacto técnico
- Tipos novos/alterados em `types.ts`:
- Funções novas/alteradas em `api.ts`:
- Telas / componentes tocados:
- Migrations (`supabase/migrations/`): descreva; confirme que é reversível
- RLS / auth afetados? (se sim, security-reviewer obrigatório)
- Eventos PostHog a instrumentar:
- Risco de esbarrar em dívida conhecida (`App.tsx`, `api.ts`, `dangerouslySetInnerHTML`)?

## Tasks (preenchido pelo /breakdown)
- [ ] TEC-___ — ... (paralela | serial | blocked by TEC-___)

## Mudanças pós-aprovação
(registre aqui qualquer alteração de escopo depois que a spec foi aprovada)
