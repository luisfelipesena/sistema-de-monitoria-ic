import react from '@vitejs/plugin-react'; // Assuming you might need React support in tests
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true, // Use Vitest global APIs
    environmentMatchGlobs: [
      // Frontend tests: Use jsdom environment
      ['src/**/*.test.tsx', 'jsdom'],
      // Backend tests: Use node environment
      ['src/**/*.test.ts', 'node'],
    ],
    setupFiles: './vitest.setup.ts', // Setup file for React Testing Library
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
  },
}) 