# QA do TECA

Um test case por task. É o roteiro que o `qa-tester` gera a partir da spec e que você
executa manualmente no browser — o agente não dirige mais o Chrome, só escreve o roteiro
e depois avalia o resultado.

- Nome: `<TASK-ID>.md` (ex.: `TEC-123.md`).
- Gerado e avaliado com `/qa <TASK-ID>` (veja `docs/WORKFLOW.md`, Etapa 4).
- Você preenche as colunas **Resultado** e **Observado** depois de rodar cada caso.
- `❌ Falhou` vira issue de bug no Linear, relacionada à task original — não conserte
  aqui, o loop volta para `/implement-task`.
- Arquivo fica com o `Status` final (`APROVADO` / `REPROVADO`) como registro do QA daquela
  task. Não precisa deletar depois de aprovado.
