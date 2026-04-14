import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    environmentMatchGlobs: [
      ['frontend/**/*.test.ts', 'jsdom'],
    ],
  },
});
