import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      include: ['app/**/*.ts', 'app/**/*.tsx'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/node_modules/**',
        '**/.next/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
