import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    host: true,
    cors: true,
  },
  preview: {
    allowedHosts: [
      'sistema-de-monitoria.app.ic.ufba.br',
      'sistema-de-monitoria-api.app.ic.ufba.br',
      'localhost',
      '0.0.0.0',
      '.ic.ufba.br',
    ],
    host: true,
    cors: true,
  },
});
