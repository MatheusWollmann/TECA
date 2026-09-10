// Traduz erros de autenticação do Supabase para mensagens em português prontas
// para a UI, mais um código curto (`reason`) para telemetria (PostHog).
// O supabase-js mudou o shape dos erros entre versões: às vezes há `error.code`,
// às vezes só `error.message`. `toAuthErrorInfo` cobre os dois e NUNCA lança —
// qualquer entrada (null, string, objeto estranho) cai no genérico.

export interface AuthErrorInfo {
  /** Texto em português pronto para exibir na tela. */
  message: string;
  /** Código curto e estável para telemetria. */
  reason: string;
}

const GENERIC_MESSAGE = 'Não foi possível entrar. Tente de novo.';

export function toAuthErrorInfo(error: unknown): AuthErrorInfo {
  let code = '';
  let normalizedMessage = '';

  if (error !== null && typeof error === 'object') {
    const maybeCode = (error as { code?: unknown }).code;
    if (typeof maybeCode === 'string') {
      code = maybeCode;
    }
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      normalizedMessage = maybeMessage.toLowerCase();
    }
  }

  if (code === 'invalid_credentials' || normalizedMessage.includes('invalid login credentials')) {
    return { message: 'E-mail ou senha incorretos.', reason: 'invalid_credentials' };
  }

  if (code === 'email_not_confirmed' || normalizedMessage.includes('email not confirmed')) {
    return { message: 'Confirme seu e-mail antes de entrar.', reason: 'email_not_confirmed' };
  }

  return { message: GENERIC_MESSAGE, reason: code || 'unknown' };
}
