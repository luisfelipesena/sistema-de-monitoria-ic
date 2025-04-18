import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['app/server.ts'], // Entry point
  outDir: 'dist', // Output directory
  format: ['esm'], // Output format (ES Module)
  target: 'node20', // Target Node.js version
  splitting: false, // Prevent code splitting for server
  sourcemap: true, // Generate source maps
  clean: true, // Clean output directory before build
  // dts: true,            // Uncomment if you need type declarations
  // onSuccess: 'node dist/server.js' // Optional: run after successful build
});
