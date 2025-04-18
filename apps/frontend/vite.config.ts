import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  preview: {
    allowedHosts: [
      'sistema-de-monitoria.app.ic.ufba.br',
      'sistema-de-monitoria-api.app.ic.ufba.br',
      'localhost',
      '0.0.0.0',
    ],
    host: true,
  },
});
