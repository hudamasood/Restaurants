import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { connect } from 'node:net';

/**
 * Starts the API alongside the dev server.
 *
 * The functions in api/ are a separate process, and `npm run dev` used to
 * start only Vite. Every /api call then returned a 502 from the proxy below,
 * which surfaces as "no times are available" on the booking form and a failed
 * staff sign-in — both of which read as application bugs rather than as a
 * server that was never started. One command now brings up both.
 *
 * Dev only: `vite build` never applies this, and production serves api/ as
 * real functions.
 */
function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ port, host: '127.0.0.1' });
    socket.setTimeout(400);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => resolve(false));
  });
}

function devApi(): PluginOption {
  let child: ChildProcess | undefined;

  return {
    name: 'mh-dev-api',
    apply: 'serve',
    async configureServer() {
      // Someone may already be running `npm run dev:api` in its own terminal.
      // Starting a second one would only fail on EADDRINUSE.
      if (await portInUse(Number(process.env.DEV_API_PORT ?? 8787))) return;

      // tsx rather than node's own type stripping: api/ imports are
      // extensionless, which is what Vercel's compiler requires, and node's
      // ESM resolver will not resolve `./db` to `./db.ts`.
      child = spawn(
        process.execPath,
        [
          path.resolve(__dirname, 'node_modules/tsx/dist/cli.mjs'),
          path.resolve(__dirname, 'scripts/dev-api.ts'),
        ],
        { stdio: 'inherit', env: process.env },
      );
      child.on('exit', (code) => {
        if (code) console.error(`[dev-api] exited with ${code}`);
      });
      const stop = () => child?.kill();
      process.once('exit', stop);
      process.once('SIGINT', () => { stop(); process.exit(0); });
      process.once('SIGTERM', () => { stop(); process.exit(0); });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
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
