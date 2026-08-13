import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@examples': fileURLToPath(new URL('./examples', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    // Production sourcemaps are disabled by default (public maps expose
    // source code). Opt in via SOURCEMAP=true when uploading 'hidden' maps
    // to an error-monitoring platform — 'hidden' keeps them out of the
    // browser's DevTools while remaining uploadable.
    sourcemap: process.env.SOURCEMAP === 'true' ? 'hidden' : false,
    target: 'es2022',
    reportCompressedSize: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'examples/**/*.test.{ts,tsx}'],
    css: {
      modules: {
        // Keep original class names so tests can assert on variant classes.
        classNameStrategy: 'non-scoped',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'examples/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'examples/**/*.test.{ts,tsx}',
        'examples/**/mocks/**',
        'src/tests/**',
        'src/main.tsx',
        'src/**/index.ts',
        'src/**/*.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 60,
      },
    },
    restoreMocks: true,
    clearMocks: true,
  },
});
