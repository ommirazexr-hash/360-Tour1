import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Crucial: relative assets resolution for offline deployments
  build: {
    outDir: 'dist',
    assetsDir: 'viewer',
    emptyOutDir: true,
  },
});
