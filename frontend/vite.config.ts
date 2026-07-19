import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://backend-production-f5bd.up.railway.app',
        changeOrigin: true,
      },
      '/users': 'http://backend-production-f5bd.up.railway.app',
    },
  },
});