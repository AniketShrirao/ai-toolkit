import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'dist/**',
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@ai-toolkit/shared': '../shared/src/index.ts'
    }
  }
});