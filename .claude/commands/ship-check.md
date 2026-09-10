---
description: Gate final antes do PR — security-reviewer + npm run check + build
---

Rode o gate de ship desta branch, em ordem. Pare no primeiro que falhar e reporte.

1. **Segurança:** subagente `security-reviewer` no diff contra `main`
   (`git diff main...HEAD`). Achado crítico ou alto → pare, devolve para `/implement-task`.
2. **Qualidade:** `npm run check` (typecheck + lint + test). Qualquer falha → pare, cole a saída.
3. **Build:** `npm run build`. Falha → pare, cole a saída.
4. **Diff:** mostre `git diff --stat main...HEAD`. Se passou de ~400 linhas, avise que
   idealmente deveria ser quebrado.

Se tudo passou: escreva um resumo pronto para virar descrição de PR — o que mudou, por quê
(link da spec), o que foi testado (unit + QA browser + manual), e riscos.
