import { describe, expect, it } from 'vitest';

import {
  ApiError,
  ErrorCode,
  ResponseContractError,
  isAbortError,
  isRetryableStatus,
  isTimeoutError,
} from '@/lib/http/errors';

describe('ApiError', () => {
  it('defaults message from the code', () => {
    const error = new ApiError({ status: 404, code: ErrorCode.NotFound });
    expect(error.message).toBe('The requested resource was not found.');
  });

  it('uses the provided message when given', () => {
    const error = new ApiError({ status: 400, code: ErrorCode.BadRequest, message: 'custom' });
    expect(error.message).toBe('custom');
  });

  it('defaults retryable from the status', () => {
    expect(new ApiError({ status: 503, code: ErrorCode.Server }).retryable).toBe(true);
    expect(new ApiError({ status: 400, code: ErrorCode.BadRequest }).retryable).toBe(false);
  });

  it('omits optional fields when not provided', () => {
    const error = new ApiError({ status: 500, code: ErrorCode.Server });
    expect(error.requestId).toBeUndefined();
    expect(error.cause).toBeUndefined();
    expect(error.fieldErrors).toEqual({});
  });

  it('keeps provided optional fields', () => {
    const cause = new Error('root');
    const error = new ApiError({
      status: 422,
      code: ErrorCode.Validation,
      requestId: 'req-1',
      cause,
      fieldErrors: { email: ['taken'] },
      retryable: false,
    });
    expect(error.requestId).toBe('req-1');
    expect(error.cause).toBe(cause);
    expect(error.fieldErrors).toEqual({ email: ['taken'] });
    expect(error.retryable).toBe(false);
    expect(error.name).toBe('ApiError');
  });

  it('retains a Retry-After delay when provided', () => {
    const error = new ApiError({ status: 429, code: ErrorCode.RateLimited, retryAfterMs: 5000 });
    expect(error.retryAfterMs).toBe(5000);
    expect(new ApiError({ status: 429, code: ErrorCode.RateLimited }).retryAfterMs).toBeUndefined();
  });
});

describe('ResponseContractError', () => {
  it('is an ApiError with the ResponseInvalid code', () => {
    const error = new ResponseContractError({ status: 200, message: 'bad shape' });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ResponseContractError');
    expect(error.code).toBe(ErrorCode.ResponseInvalid);
    expect(error.message).toBe('bad shape');
  });

  it('is never retryable — even on retryable statuses', () => {
    const error = new ResponseContractError({ status: 500, message: 'bad shape' });
    expect(error.retryable).toBe(false);
  });

  it('defaults its message when not provided', () => {
    const error = new ResponseContractError({ status: 200 });
    expect(error.message).toBe('Received an unexpected response from the server.');
  });
});

describe('isRetryableStatus', () => {
  it('returns true for 408, 429 and 5xx', () => {
    expect(isRetryableStatus(408)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });
});

describe('isAbortError', () => {
  it('detects DOMException AbortError', () => {
    expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isAbortError(new Error('boom'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});

describe('isTimeoutError', () => {
  it('detects errors named TimeoutError', () => {
    const error = new Error('timed out');
    error.name = 'TimeoutError';
    expect(isTimeoutError(error)).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isTimeoutError(new Error('boom'))).toBe(false);
  });
});
