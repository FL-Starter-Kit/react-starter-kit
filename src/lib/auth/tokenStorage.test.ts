import { beforeEach, describe, expect, it } from 'vitest';

import { clearMockSession, getMockSession, setMockSession } from '@/lib/auth/tokenStorage';
import { sessionStorageSafe } from '@/lib/storage/safeStorage';

describe('tokenStorage mock session', () => {
  beforeEach(() => {
    sessionStorageSafe.clear();
  });

  it('round-trips the mock session id', () => {
    expect(getMockSession()).toBe(null);
    setMockSession('user-1');
    expect(getMockSession()).toBe('user-1');
  });

  it('clearMockSession removes it', () => {
    setMockSession('user-1');
    clearMockSession();
    expect(getMockSession()).toBe(null);
  });
});
