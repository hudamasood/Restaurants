import { SignJWT, jwtVerify } from 'jose';
import { sql } from './db';

/**
 * Staff authentication.
 *
 * Tokens live in an httpOnly cookie rather than localStorage, so a script
 * injected into the page cannot read them. SameSite=Strict, and Secure
 * outside development.
 */

const ISSUER = 'marrow-and-hearth';
const COOKIE = 'mh_session';
const TTL_SECONDS = 60 * 60 * 8; // one shift

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  return new TextEncoder().encode(s);
}

export interface Session {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
}

/* ── Passwords ─────────────────────────────────────────────────────── */

const ITERATIONS = 210_000; // OWASP guidance for PBKDF2-SHA256

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' }, key, 256,
  );
  return Buffer.from(new Uint8Array(bits)).toString('base64');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `${ITERATIONS}:${Buffer.from(salt).toString('base64')}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [iterStr, saltB64, expected] = stored.split(':');
  if (!iterStr || !saltB64 || !expected) return false;
  const actual = await derive(password, new Uint8Array(Buffer.from(saltB64, 'base64')), Number(iterStr));
  // Constant-time compare, so a response cannot be timed to leak the hash.
  const a = Buffer.from(actual), b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ── Tokens ────────────────────────────────────────────────────────── */

export async function issueToken(s: Session): Promise<string> {
  return new SignJWT({ email: s.email, name: s.name, role: s.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.id)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function readToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Session['role'],
    };
  } catch {
    return null;
  }
}

/* ── Cookies ───────────────────────────────────────────────────────── */

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE}=${token}; HttpOnly;${secure} SameSite=Strict; Path=/; Max-Age=${TTL_SECONDS}`;
}

export function clearCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE}=; HttpOnly;${secure} SameSite=Strict; Path=/; Max-Age=0`;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

/** The signed-in staff member, or null. */
export async function currentSession(req: Request): Promise<Session | null> {
  const token = readCookie(req, COOKIE);
  return token ? readToken(token) : null;
}

/** Guard for admin endpoints. Returns the session or a 401/403 Response. */
export async function requireAdmin(
  req: Request,
  roles?: Session['role'][],
): Promise<Session | Response> {
  const s = await currentSession(req);
  if (!s) {
    return new Response(JSON.stringify({ error: { message: 'Not signed in' } }), {
      status: 401, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  if (roles && !roles.includes(s.role)) {
    return new Response(JSON.stringify({ error: { message: 'Not permitted' } }), {
      status: 403, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  return s;
}

export async function auditLog(
  s: Session,
  action: string,
  entity: string,
  entityId?: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  await sql`
    INSERT INTO audit_log (admin_id, admin_email, action, entity, entity_id, detail)
    VALUES (${Number(s.id)}, ${s.email}, ${action}, ${entity}, ${entityId ?? null}, ${JSON.stringify(detail)})
  `;
}
