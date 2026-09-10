import { describe, it, expect } from 'vitest';
import { toAuthErrorInfo } from './authErrors';

// Contrato: TEC-5 / docs/specs/0003-login-erro-visivel-e-recuperar-senha.md (item 1).
// `toAuthErrorInfo` traduz o erro do Supabase para mensagem PT + `reason` de telemetria.
// Nunca lança, seja qual for a entrada.

describe('toAuthErrorInfo', () => {
  it('traduz invalid_credentials quando vem pelo campo code', () => {
    expect(toAuthErrorInfo({ code: 'invalid_credentials' })).toEqual({
      message: 'E-mail ou senha incorretos.',
      reason: 'invalid_credentials',
    });
  });

  it('traduz invalid_credentials quando vem só pela message (sem code)', () => {
    expect(toAuthErrorInfo({ message: 'Invalid login credentials' })).toEqual({
      message: 'E-mail ou senha incorretos.',
      reason: 'invalid_credentials',
    });
  });

  it('traduz email_not_confirmed com mensagem específica', () => {
    expect(toAuthErrorInfo({ code: 'email_not_confirmed' })).toEqual({
      message: 'Confirme seu e-mail antes de entrar.',
      reason: 'email_not_confirmed',
    });
  });

  it('usa a mensagem genérica e preserva o code desconhecido como reason', () => {
    expect(toAuthErrorInfo({ code: 'over_request_rate_limit' })).toEqual({
      message: 'Não foi possível entrar. Tente de novo.',
      reason: 'over_request_rate_limit',
    });
  });

  it('cai no genérico com reason "unknown" quando recebe null', () => {
    expect(toAuthErrorInfo(null)).toEqual({
      message: 'Não foi possível entrar. Tente de novo.',
      reason: 'unknown',
    });
  });

  it('cai no genérico com reason "unknown" quando recebe uma string', () => {
    expect(toAuthErrorInfo('boom')).toEqual({
      message: 'Não foi possível entrar. Tente de novo.',
      reason: 'unknown',
    });
  });

  it('não lança para nenhum tipo de entrada', () => {
    const entradas: unknown[] = [
      null,
      undefined,
      'boom',
      42,
      [],
      {},
      { code: 123 },
      { message: null },
      new Error('kaboom'),
    ];
    for (const entrada of entradas) {
      expect(() => toAuthErrorInfo(entrada)).not.toThrow();
    }
  });
});
