import 'dotenv/config';
import { createServer } from 'node:http';

/**
 * Runs the Vercel functions locally so `npm run dev` has a working API.
 * Vite's dev server does not execute anything in api/, so without this every
 * request falls through to the SPA shell and the app silently uses its seed
 * data — which hides real API problems until deploy.
 */
const ROUTES: Record<string, () => Promise<{ default: (req: Request) => Promise<Response> }>> = {
  '/api/menu': () => import('../api/menu.ts'),
  '/api/availability': () => import('../api/availability.ts'),
  '/api/reservations': () => import('../api/reservations.ts'),
  '/api/contact': () => import('../api/contact.ts'),
};

const PORT = Number(process.env.DEV_API_PORT ?? 8787);

createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const route = ROUTES[url.pathname];
  if (!route) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `No handler for ${url.pathname}` } }));
    return;
  }

  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);

  try {
    const { default: handler } = await route();
    const out = await handler(new Request(`http://localhost:${PORT}${url.pathname}${url.search}`, {
      method: req.method,
      headers: req.headers as any,
      body: chunks.length ? Buffer.concat(chunks).toString() : undefined,
    }));
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
  } catch (e) {
    console.error(url.pathname, e);
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { message: (e as Error).message } }));
  }
}).listen(PORT, () => console.log(`dev api on http://localhost:${PORT}`));
