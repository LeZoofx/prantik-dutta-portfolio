import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
  build: { target: 'es2018', cssCodeSplit: true, emptyOutDir: true, sourcemap: false },
});
