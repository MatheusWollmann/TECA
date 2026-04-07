# Deploy TECA (teca.app.br)

## 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (região próxima ao Brasil, se disponível).
2. No **SQL Editor**, execute o conteúdo de [`supabase/migrations/20260402120000_initial_schema.sql`](../supabase/migrations/20260402120000_initial_schema.sql) **na ordem** (ou use a CLI: `supabase link` + `supabase db push`).
3. Opcional: rode [`supabase/seed.sql`](../supabase/seed.sql) para popular orações iniciais.
4. **Authentication → URL configuration**
   - **Site URL**: `https://teca.app.br`
   - **Redirect URLs**: `https://teca.app.br/**`, `http://localhost:3000/**` (desenvolvimento)
5. Se quiser login imediato sem e-mail: **Authentication → Providers → Email** — desative “Confirm email” em ambientes de teste (em produção avalie manter confirmação).
6. **Primeiro editor**: após criar sua conta, no SQL Editor:

   ```sql
   update public.profiles set role = 'EDITOR' where email = 'seu@email.com';
   ```

## 2. Variáveis de ambiente

Copie [`.env.example`](../.env.example) para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

No provedor de hospedagem do frontend (Vercel, Netlify, Cloudflare Pages, etc.), defina as mesmas variáveis com prefixo `VITE_` no **build**.

**Nunca** coloque a chave `service_role` no frontend nem no repositório público.

## 3. Frontend estático

- **Build**: `npm ci && npm run build`
- **Pasta de saída**: `dist`
- Conecte o repositório Git ao provedor e configure as variáveis acima.

Arquivos de exemplo neste repositório:

- [`vercel.json`](../vercel.json) — rewrite SPA
- [`netlify.toml`](../netlify.toml) — redirect para `index.html`

## 4. DNS (teca.app.br)

No registrador do domínio, aponte o hostname conforme o provedor:

- **Cloudflare Pages**: CNAME para `xxxx.pages.dev`
- **Vercel**: registros indicados no painel do projeto
- **Netlify**: CNAME para `xxxx.netlify.app`

Ative HTTPS no painel do provedor (geralmente automático).

## 5. Segurança e LGPD

- Todas as tabelas públicas usam **Row Level Security**; revise políticas antes de escalar.
- Para dados pessoais (e-mail, nomes), mantenha política de privacidade e base legal adequados à LGPD.
- Chaves de APIs de terceiros (ex.: Gemini) devem ficar em **Edge Functions** ou backend, não em `VITE_*`.

## 6. Storage

O bucket `prayer-images` é criado pela migration. Ajuste políticas no Supabase se quiser uploads apenas para certos papéis.
