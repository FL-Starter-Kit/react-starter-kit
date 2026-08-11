/**
 * Central, type-safe environment configuration.
 *
 * All `import.meta.env` access happens in this file ONLY (enforced by
 * convention and code review). Env values are validated at startup with
 * Zod — the app fails fast with a clear message if required values are
 * missing or malformed.
 *
 * SECURITY: frontend environment variables are NOT secrets. Anything
 * shipped to the browser can be inspected. Backend credentials must live
 * server-side only. See docs/SECURITY.md.
 */

import { z } from 'zod';

import { logger } from '@/lib/logging/logger';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default(''),
  VITE_ENABLE_MOCKS: booleanFromString,
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  VITE_APP_NAME: z.string().min(1).default('Enterprise Starter'),
  VITE_PUBLIC_URL: z.string().url().or(z.literal('')).optional(),
});

function normalizePublicUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.replace(/\/+$/, '');
}

export interface AppConfig {
  apiBaseUrl: string;
  enableMocks: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  appName: string;
  publicUrl: string | undefined;
  apiTimeoutMs: number;
  isDevelopment: boolean;
  isProduction: boolean;
}

let config: AppConfig | null = null;

/**
 * Load and validate the environment configuration. Called exactly once at
 * application bootstrap; throws with a descriptive message on failure.
 */
export function loadConfig(): AppConfig {
  if (config !== null) {
    return config;
  }

  // import.meta.env is untyped; project it onto a typed record so zod
  // (not implicit `any`) is the single source of validation.
  const env = import.meta.env as Record<string, string | undefined>;
  const raw = {
    VITE_API_BASE_URL: env.VITE_API_BASE_URL,
    VITE_ENABLE_MOCKS: env.VITE_ENABLE_MOCKS,
    VITE_LOG_LEVEL: env.VITE_LOG_LEVEL,
    VITE_APP_NAME: env.VITE_APP_NAME,
    VITE_PUBLIC_URL: env.VITE_PUBLIC_URL,
  };

  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${issues}\nSee .env.example for supported variables.`);
  }

  config = {
    apiBaseUrl: result.data.VITE_API_BASE_URL.replace(/\/+$/, ''),
    enableMocks: result.data.VITE_ENABLE_MOCKS,
    logLevel: result.data.VITE_LOG_LEVEL,
    appName: result.data.VITE_APP_NAME,
    publicUrl: normalizePublicUrl(result.data.VITE_PUBLIC_URL),
    apiTimeoutMs: 15_000,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };

  logger.setLevel(config.logLevel);
  logger.debug('Environment configuration loaded', {
    appName: config.appName,
    apiBaseUrl: config.apiBaseUrl || '(same origin)',
    enableMocks: config.enableMocks,
  });

  return config;
}

/** Read-only accessor for the loaded configuration. */
export function getConfig(): AppConfig {
  if (config === null) {
    throw new Error('Config accessed before loadConfig() was called. Call loadConfig() in bootstrap.');
  }
  return config;
}
