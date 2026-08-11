import { ErrorCode, type ErrorCodeValue } from '@/types/api';

export type { ErrorCodeValue };
export { ErrorCode };

/** Normalized error shape — the only error type components should handle. */
export interface ApiErrorLike {
  readonly status: number;
  readonly code: ErrorCodeValue;
  /** User-safe message; never contains stack traces or internals. */
  readonly message: string;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
  readonly requestId?: string;
  /** True when a retry could succeed (network failure, 429, 5xx). */
  readonly retryable: boolean;
  readonly cause?: unknown;
}

/** Constructor input — only status/code are required; the rest default. */
export type ApiErrorInit = Partial<Omit<ApiErrorLike, 'status' | 'code' | 'message'>> &
  Pick<ApiErrorLike, 'status' | 'code'> & {
    message?: string;
  };

export class ApiError extends Error implements ApiErrorLike {
  readonly status: number;
  readonly code: ErrorCodeValue;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
  readonly requestId?: string;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor(init: ApiErrorInit) {
    super(init.message ?? getDefaultMessage(init.code));
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? {};
    this.retryable = init.retryable ?? isRetryableStatus(init.status);
    if (init.requestId !== undefined) {
      this.requestId = init.requestId;
    }
    if (init.cause !== undefined) {
      this.cause = init.cause;
    }
  }
}

function getDefaultMessage(code: ErrorCodeValue): string {
  switch (code) {
    case ErrorCode.Network:
      return 'Unable to reach the server. Check your connection and try again.';
    case ErrorCode.Timeout:
      return 'The request timed out. Please try again.';
    case ErrorCode.Aborted:
      return 'The request was cancelled.';
    case ErrorCode.Validation:
      return 'Please correct the highlighted fields.';
    case ErrorCode.Unauthorized:
      return 'Your session has expired. Please sign in again.';
    case ErrorCode.Forbidden:
      return 'You do not have permission to perform this action.';
    case ErrorCode.NotFound:
      return 'The requested resource was not found.';
    case ErrorCode.Conflict:
      return 'The change conflicts with the current data. Please refresh and try again.';
    case ErrorCode.RateLimited:
      return 'Too many requests. Please wait and try again.';
    case ErrorCode.Server:
      return 'Something went wrong on our end. Please try again later.';
    case ErrorCode.BadRequest:
      return 'The request could not be processed.';
    case ErrorCode.Unknown:
      return 'The request could not be completed.';
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === 'TimeoutError';
}

export interface ErrorEnvelope {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}
