import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('motion')) return 'motion';
            if (id.includes('react-router')) return 'router';
            if (id.includes('@tanstack')) return 'query';
            if (id.includes('react')) return 'react';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    // The functions in api/ are not run by Vite. `npm run dev:api` serves them
    // on 8787 and this forwards to it, so local dev exercises the real API
    // instead of silently falling back to bundled seed data.
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.DEV_API_PORT ?? 8787}`,
        changeOrigin: true,
      },
    },
  },
});
