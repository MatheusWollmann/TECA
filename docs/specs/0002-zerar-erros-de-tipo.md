# 0002 — Zerar os erros de tipo herdados

- **Status:** aprovada
- **Data:** 2026-09-10
- **Linear:** (criar épico)

## Problema
O TECA nunca rodou `tsc`. Ao adicionar `npm run typecheck`, apareceram 14 erros de tipo
no código existente. Alguns são bugs de runtime de verdade (referência a variável que não
existe → `ReferenceError` quando o usuário clica). O CI está com `continue-on-error: true`
no passo de typecheck até isso zerar.

## Sucesso
- `npm run typecheck` sai com 0 erros.
- Remover `continue-on-error: true` do passo Typecheck em `.github/workflows/ci.yml`.
- Nenhuma regressão visível no app (validar no browser as telas tocadas).

## Escopo do MVP
Corrigir os 14 erros abaixo. Cada grupo pode ser uma task independente (arquivos diferentes),
exceto onde indicado `serial`.

### Grupo A — `components/Icons.tsx` + `App.tsx` (5 erros) — `serial` com quem mais tocar Icons
`App.tsx` passa `style={...}` para componentes de ícone que só aceitam `className`.
Opções: (a) adicionar `style?: React.CSSProperties` a `IconProps` e repassar em cada ícone;
(b) trocar os 5 usos por classe utilitária. Decidir com o design-specialist.
Linhas: `App.tsx` ~718–720, ~1015–1016.

### Grupo B — `api.ts` (2 erros)
- `total_prayers` não existe no escopo (linha ~609) — provável era `totalPrayers` ou
  `row.total_prayers`. Confirmar qual valor deve ir no `.update({...})`. **Bug real:** o
  update pode estar gravando errado ou quebrando.
- Expressão sempre `truthy` (linha ~747): `[...arr] as string[] || []` — o `|| []` é morto.
  Ajustar para tratar `moderator_ids` nulo antes do spread.

### Grupo C — `screens/HomeScreen.tsx` (4 erros) — **bug de runtime**
`setScheduleTime`, `setScheduleLabel`, `setSearchTerm`, `setIsModalOpen` são usados mas
nunca declarados (linhas ~144–148). Ou faltou o `useState`, ou é código morto de um
refactor pela metade. Investigar no browser: a tela abre? o modal de agendar funciona?
Reintroduzir o estado que falta OU remover o código morto.

### Grupo D — `screens/EditPrayerScreen.tsx` (3 erros)
- Dois usos de um componente de textarea sem passar `onPrayerLink` (obrigatório) — linhas ~206, ~216.
- Uso de `PrayerDetailScreen` sem `onEdit` (obrigatório) — linha ~232.
  Decidir: a prop é mesmo obrigatória? Se opcional, marcar `?` na definição. Se não,
  passar o handler.

## Fora de escopo
- Refatorar `App.tsx` / `api.ts` (monolitos) — vira spec própria.
- Apertar regras de ESLint hoje em `warn` — outra spec.

## Impacto × esforço
- Impacto: alto (2 bugs de runtime escondidos) — Esforço: baixo/médio.

## Impacto técnico
- Tipos possivelmente ajustados em `components/Icons.tsx`, `screens/EditPrayerScreen` props.
- Sem migration. Sem RLS. Sem evento novo de PostHog.
- Cada grupo: adicionar teste do `test-specialist` cobrindo o comportamento corrigido
  (especialmente Grupo C — teste de render + abrir modal).

## Tasks
- [ ] TEC-___ — Grupo A: `style` em ícones
- [ ] TEC-___ — Grupo B: `api.ts` total_prayers + moderator_ids
- [ ] TEC-___ — Grupo C: estado faltando em HomeScreen (QA no browser obrigatório)
- [ ] TEC-___ — Grupo D: props obrigatórias em EditPrayerScreen
- [ ] TEC-___ — remover `continue-on-error` do CI (blocked by todos acima)
