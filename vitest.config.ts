import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.stories.tsx',
        '**/index.ts',
        // Page/layout components — tested via E2E, not unit tests
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'src/app/**/layout.ts',
        'src/app/**/*.template.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/**/not-found.tsx',
        'src/app/**/global-error.tsx',
        // Client page wrappers (tested via E2E)
        'src/app/**/_client.tsx',
        // Static data files — no logic to test
        'src/data/transcripts/*.ts',
        'src/data/video-config.ts',
        'src/data/sample-transcripts.ts',
        // Config files
        'src/middleware.ts',
        'src/i18n/**',
        'instrumentation.ts',
        // E2E test specs
        '**/*.spec.ts',
      ],
      all: true,
      thresholds: {
        lines: 35,
        functions: 35,
        branches: 35,
        statements: 35,
      },
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      ioredis: path.resolve(__dirname, './vitest.mocks.ts'),
      '@ai-sdk/anthropic': path.resolve(__dirname, './vitest.ai-sdk-mock.ts'),
      'ai': path.resolve(__dirname, './vitest.ai-mock.ts'),
      'openai': path.resolve(__dirname, './vitest.openai-mock.ts'),
    },
  },
});
