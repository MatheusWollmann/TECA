---
description: QA no browser real — qa-tester executa os fluxos da spec e reporta bugs
---

Task: $ARGUMENTS

1. Garanta que `npm run dev` está no ar (porta 3000). Se não, suba em background.
2. Use o subagente `qa-tester` para testar a task no Chrome via MCP:
   - fluxos da spec, item por item
   - mobile (~390px) e desktop
   - caminho feliz, vazio, erro de rede, deslogado/logado, dark mode
   - console e network limpos
3. Se houver bug: NÃO conserte aqui. Mostre o report (passos, esperado vs observado,
   erro do console) e diga que o loop volta para `/implement-task`.
4. Se tudo passar: escreva "QA aprovado para <task>" com a lista do que foi verificado.
