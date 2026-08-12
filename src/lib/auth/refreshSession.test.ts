import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installUnauthorizedRefresher } from '@/lib/auth/refreshSession';

const { mockCapturedHandlers, mockRefresh } = vi.hoisted(() => {
  const mockCapturedHandlers: (() => Promise<void>)[] = [];
  const mockRefresh = vi.fn();
  return { mockCapturedHandlers, mockRefresh };
});

vi.mock('@/lib/http', () => ({
  setUnauthorizedHandler: (handler: () => Promise<void>) => {
    mockCapturedHandlers.push(handler);
    return () => {
      const index = mockCapturedHandlers.indexOf(handler);
      if (index >= 0) {
        mockCapturedHandlers.splice(index, 1);
      }
    };
  },
}));

vi.mock('@/lib/auth/authApi', () => ({
  authApi: {
    refresh: mockRefresh,
  },
}));

describe('refreshSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapturedHandlers.length = 0;
  });

  function install() {
    const onSessionRestored = vi.fn();
    const onSessionExpired = vi.fn();
    installUnauthorizedRefresher({ onSessionRestored, onSessionExpired });
    return {
      onSessionRestored,
      onSessionExpired,
      handler: mockCapturedHandlers.at(-1) as () => Promise<void>,
    };
  }

  it('notifies onSessionRestored once when the refresh succeeds', async () => {
    mockRefresh.mockResolvedValue({ id: 'user-1' });
    const { onSessionRestored, onSessionExpired, handler } = install();

    await handler();

    expect(onSessionRestored).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('notifies onSessionExpired exactly once when the refresh fails, even with concurrent callers', async () => {
    mockRefresh.mockRejectedValue(new Error('refresh endpoint down'));
    const { onSessionRestored, onSessionExpired, handler } = install();

    const results = await Promise.allSettled([handler(), handler(), handler()]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(onSessionRestored).not.toHaveBeenCalled();
  });

  it('restarts the single-flight promise after a success, so the next failure notifies again', async () => {
    mockRefresh
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockRejectedValueOnce(new Error('refresh endpoint down'));
    const { onSessionRestored, onSessionExpired, handler } = install();

    await handler();
    await expect(handler()).rejects.toThrow('Session refresh failed');

    expect(onSessionRestored).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });
});
