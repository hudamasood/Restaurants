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
  server: { port: 5173, host: true },
});
