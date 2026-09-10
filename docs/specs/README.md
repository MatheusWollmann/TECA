# Specs do TECA

Uma spec por feature. É o **contrato** entre o planejamento e a implementação: os agentes
de código só recebem a spec + o `CLAUDE.md` como contexto.

- Nome: `NNNN-slug.md` (`0001-`, `0002-`, ...).
- Crie com `/plan-feature`.
- Quebre em tasks com `/breakdown`.
- Uma spec fechada não some — se mudar de ideia, edite a spec e anote a mudança no fim.

Decisões de arquitetura (nova dependência, mudança de padrão) vão em `docs/adr/`, não aqui.
