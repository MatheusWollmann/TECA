---
description: Da spec às tasks no Linear — quebra em PRs pequenos, com dependências e paralelismo
---

Spec: $ARGUMENTS

Use o subagente `product-manager` para quebrar esta spec em tasks no Linear:

- Leia a spec inteira primeiro.
- Cada task = um PR pequeno (alvo ~400 linhas de diff). Se um item da spec é maior, divida.
- A task de teste faz parte da task de código (mesmo escopo), não é task separada.
- Marque dependências reais no Linear (`blocked by`).
- Tasks que editam o MESMO arquivo (ex.: várias mexendo em `App.tsx` ou `api.ts`) →
  label `serial`. Nunca devem rodar em paralelo.
- Defina prioridade = ordem de início.
- Cada task referencia o caminho da spec (`docs/specs/...`) na descrição.
- Se o MCP do Linear não estiver conectado, gere a lista de tasks em markdown com o mesmo
  conteúdo e avise o usuário para conectar o MCP.

Ao final, mostre: a lista de tasks, quais podem rodar em paralelo, e por qual começar.
