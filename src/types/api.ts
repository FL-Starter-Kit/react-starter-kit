/** Generic pagination parameters used by list APIs. */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Standard envelope returned by list APIs. */
export interface Paginated<T> {
  items: readonly T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Machine-readable error codes produced by the HTTP client. */
export const ErrorCode = {
  Network: 'NETWORK_ERROR',
  Timeout: 'TIMEOUT_ERROR',
  Aborted: 'ABORTED',
  Validation: 'VALIDATION_ERROR',
  Unauthorized: 'UNAUTHORIZED',
  Forbidden: 'FORBIDDEN',
  NotFound: 'NOT_FOUND',
  Conflict: 'CONFLICT',
  RateLimited: 'RATE_LIMITED',
  Server: 'SERVER_ERROR',
  BadRequest: 'BAD_REQUEST',
  Unknown: 'UNKNOWN_ERROR',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
