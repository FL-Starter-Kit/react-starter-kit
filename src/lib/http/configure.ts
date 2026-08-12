/**
 * Binds the HTTP client to the environment configuration at startup.
 * Called once from app/bootstrap before the app renders.
 *
 * NOTE: this module must not import from the app layer; it accepts the
 * config values it needs as plain data so the dependency stays lib → app
 * (the app imports this module, not the other way around).
 */

import { httpClient, type HttpClientConfig } from '@/lib/http/client';

export interface HttpClientConfigValues {
  baseUrl: string;
  defaultTimeoutMs: number;
  /** Optional CSRF provider (see HttpClientConfig.csrf). */
  csrf?: NonNullable<HttpClientConfig['csrf']>;
}

/** Apply config-dependent HTTP settings (base URL, timeouts, CSRF provider). */
export function configureHttpClient(config: HttpClientConfigValues): void {
  httpClient.setConfig(config);
}
