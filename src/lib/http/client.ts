/**
 * Centralized HTTP client.
 *
 * Every API call in the application goes through `httpClient.request()` —
 * never scatter raw `fetch()` calls in components or features.
 *
 * Responsibilities:
 *  - request/response interceptors (logging, correlation IDs)
 *  - timeout + cancellation (external AbortSignal support, including the
 *    retry backoff — cancellation is never ignored while waiting)
 *  - retry with exponential backoff for network failures and retryable
 *    statuses (408/429/5xx), honoring `Retry-After` — THE single retry
 *    owner; TanStack Query is configured with retry disabled
 *  - single-flight session refresh on 401 via `setUnauthorizedHandler`
 *  - runtime validation of responses (Zod) so untrusted server data is
 *    never used untyped; contract violations surface as
 *    `ResponseContractError` and are never retried
 *  - normalized, typed errors (ApiError) — see errors.ts
 */

import { ErrorCode, isAbortError, isRetryableStatus, isTimeoutError } from '@/lib/http/errors';
import {
  ApiError,
  ResponseContractError,
  type ErrorEnvelope,
} from '@/lib/http/errors';
import { logger } from '@/lib/logging/logger';

export interface HttpClientConfig {
  baseUrl: string;
  defaultTimeoutMs: number;
  defaultRetries: number;
  /** Attach extra headers to every request (e.g. correlation metadata). */
  defaultHeaders?: Record<string, string>;
  /**
   * CSRF protection extension point. Cookie-based session backends often
   * require an anti-CSRF token on state-changing requests.
   *
   * `getToken` is invoked per state-changing request (POST/PUT/PATCH/DELETE)
   * and may return the token synchronously or asynchronously (e.g. read
   * from a `XSRF-TOKEN` cookie). Returning null/'' skips the header, and an
   * explicitly provided per-request header always wins. Backends using
   * Bearer tokens, BFFs or no CSRF at all simply omit this option — the
   * HTTP layer is never rewritten per backend pattern.
   */
  csrf?: {
    /** Header that carries the token (default `X-CSRF-Token`). */
    headerName?: string;
    getToken: () => string | null | undefined | Promise<string | null | undefined>;
  };
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface HttpRequestOptions<TResponse> {
  method: HttpMethod;
  url: string;
  /** JSON body for POST/PUT/PATCH. */
  body?: unknown;
  /** Query string parameters (URL-encoded, null/undefined omitted). */
  params?: QueryParams;
  /** Extra headers. Never set Authorization here — the auth layer owns it. */
  headers?: Record<string, string>;
  /** External cancellation (e.g. TanStack Query `signal`). */
  signal?: AbortSignal;
  /** Per-request timeout override (default from client config). */
  timeoutMs?: number;
  /**
   * Number of additional attempts after the first (network failures and
   * retryable status codes only). Defaults to the client default.
   */
  retries?: number;
  /**
   * Runtime validation of the response payload. Pass a Zod parser
   * (schema.parse) or a custom function. Throw to reject the request.
   */
  validate?: (data: unknown) => TResponse;
  /** Override the credentials mode (defaults to `include` for cookie auth). */
  credentials?: RequestCredentials;
  /**
   * Skip the single-flight session-refresh pipeline for this request.
   * Required for the refresh/login/logout endpoints themselves, otherwise a
   * 401 there would re-enter the refresh handler and deadlock on the
   * in-flight refresh promise.
   */
  skipUnauthorizedHandler?: boolean;
}

interface InternalRequestOptions extends HttpRequestOptions<unknown> {
  /** Set by the unauthorized-retry flow; prevents infinite loops. */
  isUnauthorizedRetry?: boolean;
}

export type UnauthorizedHandler = () => Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

const DEFAULT_CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Register a handler invoked once per failed request when the backend
 * returns 401. It is expected to attempt a single-flight session refresh
 * and resolve if the session was restored. Registered by lib/auth.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler;
  return () => {
    unauthorizedHandler = null;
  };
}

