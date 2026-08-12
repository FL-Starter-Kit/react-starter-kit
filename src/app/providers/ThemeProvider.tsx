import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ThemeContext, type ThemeMode } from '@/app/providers/themeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { localStorageSafe } from '@/lib/storage/safeStorage';

const THEME_KEY = 'app.theme';

function readStoredMode(): ThemeMode {
  const stored = localStorageSafe.get(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolvedTheme: 'light' | 'dark' =
    mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      localStorageSafe.set(THEME_KEY, nextMode);
    } catch {
      // Non-persistent storage fallback is handled by the wrapper.
    }
  }, []);

  const value = useMemo(() => ({ resolvedTheme, mode, setMode }), [resolvedTheme, mode, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
