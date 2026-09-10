import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const environment = (import.meta.env.MODE as string | undefined) ?? 'development';

export const isObservabilityEnabled = Boolean(dsn?.trim());

/** Chame uma vez, o mais cedo possível no bootstrap (index.tsx, antes do render). */
export function initObservability(): void {
  if (!isObservabilityEnabled) return;
  Sentry.init({
    dsn,
    environment,
    // Traces: comece baixo em prod, ajuste conforme o volume.
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Session replay só em erro, para não estourar cota.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  });
}

/** Erro tratado que ainda queremos ver no Sentry (ex.: falha de request na api.ts). */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!isObservabilityEnabled) {
    console.error('[observability]', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/** Associe os erros ao usuário logado. */
export function setUser(user: { id: string; email?: string } | null): void {
  if (!isObservabilityEnabled) return;
  Sentry.setUser(user);
}

/** Error boundary pronto para envolver a árvore em App.tsx / index.tsx. */
export const ErrorBoundary = Sentry.ErrorBoundary;
