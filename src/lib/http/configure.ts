/**
 * Binds the HTTP client to the environment configuration at startup.
 * Called once from app/bootstrap before the app renders.
 *
 * NOTE: this module must not import from the app layer; it accepts the
 * config values it needs as plain data so the dependency stays lib → app
 * (the app imports this module, not the other way around).
 */

import { httpClient } from '@/lib/http/client';

/** Apply config-dependent HTTP settings (base URL, timeouts). */
export function configureHttpClient(config: { baseUrl: string; defaultTimeoutMs: number }): void {
  httpClient.setConfig(config);
}
