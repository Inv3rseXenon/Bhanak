import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text-summary', 'text'],
      // Release gate (spec 5.1, 22): the engine must have 100% branch coverage.
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
});
