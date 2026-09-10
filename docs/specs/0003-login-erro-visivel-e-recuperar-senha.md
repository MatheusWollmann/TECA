# 0003 — Erro de login visível + recuperar senha

- **Status:** aprovada
- **Data:** 2026-09-10
- **Linear:** (criar épico ao conectar o MCP)

## Problema
Quem tenta entrar no TECA com a senha errada **não recebe nenhum feedback** — a tela pisca
e volta pro estado deslogado, parecendo que o app está quebrado (caso real, 2026-09-10).
E não existe "esqueci minha senha": a única forma de recuperar é pelo painel do Supabase.

Resultado: usuário acha que a conta sumiu, ou desiste.

## Sucesso
- Senha errada → mensagem clara em português na própria tela de login, em < 1s.
- Usuário consegue redefinir a senha sozinho, sem suporte.
- Métrica PostHog: `auth_login_failed` (com motivo) e `auth_password_reset_requested` /
  `auth_password_reset_completed`. Queda nos tickets de "não consigo entrar".

## Escopo do MVP
1. **Erro de login visível** — toda falha de `signInWithPassword` mostra mensagem na
   `AuthScreen`, traduzida (`invalid_credentials` → "E-mail ou senha incorretos.",
   `email_not_confirmed` → "Confirme seu e-mail antes de entrar.", genérico → "Não foi
   possível entrar. Tente de novo.").
2. **Pedir link de recuperação** — link "Esqueci minha senha" na tela de login → informa
   o e-mail → "Se existe uma conta com esse e-mail, enviamos um link para redefinir a
   senha." (mensagem neutra, não revela se a conta existe).
3. **Redefinir a senha** — o link do e-mail abre o TECA num modo "definir nova senha";
   usuário digita a nova senha (2x) → entra logado.

## Fora de escopo (por enquanto)
- Trocar senha dentro da área logada (perfil).
- Login social / magic link.
- Rate-limit próprio (o Supabase já limita `resetPasswordForEmail`).
- Página de recuperação com design elaborado — tela mínima funcional basta.

## Impacto × esforço
- Impacto: **alto** — bloqueia acesso, causa impressão de app quebrado.
- Esforço: **baixo** para o item 1; **médio** para 2+3 (o TECA não tem rota/URL handling,
  então a landing de recuperação precisa ler o hash no bootstrap).

## Design
(design-specialist)

### Tela de login — estados
- **Erro:** a caixa vermelha que já existe em `AuthScreen` (`bg-red-50 ...`), agora
  realmente populada. Mensagem curta, sem jargão. Foco vai pro campo de senha.
- **Novo link:** abaixo do botão "Entrar", alinhado à direita, discreto:
  `Esqueci minha senha` (texto `text-gold-subtle`, mesmo estilo do "Cadastre-se").

### Modo "esqueci senha" (dentro da AuthScreen, sem tela nova)
```
   Teca
   Recuperar acesso

   E-mail  [ exemplo@email.com        ]
           [  Enviar link de recuperação  ]

   ← Voltar para o login
```
Depois de enviar: troca o formulário por um estado de sucesso com o texto neutro +
"← Voltar para o login". Não fica em loading infinito se o e-mail não existir.

### Tela "definir nova senha" (`ResetPasswordScreen`, mínima)
```
   Teca
   Defina uma nova senha

   Nova senha        [ ******** ]
   Confirmar senha   [ ******** ]
           [  Salvar e entrar  ]
```
- Valida: mínimo 8 caracteres, as duas iguais. Erro na mesma caixa vermelha.
- Sucesso → já está logado → vai pra Home.
- Link inválido/expirado → mensagem + botão "Pedir novo link".

### Microcopy
- "E-mail ou senha incorretos."
- "Se existe uma conta com esse e-mail, enviamos um link para redefinir a senha."
- "Link expirado. Peça um novo abaixo."
- "As senhas não coincidem."

### Acessibilidade
- `aria-live="polite"` na caixa de erro (leitor de tela anuncia).
- Botões com estado `disabled` + spinner durante a chamada (a `AuthScreen` já faz isso
  com `isLoggingIn` — reusar).

## Impacto técnico

### Bug do erro invisível — causa raiz
`App.tsx` `handleLogin` chama `setIsLoading(true)`. Isso faz o `App` renderizar o loader
de tela cheia (`if (isLoading) return <LoaderIcon>`), **desmontando a `AuthScreen`**. No
erro, o `finally { setIsLoading(false) }` monta uma `AuthScreen` **nova** (com `error=''`),
e o `catch` que chama `setError` roda na instância morta.

**Correção:** `handleLogin` não deve mexer no `isLoading` global. A `AuthScreen` já tem
`isLoggingIn` para o estado do botão. Remover `setIsLoading(true/false)` de `handleLogin`
(manter o `try/finally` só em volta do que precisa). Assim a `AuthScreen` permanece
montada e a mensagem aparece.

### Arquivos
- `screens/AuthScreen.tsx` — modo `'forgot'`, link "Esqueci minha senha", estado de sucesso.
- `screens/ResetPasswordScreen.tsx` — **novo**, tela de nova senha.
- `App.tsx` — `handleLogin` sem `isLoading`; no bootstrap, detectar
  `window.location.hash` com `type=recovery` → renderizar `ResetPasswordScreen`.
- `api.ts` — `requestPasswordReset(email)` (`supabase.auth.resetPasswordForEmail(email, { redirectTo })`),
  `completePasswordReset(newPassword)` (`supabase.auth.updateUser({ password })`),
  e helper para estabelecer sessão a partir do hash (`supabase.auth.setSession`).
- `lib/authErrors.ts` — **novo**, mapa `error_code`/`message` → texto PT.
- `lib/supabaseClient.ts` — avaliar `detectSessionInUrl`. Hoje é `false` (evita hang no
  bootstrap). Manter `false` e tratar o hash de recovery **manualmente** no `App.tsx`
  (mais previsível que ligar a detecção automática e mexer no bootstrap todo).
- `types.ts` — sem entidade nova.

### Migrations / RLS
Nenhuma. Não toca banco.

### Config (fora do código — task própria)
Supabase → Authentication → URL Configuration → Redirect URLs:
adicionar `https://www.teca.app.br/**` e `http://localhost:3000/**` (hoje só há
`https://teca.app.br/**` — e o site redireciona para `www`).

### Eventos PostHog
`auth_login_failed` `{reason}`, `auth_password_reset_requested`, `auth_password_reset_completed`.
(instrumentar via `lib/analytics.ts` — que ainda precisa ser inicializado no `index.tsx`;
se ficar fora do escopo, deixar `// TODO analytics` e anotar.)

## Tasks (preenchido pelo /breakdown)
Todas tocam `AuthScreen.tsx` e/ou `App.tsx` → **serial**, nesta ordem:

- [ ] **TEC-1** — Erro de login visível + `lib/authErrors.ts` + mensagens PT.
      `App.tsx` (handleLogin sem isLoading), `AuthScreen.tsx`, teste do test-specialist,
      QA: senha errada mostra mensagem. *Independente, entrega primeiro.*
- [ ] **TEC-2** — "Esqueci minha senha": modo forgot na `AuthScreen` + `api.requestPasswordReset`.
      `blocked by TEC-1` (mesmo arquivo).
- [ ] **TEC-3** — `ResetPasswordScreen` + detecção do hash de recovery no `App.tsx` +
      `api.completePasswordReset`. `blocked by TEC-2`. **QA no browser obrigatório**
      (fluxo real de e-mail, usar staging/preview).
- [ ] **TEC-4** — (config, humano) Redirect URLs no Supabase. `blocked by` nada; fazer antes do deploy da TEC-3.

## Mudanças pós-aprovação
(nada ainda)
