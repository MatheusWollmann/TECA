---
description: Da ideia à spec — product-manager + design-specialist discutem escopo e escrevem docs/specs/
---

Ideia do usuário: $ARGUMENTS

Conduza o planejamento desta feature do TECA:

1. Use o subagente `product-manager` para: fazer as perguntas que faltam, avaliar
   impacto × esforço, e cortar um MVP. Não avance enquanto houver requisito ambíguo —
   traga as perguntas para o usuário.
2. Use o subagente `design-specialist` para a UI (mobile primeiro, depois desktop),
   estados vazios/erro, e microcopy.
3. Junte tudo numa spec em `docs/specs/NNNN-slug.md` seguindo `docs/specs/TEMPLATE.md`.
   NNNN = próximo número livre em `docs/specs/`.
4. Se a feature exigir decisão de arquitetura (nova dependência, mudança de padrão de
   estado, mudança grande de schema), crie também um ADR em `docs/adr/` a partir do template.

Ao final, mostre o caminho da spec criada e um resumo de 3 linhas. NÃO comece a implementar.
