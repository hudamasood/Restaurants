import { z } from 'zod';
import { sql } from '../_lib/db';
import { json, fail, rateLimit, clientIp } from '../_lib/http';
import {
  verifyPassword, issueToken, sessionCookie, clearCookie, currentSession, auditLog,
} from '../_lib/auth';

export const config = { runtime: 'nodejs' };

const login = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export default async function handler(req: Request): Promise<Response> {
  /* Who am I? */
  if (req.method === 'GET') {
    const s = await currentSession(req);
    return s ? json({ session: s }) : fail('Not signed in', 401);
  }

  /* Sign out */
  if (req.method === 'DELETE') {
    return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
  }

  if (req.method !== 'POST') return fail('Method not allowed', 405);

  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60_000)) {
    return fail('Too many attempts. Try again shortly.', 429);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return fail('Expected JSON', 400); }

  const parsed = login.safeParse(body);
  // Deliberately vague: a precise message here tells an attacker which half
  // of the pair was wrong.
  if (!parsed.success) return fail('Email or password is incorrect', 401);

  const [admin] = (await sql`
    SELECT id, email, name, password_hash, role, is_active, failed_logins, locked_until
    FROM admins WHERE lower(email) = ${parsed.data.email}
  `) as any[];

  // Always run a verify, even with no such account, so the response time
  // does not reveal whether the email exists.
  const hash = admin?.password_hash ?? '210000:AAAAAAAAAAAAAAAAAAAAAA==:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const correct = await verifyPassword(parsed.data.password, hash);

  if (!admin || !admin.is_active) return fail('Email or password is incorrect', 401);

  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    return fail('This account is locked. Try again later.', 423);
  }

  if (!correct) {
    const attempts = admin.failed_logins + 1;
    const lock = attempts >= MAX_ATTEMPTS;
    await sql`
      UPDATE admins SET
        failed_logins = ${lock ? 0 : attempts},
        locked_until = ${lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null}
      WHERE id = ${admin.id}`;
    return lock
      ? fail(`Too many failed attempts. Locked for ${LOCK_MINUTES} minutes.`, 423)
      : fail('Email or password is incorrect', 401);
  }

  await sql`
    UPDATE admins SET failed_logins = 0, locked_until = NULL, last_login_at = now()
    WHERE id = ${admin.id}`;

  const session = {
    id: String(admin.id), email: admin.email, name: admin.name, role: admin.role,
  };
  await auditLog(session, 'login', 'admin', session.id);

  return json({ session }, 200, { 'set-cookie': sessionCookie(await issueToken(session)) });
}
