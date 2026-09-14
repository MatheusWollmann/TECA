---
description: QA sem browser no agente — gera o test case, você roda manualmente, o agente avalia o resultado e cria issues de bug
---

Task: $ARGUMENTS

Use o subagente `qa-tester` para a task acima. Ele decide sozinho o modo pelo estado de
`docs/qa/<TASK-ID>.md`:

- **Se o arquivo não existe ou está sem resultado preenchido**: ele gera o test case
  (casos de teste derivados da spec, cobrindo mobile/desktop, vazio, erro de rede,
  deslogado/logado, dark mode) e para. Rode `npm run dev`, siga o roteiro manualmente no
  Chrome, preencha Resultado/Observado no arquivo, e rode `/qa <TASK-ID>` de novo.
- **Se o arquivo já tem resultado preenchido**: ele lê o resultado, cria uma issue no
  Linear para cada linha ❌ Falhou (relacionada à task original), e marca o arquivo como
  APROVADO ou REPROVADO.

Se `REPROVADO`: não conserte aqui — mostre as issues criadas e diga que o loop volta para
`/implement-task <TASK-ID>` depois de resolvidas.
