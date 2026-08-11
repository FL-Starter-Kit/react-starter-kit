/**
 * Application bootstrap: validate config, wire infrastructure, start the
 * dev mock server when enabled, then render the app. Called from main.tsx.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { loadConfig } from '@/app/config/env';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { AppRouter } from '@/app/router/AppRouter';
import { AuthProvider } from '@/lib/auth';
import { configureHttpClient } from '@/lib/http';
import { logger } from '@/lib/logging/logger';

import '@/styles/tokens.css';
import '@/styles/base.css';

async function startMockServer(): Promise<void> {
  const { worker } = await import('@/tests/mocks/browser');
  await worker.start({
    // The mock worker must never intercept real backend traffic in
    // environments where mocks are disabled.
    onUnhandledRequest: 'bypass',
  });
}

export async function bootstrap(): Promise<void> {
  const config = loadConfig();
  configureHttpClient({ baseUrl: config.apiBaseUrl, defaultTimeoutMs: config.apiTimeoutMs });

  if (config.enableMocks && import.meta.env.DEV) {
    await startMockServer();
    logger.debug('Mock server started');
  }

  const root = document.getElementById('root');
  if (root === null) {
    throw new Error('Root element #root not found in index.html.');
  }

  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
