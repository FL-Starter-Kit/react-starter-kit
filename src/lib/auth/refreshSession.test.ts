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

const refreshedUser = {
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  role: 'admin' as const,
};

describe('refreshSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCapturedHandlers.length = 0;
  });

  function install() {
    const onSessionRestored = vi.fn();
    const onSessionExpired = vi.fn();
    const onRefreshStart = vi.fn();
    installUnauthorizedRefresher({ onSessionRestored, onSessionExpired, onRefreshStart });
    return {
      onSessionRestored,
      onSessionExpired,
      onRefreshStart,
      handler: mockCapturedHandlers.at(-1) as () => Promise<void>,
    };
  }

  it('notifies onSessionRestored once with the refreshed user when the refresh succeeds', async () => {
    mockRefresh.mockResolvedValue(refreshedUser);
    const { onSessionRestored, onSessionExpired, handler } = install();

    await handler();

    expect(onSessionRestored).toHaveBeenCalledTimes(1);
    expect(onSessionRestored).toHaveBeenCalledWith(refreshedUser);
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
      .mockResolvedValueOnce(refreshedUser)
      .mockRejectedValueOnce(new Error('refresh endpoint down'));
    const { onSessionRestored, onSessionExpired, handler } = install();

    await handler();
    await expect(handler()).rejects.toThrow('Session refresh failed');

    expect(onSessionRestored).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });

  it('fires onRefreshStart once per new attempt, not per concurrent caller', async () => {
    mockRefresh.mockResolvedValue(refreshedUser);
    const { onRefreshStart, handler } = install();

    await Promise.all([handler(), handler(), handler()]);
    await handler();

    expect(mockRefresh).toHaveBeenCalledTimes(2);
    expect(onRefreshStart).toHaveBeenCalledTimes(2);
  });
});