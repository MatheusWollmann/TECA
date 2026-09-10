import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock base do cliente Supabase. Cada teste que precisa refina o retorno.
// Uso: import { supabaseMock } from '../test/setup'  e ajuste os .mockResolvedValue.
export const supabaseMock = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn(() => supabaseMock),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// api.ts importa como './lib/supabaseClient'; o alias '@' resolve para o mesmo
// módulo, então este mock intercepta ambos.
vi.mock('@/lib/supabaseClient', () => ({
  supabase: supabaseMock,
  getSupabase: () => supabaseMock,
  isSupabaseConfigured: true,
  default: supabaseMock,
}));

// jsdom não implementa matchMedia (dark mode / responsivo usam).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
