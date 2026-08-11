/**
 * Logging abstraction.
 *
 * - No `console.log` in application code — always go through this logger.
 * - Development builds log to the console; production builds log warnings
 *   and errors only, and can forward to a backend/observability tool
 *   (Sentry, OpenTelemetry, ...) via `setTransport`.
 * - Loggers never receive sensitive data (tokens, passwords, PII). The
 *   `sanitize` helper strips known-sensitive keys.
 * - A correlation/request ID can be attached to every message via
 *   `logger.withContext({ requestId })` — used by the HTTP client.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

export type LogTransport = (level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: unknown) => void;

const SENSITIVE_KEYS = new Set(['password', 'token', 'accesstoken', 'refreshtoken', 'authorization', 'cookie', 'secret']);

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

class Logger {
  private level: LogLevel;
  private context: LogContext;
  private transport: LogTransport | null = null;

  constructor(level: LogLevel) {
    this.level = level;
    this.context = {};
  }

  /** Change the minimum level (e.g. per environment at startup). */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /** Attach a production transport (Sentry, OTel, custom backend); pass `null` to detach. */
  setTransport(transport: LogTransport | null): void {
    this.transport = transport;
  }

  /** Derive a child logger carrying permanent context (e.g. a request ID). */
  withContext(context: LogContext): Logger {
    const child = new Logger(this.level);
    child.context = { ...this.context, ...context };
    child.transport = this.transport;
    return child;
  }

  debug(message: string, context?: LogContext): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: unknown): void {
    this.write('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: unknown): void {
    this.write('error', message, context, error);
  }

  private write(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) {
      return;
    }
    const fullContext: LogContext = { ...this.context, ...context };
    const sanitized = sanitize(fullContext);
    if (this.transport) {
      this.transport(level, message, sanitized, error);
      return;
    }
    // Default console transport — dev-friendly, never logs raw errors in full.
    // console access is intentionally restricted to this transport so the
    // `no-console` / `no-restricted-syntax` rules stay meaningful everywhere else.
    const prefix = sanitized.requestId ? `[${sanitized.requestId}]` : '';
    if (error instanceof Error) {
      // eslint-disable-next-line no-console -- this module IS the sanctioned console gateway
      console[level](`${prefix} ${message}`, sanitized, error.name, error.message);
    } else {
      // eslint-disable-next-line no-console -- this module IS the sanctioned console gateway
      console[level](`${prefix} ${message}`, sanitized);
    }
  }
}

/** Recursively redact known-sensitive keys before anything leaves the process. */
export function sanitize<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    const items = (value as unknown[]).map((item) => sanitize(item));
    return items as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
    } else if (typeof item === 'object') {
      out[key] = sanitize(item);
    } else {
      out[key] = item;
    }
  }
  return out as T;
}

/**
 * The application logger. Configure at startup via `logger.setLevel(...)`
 * using the value from `config.logLevel`.
 */
export const logger = new Logger('info');
