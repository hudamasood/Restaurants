/** Shared response helpers. Every endpoint answers in the same shape. */

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  });
}

export function fail(message: string, status = 400, code?: string) {
  return json({ error: { message, ...(code ? { code } : {}) } }, status);
}

/**
 * Fixed-window per-IP throttle. In-memory, so on serverless it is per
 * instance rather than global — real protection against a single client
 * hammering one warm instance, not a substitute for an edge rule.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= limit) return false;
  rec.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0].trim() : '') || req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Turns a ZodError into { field: message } for the form to render.
 * zod 4 types `path` as PropertyKey[], so the key is stringified rather than
 * assumed to be a string.
 */
export function fieldErrors(err: { issues: readonly { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0] ?? '_')] = i.message;
  return out;
}
