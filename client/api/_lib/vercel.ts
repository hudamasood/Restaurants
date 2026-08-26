import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Adapts a Web-standard handler to Vercel's Node.js runtime.
 *
 * Every endpoint here is written against the Web API — `handler(req: Request)`
 * returning a `Response` — which is what the local dev server and the tests
 * call directly. Vercel's `nodejs` runtime instead invokes the default export
 * with Node's `(IncomingMessage, ServerResponse)`, where `headers` is a plain
 * object. That mismatch is what produced
 *
 *   TypeError: req.headers.get is not a function
 *
 * on the very first line of every request, before any endpoint logic ran.
 *
 * The wrapper is dual-mode on purpose. Called with one argument it passes the
 * Request straight through, so `scripts/dev-api.ts` and the test suites keep
 * working unchanged; called with two it converts in and out of Node's objects.
 * No endpoint's own logic changes.
 */
export type WebHandler = (req: Request) => Promise<Response>;

function toWebRequest(req: IncomingMessage, body?: Buffer): Request {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'localhost';
  const url = new URL(req.url ?? '/', `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, value);
  }

  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD' && body && body.length > 0;

  // A Node Buffer is a Uint8Array, but its type does not line up with
  // BodyInit; the view over the same bytes does, with no copy.
  const init: RequestInit = { method, headers };
  if (hasBody) init.body = new Uint8Array(body);

  return new Request(url, init);
}

/** Reads the request stream, unless the runtime already consumed it. */
async function readBody(req: IncomingMessage): Promise<Buffer> {
  // Vercel parses JSON and form bodies onto `req.body`, which leaves the
  // stream empty. Re-serialise rather than hanging on a stream that will
  // never emit.
  const parsed = (req as IncomingMessage & { body?: unknown }).body;
  if (parsed !== undefined && parsed !== null) {
    if (Buffer.isBuffer(parsed)) return parsed;
    if (typeof parsed === 'string') return Buffer.from(parsed);
    return Buffer.from(JSON.stringify(parsed));
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function writeNodeResponse(response: Response, res: ServerResponse): Promise<void> {
  // `set-cookie` is the one header that may legitimately repeat, and folding
  // it into a comma-joined string would break the session cookie.
  const cookies = response.headers.getSetCookie?.() ?? [];
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return;
    res.setHeader(key, value);
  });
  if (cookies.length) res.setHeader('set-cookie', cookies);

  res.statusCode = response.status;
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

export function withVercel(handler: WebHandler) {
  return async function adapted(
    a: Request | IncomingMessage,
    b?: ServerResponse,
  ): Promise<Response | void> {
    if (!b) return handler(a as Request);

    const nodeReq = a as IncomingMessage;
    try {
      const body = await readBody(nodeReq);
      await writeNodeResponse(await handler(toWebRequest(nodeReq, body)), b);
    } catch (e) {
      console.error('handler failed', e);
      b.statusCode = 500;
      b.setHeader('content-type', 'application/json; charset=utf-8');
      b.end(JSON.stringify({ error: { message: 'Something went wrong.' } }));
    }
  };
}
