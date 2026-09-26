import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // the sim-heavy checks (30-seed missions, page-hit sweeps) take 1–2 s alone; don't fail them under load
    testTimeout: 20000,
  },
});
