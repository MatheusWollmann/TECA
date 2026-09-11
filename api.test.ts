import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api';
import { supabaseMock } from './test/setup';

// Contrato da spec 0002 (Grupo B):
// - `updateUserGraces` deve gravar `total_prayers` = valor lido + 1 (hoje grava `undefined`).
// - `updateMemberRole` deve tratar `moderator_ids` nulo/undefined sem lançar `TypeError`.

beforeEach(() => {
  supabaseMock.from.mockClear();
  supabaseMock.select.mockClear();
  supabaseMock.eq.mockClear();
  supabaseMock.order.mockClear();
  supabaseMock.insert.mockClear();
  supabaseMock.delete.mockClear();
  supabaseMock.update.mockReset().mockReturnThis();
  supabaseMock.single.mockReset().mockResolvedValue({ data: null, error: null });
  supabaseMock.auth.resetPasswordForEmail.mockReset();
  // fetchCirculoById usa `.maybeSingle()`, que não está no mock base.
  (supabaseMock as unknown as Record<string, unknown>).maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: null, error: null });
});

describe('api.updateUserGraces', () => {
  it('grava total_prayers como o valor lido + 1 (5 -> 6), nunca undefined', async () => {
    supabaseMock.single.mockResolvedValueOnce({
      data: { graces: 10, total_prayers: 5, level: 'Iniciante', history: {}, streak: 0 },
      error: null,
    });

    await api.updateUserGraces('u1', 20);

    const updateArg = supabaseMock.update.mock.calls.at(-1)?.[0] as {
      total_prayers?: number;
      graces?: number;
    };
    expect(updateArg).toBeDefined();
    expect(updateArg.total_prayers).toBe(6);
    expect(updateArg.total_prayers).not.toBeUndefined();
    expect(updateArg.graces).toBe(30);
  });
});

describe('api.requestPasswordReset', () => {
  it('chama resetPasswordForEmail com o e-mail e um redirectTo não vazio', async () => {
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

    await api.requestPasswordReset('joana@teca.app.br');

    expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'joana@teca.app.br',
      expect.objectContaining({ redirectTo: expect.any(String) }),
    );
    const [, options] = supabaseMock.auth.resetPasswordForEmail.mock.calls.at(-1) as [
      string,
      { redirectTo: string },
    ];
    expect(options.redirectTo.length).toBeGreaterThan(0);
  });

  it('rejeita quando o Supabase retorna erro, propagando pra quem chamou decidir', async () => {
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: new Error('boom') });

    await expect(api.requestPasswordReset('joana@teca.app.br')).rejects.toThrow('boom');
  });
});

describe('api.updateMemberRole', () => {
  it('não lança quando moderator_ids vem null e inclui o novo moderador', async () => {
    supabaseMock.single.mockResolvedValueOnce({
      data: { moderator_ids: null, leader_id: 'leader1' },
      error: null,
    });

    await api.updateMemberRole('c1', 'u2', true, 'admin');

    const updateArg = supabaseMock.update.mock.calls.at(-1)?.[0] as { moderator_ids: string[] };
    expect(Array.isArray(updateArg.moderator_ids)).toBe(true);
    expect(updateArg.moderator_ids).toContain('u2');
  });

  it('não lança quando moderator_ids vem undefined', async () => {
    supabaseMock.single.mockResolvedValueOnce({
      data: { moderator_ids: undefined, leader_id: 'leader1' },
      error: null,
    });

    await api.updateMemberRole('c1', 'u3', true, 'admin');

    const updateArg = supabaseMock.update.mock.calls.at(-1)?.[0] as { moderator_ids: string[] };
    expect(updateArg.moderator_ids).toContain('u3');
  });
});