export function createHttpClient(config: HttpClientConfig) {
  const defaultTimeoutMs = config.defaultTimeoutMs;
  let currentConfig = config;

  function setConfig(nextConfig: Partial<HttpClientConfig>): void {
    currentConfig = { ...currentConfig, ...nextConfig };
  }

  function getConfig(): HttpClientConfig {
    return currentConfig;
  }

  async function request<TResponse>(options: HttpRequestOptions<TResponse>): Promise<TResponse> {
    return requestInternal(options) as Promise<TResponse>;
  }

  async function requestInternal(options: InternalRequestOptions): Promise<unknown> {
    const retries = options.retries ?? currentConfig.defaultRetries;
    const requestId = createRequestId();
    const requestLogger = logger.withContext({
      requestId,
      method: options.method,
      url: options.url,
    });
    const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;

    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const onExternalAbort = () => {
        controller.abort(options.signal?.reason);
      };

      if (options.signal) {
        if (options.signal.aborted) {
          throw new ApiError({ status: 0, code: ErrorCode.Aborted, message: 'Request aborted.' });
        }
        options.signal.addEventListener('abort', onExternalAbort, { once: true });
      }
      if (timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          controller.abort(createTimeoutReason(timeoutMs));
        }, timeoutMs);
      }

      try {
        const response = await rawFetch(options, requestId, controller.signal, requestLogger);
        if (!response.ok) {
          throw await normalizeErrorResponse(response, requestLogger);
        }
        if (response.status === 204) {
          return undefined;
        }
        const data: unknown = await readJson(response);
        requestLogger.debug('Response received', { status: response.status });

        if (options.validate) {
          try {
            return options.validate(data);
          } catch (error) {
            // The server violated its contract — fail loudly for developers,
            // expose a generic message to users. Never retried: a contract
            // mismatch is not transient (see ResponseContractError).
            requestLogger.error(
              'Response failed runtime validation',
              { status: response.status },
              error,
            );
            const responseRequestId = response.headers.get('x-request-id');
            throw new ResponseContractError({
              status: response.status,
              message: 'Received an unexpected response from the server.',
              ...(responseRequestId !== null ? { requestId: responseRequestId } : {}),
              cause: error,
            });
          }
        }
        return data;
      } catch (error) {
        if (isAbortError(error)) {
          if (options.signal?.aborted) {
            throw new ApiError({ status: 0, code: ErrorCode.Aborted, message: 'Request aborted.' });
          }
          throw new ApiError({
            status: 0,
            code: ErrorCode.Timeout,
            message: 'The request timed out. Please try again.',
            retryable: false,
            cause: error,
          });
        }

        if (
          error instanceof ApiError &&
          error.code === ErrorCode.Unauthorized &&
          !options.isUnauthorizedRetry &&
          !options.skipUnauthorizedHandler &&
          unauthorizedHandler
        ) {
          requestLogger.info('Session expired; attempting silent refresh');
          try {
            await unauthorizedHandler();
            return requestInternal({ ...options, isUnauthorizedRetry: true });
          } catch (refreshError) {
            requestLogger.error('Session refresh failed', {}, refreshError);
            throw error;
          }
        }

        const apiError = error instanceof ApiError ? error : normalizeUnknownError(error);
        const canRetry = apiError.retryable || isNetworkError(error);
        if (canRetry && attempt < retries) {
          attempt += 1;
          // Retry-After (when sent) wins over the generic backoff delay.
          // ResponseContractError is retryable:false, so a server contract
          // mismatch never reaches this branch.
          const delay = apiError.retryAfterMs ?? backoffDelay(attempt, apiError.status);
          requestLogger.warn('Retrying request', { attempt, delayMs: delay });
          try {
            await sleep(delay, options.signal);
          } catch (sleepError) {
            // Cancelled while waiting on the backoff — surface an abort error
            // instead of lingering past the query's lifecycle.
            if (options.signal?.aborted) {
              throw new ApiError({ status: 0, code: ErrorCode.Aborted, message: 'Request aborted.' });
            }
            throw sleepError;
          }
          continue;
        }
        throw apiError;
      } finally {
        if (options.signal) {
          options.signal.removeEventListener('abort', onExternalAbort);
        }
        if (timeoutHandle !== undefined) {
          clearTimeout(timeoutHandle);
        }
      }
    }
  }

  async function rawFetch(
    options: InternalRequestOptions,
    requestId: string,
    signal: AbortSignal,
    requestLogger: ReturnType<typeof logger.withContext>,
  ): Promise<Response> {
    const url = buildUrl(`${currentConfig.baseUrl}${options.url}`, options.params);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-Id': requestId,
      ...currentConfig.defaultHeaders,
      ...options.headers,
    };

    const csrf = currentConfig.csrf;
    if (csrf !== undefined && options.method !== 'GET') {
      const headerName = csrf.headerName ?? DEFAULT_CSRF_HEADER_NAME;
      if (headers[headerName] === undefined) {
        const token = await csrf.getToken();
        if (token !== null && token !== undefined && token !== '') {
          headers[headerName] = token;
        }
      }
    }

    if (options.body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    requestLogger.debug('Sending request', { method: options.method, url });

    let response: Response;
    try {
      const init: RequestInit = {
        method: options.method,
        headers,
        credentials: options.credentials ?? 'include',
        signal,
      };
      if (options.body !== undefined) {
        init.body = JSON.stringify(options.body);
      }
      response = await fetch(url, init);
    } catch (error) {
      // Re-throw abort errors untouched so requestInternal can classify
      // them as timeout (internal abort) vs user-cancelled (external signal).
      if (isAbortError(error)) {
        throw error;
      }
      // fetch rejects on network failure / CORS / DNS errors.
      throw new ApiError({
        status: 0,
        code: ErrorCode.Network,
        message: 'Unable to reach the server. Check your connection and try again.',
        retryable: true,
        cause: error,
      });
    }
    return response;
  }

  return {
    get<TResponse>(
      url: string,
      options?: Omit<HttpRequestOptions<TResponse>, 'method' | 'url' | 'body'>,
    ): Promise<TResponse> {
      return request({ method: 'GET', url, ...options });
    },
    post<TResponse>(
      url: string,
      body?: unknown,
      options?: Omit<HttpRequestOptions<TResponse>, 'method' | 'url' | 'body'>,
    ): Promise<TResponse> {
      return request({ method: 'POST', url, body, ...options });
    },
    put<TResponse>(
      url: string,
      body?: unknown,
      options?: Omit<HttpRequestOptions<TResponse>, 'method' | 'url' | 'body'>,
    ): Promise<TResponse> {
      return request({ method: 'PUT', url, body, ...options });
    },
    patch<TResponse>(
      url: string,
      body?: unknown,
      options?: Omit<HttpRequestOptions<TResponse>, 'method' | 'url' | 'body'>,
    ): Promise<TResponse> {
      return request({ method: 'PATCH', url, body, ...options });
    },
    delete<TResponse>(
      url: string,
      options?: Omit<HttpRequestOptions<TResponse>, 'method' | 'url' | 'body'>,
    ): Promise<TResponse> {
      return request({ method: 'DELETE', url, ...options });
    },
    request,
    setConfig,
    getConfig,
  };
}

