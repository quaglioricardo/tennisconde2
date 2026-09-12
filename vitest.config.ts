import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      { test: { name: 'server', include: ['server/test/**/*.test.ts'], environment: 'node' } },
      { plugins: [react()], test: { name: 'web', include: ['src/__tests__/**/*.test.tsx'], environment: 'jsdom' } },
    ],
  },
});
