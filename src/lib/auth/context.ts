import { createContext, useContext } from 'react';

import type { AuthState } from '@/lib/auth/types';

export const AuthContext = createContext<AuthState | null>(null);

export function useAuthContext(): AuthState {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuthContext must be used within an AuthProvider.');
  }
  return context;
}
