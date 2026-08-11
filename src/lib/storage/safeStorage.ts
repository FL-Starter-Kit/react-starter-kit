/**
 * Safe storage wrappers.
 *
 * `localStorage`/`sessionStorage` throw in private-browsing modes and are
 * unavailable in some environments; these wrappers degrade to in-memory
 * storage instead of crashing. All application storage access must go
 * through this module (enforced by ESLint).
 *
 * SECURITY: authentication tokens must NOT be stored here. See
 * lib/auth/tokenStorage.ts and docs/SECURITY.md — prefer httpOnly cookies.
 */

function createSafeStorage(storage: Storage | null, fallback: Map<string, string>) {
  return {
    get(key: string): string | null {
      try {
        return storage?.getItem(key) ?? fallback.get(key) ?? null;
      } catch {
        return fallback.get(key) ?? null;
      }
    },
    set(key: string, value: string): void {
      try {
        storage?.setItem(key, value);
      } catch {
        fallback.set(key, value);
      }
    },
    remove(key: string): void {
      try {
        storage?.removeItem(key);
      } catch {
        // ignore
      }
      fallback.delete(key);
    },
    clear(): void {
      try {
        storage?.clear();
      } catch {
        // ignore
      }
      fallback.clear();
    },
  };
}

function resolveStorage(storageName: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    const candidate = globalThis[storageName];
    // Accessing a property can throw in restricted modes; reading/writing
    // the `length` property is the standard smoke test.
    if (candidate && typeof candidate.length === 'number') {
      return candidate;
    }
  } catch {
    // fall through
  }
  return null;
}

export const localStorageSafe = createSafeStorage(resolveStorage('localStorage'), new Map<string, string>());
export const sessionStorageSafe = createSafeStorage(resolveStorage('sessionStorage'), new Map<string, string>());

/** JSON helpers over the safe storage wrappers. */
export const jsonStorage = {
  get<T>(key: string, area: typeof localStorageSafe = localStorageSafe): T | null {
    const raw = area.get(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      area.remove(key);
      return null;
    }
  },
  set<T>(key: string, value: T, area: typeof localStorageSafe = localStorageSafe): void {
    area.set(key, JSON.stringify(value));
  },
  remove(key: string, area: typeof localStorageSafe = localStorageSafe): void {
    area.remove(key);
  },
};