/** Instance used by the whole application. */
export const httpClient = createHttpClient({
  baseUrl: '', // resolved from config at startup (see lib/http/configure.ts)
  defaultTimeoutMs: 15_000,
  defaultRetries: 2,
});

async function normalizeErrorResponse(
  response: Response,
  requestLogger: ReturnType<typeof logger.withContext>,
): Promise<ApiError> {
  const requestId = response.headers.get('x-request-id') ?? undefined;
  let envelope: ErrorEnvelope = {};
  try {
    const body: unknown = await response.json();
    if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
      envelope = body;
    }
  } catch {
    // Non-JSON error body — fall back to the status text.
  }

  const code = mapStatusToCode(response.status, envelope.code);
  const message = envelope.message ?? defaultMessageForStatus(code);
  const fieldErrors = Object.fromEntries(
    Object.entries(envelope.fieldErrors ?? {}).map(([field, errors]) => [
      field,
      errors.map(String),
    ]),
  );

  requestLogger.warn(
    'Request failed',
    { status: response.status, code },
    new ApiError({ status: response.status, code, message }),
  );

  const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));

  return new ApiError({
    status: response.status,
    code,
    message,
    fieldErrors,
    ...(requestId !== undefined ? { requestId } : {}),
    ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
    retryable: isRetryableStatus(response.status),
  });
}

