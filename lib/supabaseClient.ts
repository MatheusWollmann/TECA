import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url?.trim() && anonKey?.trim());

let client: SupabaseClient | null = null;

function getOrCreateClient(): SupabaseClient {
  const u = url?.trim();
  const k = anonKey?.trim();
  if (!u || !k) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example).');
  }
  if (!client) {
    client = createClient(u, k, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Evita travar o bootstrap em URLs com hash/código (ex.: OAuth mal configurado).
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/**
 * Cliente único, criado só na primeira chamada (evita erro na importação
 * quando o .env ainda não existe — ex.: tela branca no `npm run dev`).
 */
export function getSupabase(): SupabaseClient {
  return getOrCreateClient();
}

/** Compatível com uso existente `supabase.from(...)`; inicializa sob demanda. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getOrCreateClient();
    const value = Reflect.get(c, prop, c);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(c) : value;
  },
});
