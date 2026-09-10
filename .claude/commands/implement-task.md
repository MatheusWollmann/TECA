---
description: Implementa uma task — react-engineer + test-specialist alinham contrato e trabalham em paralelo
---

Task: $ARGUMENTS

1. Puxe a task do Linear (ou peça o conteúdo se o MCP não estiver conectado) e leia a
   spec referenciada em `docs/specs/`.
2. Primeiro: `react-engineer` e `test-specialist` alinham o CONTRATO no chat —
   assinaturas de função, tipos novos em `types.ts`, formato de entrada/saída da `api.ts`.
   Mostre o contrato antes de codar.
3. Em paralelo: `react-engineer` implementa, `test-specialist` escreve os testes contra o
   contrato (é ok começarem vermelhos).
4. Itere até `npm run test`, `npm run typecheck` e `npm run lint` ficarem verdes no escopo.
5. Se tocou RLS, auth ou migration → rode o `security-reviewer` já aqui.
6. Ao final: resumo do que mudou, o que testar manualmente e no browser, e se o diff
   passou de ~400 linhas (se passou, proponha quebrar).

Trabalhe só no escopo desta task. Nada de refactor oportunista fora do que a task pede.
