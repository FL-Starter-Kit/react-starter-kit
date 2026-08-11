import { beforeEach, describe, expect, it } from 'vitest';

import { clearMockSession, clearReturnPath, getMockSession, getReturnPath, setMockSession, setReturnPath } from '@/lib/auth/tokenStorage';
import { sessionStorageSafe } from '@/lib/storage/safeStorage';

describe('tokenStorage return path', () => {
  beforeEach(() => {
    sessionStorageSafe.clear();
  });

  it('defaults to "/" when nothing is stored', () => {
    expect(getReturnPath()).toBe('/');
  });

  it('round-trips a safe return path', () => {
    setReturnPath('/users/7');
    expect(getReturnPath()).toBe('/users/7');
  });

  it('rejects absolute URLs (open-redirect guard)', () => {
    setReturnPath('https://evil.example.com');
    expect(getReturnPath()).toBe('/');
  });

  it('rejects protocol-relative URLs', () => {
    setReturnPath('//evil.example.com');
    expect(getReturnPath()).toBe('/');
  });

  it('rejects non-path strings', () => {
    setReturnPath('javascript:alert(1)');
    expect(getReturnPath()).toBe('/');
  });

  it('clearReturnPath resets to "/"', () => {
    setReturnPath('/users');
    clearReturnPath();
    expect(getReturnPath()).toBe('/');
  });
});

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