/**
 * Parse a `Retry-After` response header into milliseconds. Supports both
 * allowed forms: delta-seconds (e.g. `120`) and an HTTP-date
 * (e.g. `Wed, 21 Oct 2015 07:28:00 GMT`). Returns undefined for malformed
 * values so callers fall back to their own backoff.
 */
function parseRetryAfter(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }
  const dateMs = Date.parse(trimmed);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return undefined;
}

function normalizeUnknownError(error: unknown): ApiError {
  if (isTimeoutError(error)) {
    return new ApiError({
      status: 0,
      code: ErrorCode.Timeout,
      message: 'The request timed out. Please try again.',
    });
  }
  return new ApiError({
    status: 0,
    code: ErrorCode.Unknown,
    message: 'The request could not be completed.',
    cause: error,
  });
}

function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.code === ErrorCode.Network;
}

function mapStatusToCode(status: number, envelopeCode?: string): ApiError['code'] {
  if (envelopeCode?.startsWith('VALIDATION')) {
    return ErrorCode.Validation;
  }
  switch (status) {
    case 400:
      return envelopeCode === 'VALIDATION_ERROR' ? ErrorCode.Validation : ErrorCode.BadRequest;
    case 401:
      return ErrorCode.Unauthorized;
    case 403:
      return ErrorCode.Forbidden;
    case 404:
      return ErrorCode.NotFound;
    case 409:
      return ErrorCode.Conflict;
    case 422:
      return ErrorCode.Validation;
    case 429:
      return ErrorCode.RateLimited;
    default:
      return status >= 500 ? ErrorCode.Server : ErrorCode.Unknown;
  }
}

function defaultMessageForStatus(code: ApiError['code']): string {
  switch (code) {
    case ErrorCode.Validation:
      return 'Please correct the highlighted fields.';
    case ErrorCode.Unauthorized:
      return 'Your session has expired. Please sign in again.';
    case ErrorCode.Forbidden:
      return 'You do not have permission to perform this action.';
    case ErrorCode.NotFound:
      return 'The requested resource was not found.';
    case ErrorCode.RateLimited:
      return 'Too many requests. Please wait and try again.';
    case ErrorCode.Network:
      return 'Unable to reach the server. Check your connection and try again.';
    case ErrorCode.Timeout:
      return 'The request timed out. Please try again.';
    case ErrorCode.Aborted:
      return 'The request was cancelled.';
    case ErrorCode.Conflict:
      return 'The change could not be saved because it conflicts with another update.';
    case ErrorCode.Server:
      return 'Something went wrong on our end. Please try again later.';
    case ErrorCode.BadRequest:
      return 'The request could not be processed.';
    case ErrorCode.ResponseInvalid:
      return 'Received an unexpected response from the server.';
    case ErrorCode.Unknown:
      return 'The request could not be completed.';
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) {
    return path;
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createTimeoutReason(ms: number): Error {
  const error = new Error(`Request timed out after ${ms}ms`);
  error.name = 'TimeoutError';
  return error;
}

function backoffDelay(attempt: number, status: number): number {
  if (status === 429) {
    return 1000 * attempt;
  }
  const base = 300;
  const jitter = Math.random() * 150;
  return Math.min(base * 2 ** (attempt - 1) + jitter, 3000);
}

/**
 * Resolve after `ms`, or reject with an AbortError as soon as the given
 * signal aborts — so a cancelled query never lingers in a retry delay.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
