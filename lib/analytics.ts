import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

export const isAnalyticsEnabled = Boolean(key?.trim());

/** Chame uma vez no bootstrap (index.tsx), depois de montar o React. */
export function initAnalytics(): void {
  if (!isAnalyticsEnabled || typeof window === 'undefined') return;
  posthog.init(key as string, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
}

/** Evento de produto. Nome no formato objeto_verbo: 'prayer_favorited', 'schedule_day_completed'. */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled) return;
  posthog.capture(event, props);
}

/** Associe os eventos ao usuário logado. Chame no login e ao restaurar sessão. */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled) return;
  posthog.identify(userId, traits);
}

/** Chame no logout. */
export function resetAnalytics(): void {
  if (!isAnalyticsEnabled) return;
  posthog.reset();
}

/** Feature flags do PostHog (rollout gradual em vez de deploy = release). */
export function isFeatureEnabled(flag: string): boolean {
  if (!isAnalyticsEnabled) return false;
  return posthog.isFeatureEnabled(flag) ?? false;
}
