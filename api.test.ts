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
  supabaseMock.auth.updateUser.mockReset();
  supabaseMock.auth.setSession.mockReset();
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

// Contrato TEC-7 (item 3 da spec): completar a redefinição de senha e estabelecer a
// sessão de recuperação a partir do hash do link enviado por e-mail.
describe('api.completePasswordReset', () => {
  it('chama updateUser com a nova senha', async () => {
    supabaseMock.auth.updateUser.mockResolvedValueOnce({ error: null });

    await api.completePasswordReset('novaSenha123');

    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' });
  });

  it('rejeita quando o Supabase retorna erro', async () => {
    supabaseMock.auth.updateUser.mockResolvedValueOnce({ error: new Error('boom') });

    await expect(api.completePasswordReset('novaSenha123')).rejects.toThrow('boom');
  });
});

describe('api.establishRecoverySession', () => {
  it('retorna true e chama setSession com os tokens de um hash válido', async () => {
    supabaseMock.auth.setSession.mockResolvedValueOnce({ error: null });

    const resultado = await api.establishRecoverySession(
      '#access_token=abc&refresh_token=xyz&type=recovery',
    );

    expect(resultado).toBe(true);
    expect(supabaseMock.auth.setSession).toHaveBeenCalledWith({
      access_token: 'abc',
      refresh_token: 'xyz',
    });
  });

  it('retorna false sem chamar setSession quando o hash não tem os tokens (link expirado)', async () => {
    const resultado = await api.establishRecoverySession('#error=access_denied&error_code=otp_expired');

    expect(resultado).toBe(false);
    expect(supabaseMock.auth.setSession).not.toHaveBeenCalled();
  });

  it('retorna false quando o Supabase rejeita os tokens (setSession com erro)', async () => {
    supabaseMock.auth.setSession.mockResolvedValueOnce({ error: new Error('expired') });

    const resultado = await api.establishRecoverySession(
      '#access_token=abc&refresh_token=xyz&type=recovery',
    );

    expect(resultado).toBe(false);
  });

  it('retorna false (não lança) quando setSession lança de verdade, ex.: falha de rede/storage', async () => {
    supabaseMock.auth.setSession.mockRejectedValueOnce(new Error('network down'));

    const resultado = await api.establishRecoverySession(
      '#access_token=abc&refresh_token=xyz&type=recovery',
    );

    expect(resultado).toBe(false);
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
