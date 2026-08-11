import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonStorage, localStorageSafe, sessionStorageSafe } from '@/lib/storage/safeStorage';

describe('safeStorage', () => {
  beforeEach(() => {
    localStorageSafe.clear();
    sessionStorageSafe.clear();
  });

  it('reads, writes, and removes from real storage', () => {
    localStorageSafe.set('theme', 'dark');
    expect(localStorageSafe.get('theme')).toBe('dark');
    localStorageSafe.remove('theme');
    expect(localStorageSafe.get('theme')).toBe(null);
  });

  it('falls back to in-memory storage when the underlying storage throws', () => {
    const storage = localStorageSafe;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    storage.set('overflow', 'value');
    expect(storage.get('overflow')).toBe('value');

    vi.restoreAllMocks();
  });

  it('falls back to in-memory storage when getItem throws', () => {
    // A storage that is unusable for reads is treated as unusable for
    // writes too, so the value lands in the in-memory fallback.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    localStorageSafe.set('mem', 'stored');
    expect(localStorageSafe.get('mem')).toBe('stored');
    vi.restoreAllMocks();
  });

  it('clear removes everything including in-memory fallback entries', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('boom');
    });
    localStorageSafe.set('a', '1');
    localStorageSafe.set('b', '2');
    localStorageSafe.clear();
    expect(localStorageSafe.get('a')).toBe(null);
    expect(localStorageSafe.get('b')).toBe(null);
    vi.restoreAllMocks();
  });

  it('session storage is isolated from local storage', () => {
    localStorageSafe.set('k', 'local');
    expect(sessionStorageSafe.get('k')).toBe(null);
    sessionStorageSafe.set('k', 'session');
    expect(sessionStorageSafe.get('k')).toBe('session');
  });
});

describe('jsonStorage', () => {
  it('round-trips JSON values', () => {
    jsonStorage.set('prefs', { a: 1, b: [true] });
    expect(jsonStorage.get('prefs')).toEqual({ a: 1, b: [true] });
  });

  it('returns null for missing keys', () => {
    expect(jsonStorage.get('missing')).toBe(null);
  });

  it('removes and returns null for corrupt JSON', () => {
    localStorageSafe.set('corrupt', '{not json');
    expect(jsonStorage.get('corrupt')).toBe(null);
    expect(localStorageSafe.get('corrupt')).toBe(null);
  });

  it('remove deletes the key', () => {
    jsonStorage.set('k', 1);
    jsonStorage.remove('k');
    expect(jsonStorage.get('k')).toBe(null);
  });

  it('can target a different storage area', () => {
    jsonStorage.set('k', 1, sessionStorageSafe);
    expect(jsonStorage.get('k', sessionStorageSafe)).toBe(1);
    expect(jsonStorage.get('k')).toBe(null);
  });
});
