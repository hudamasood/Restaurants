import 'dotenv/config';
import session from '../api/admin/session.ts';
import { sql } from '../api/_lib/db.ts';

const EMAIL = 'owner@marrowandhearth.com';
const PASS = 'ChangeThisPassword123';
const B = 'http://localhost';
const post = (body: any, ip = '203.0.113.1') => session(new Request(`${B}/api/admin/session`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  body: JSON.stringify(body) }));

const show = async (l: string, r: Response) => {
  const b = await r.json().catch(() => ({}));
  console.log(`${l.padEnd(32)} ${r.status} ${JSON.stringify(b).slice(0, 90)}`);
  return { r, b: b as any };
};

console.log('LOGIN');
await show('  wrong password', await post({ email: EMAIL, password: 'nope' }, '10.0.0.1'));
await show('  unknown email', await post({ email: 'ghost@example.com', password: 'nope' }, '10.0.0.2'));
const ok = await show('  correct', await post({ email: EMAIL, password: PASS }, '10.0.0.3'));

const cookie = ok.r.headers.get('set-cookie') ?? '';
console.log('\nCOOKIE FLAGS');
console.log('  httpOnly    :', /HttpOnly/i.test(cookie));
console.log('  SameSite    :', /SameSite=Strict/i.test(cookie));
console.log('  Path        :', /Path=\//.test(cookie));
console.log('  raw         :', cookie.slice(0, 80) + '...');

const token = cookie.split(';')[0];
console.log('\nSESSION');
await show('  GET with cookie', await session(new Request(`${B}/api/admin/session`, { headers: { cookie: token } })));
await show('  GET without cookie', await session(new Request(`${B}/api/admin/session`)));
await show('  GET tampered token', await session(new Request(`${B}/api/admin/session`, { headers: { cookie: token.slice(0, -4) + 'AAAA' } })));

console.log('\nLOCKOUT (5 wrong attempts)');
for (let i = 1; i <= 5; i++) {
  const r = await post({ email: EMAIL, password: `wrong${i}` }, `10.1.0.${i}`);
  if (i >= 4) console.log(`  attempt ${i}:`.padEnd(34) + r.status);
}
await show('  correct pw while locked', await post({ email: EMAIL, password: PASS }, '10.1.0.9'));

await sql`UPDATE admins SET failed_logins = 0, locked_until = NULL WHERE lower(email) = ${EMAIL}`;
console.log('  (lock cleared)');
await show('  correct after unlock', await post({ email: EMAIL, password: PASS }, '10.1.0.10'));

console.log('\nSIGN OUT');
const out = await session(new Request(`${B}/api/admin/session`, { method: 'DELETE' }));
console.log('  clears cookie             ', /Max-Age=0/.test(out.headers.get('set-cookie') ?? ''));

const audit = await sql`SELECT action, admin_email FROM audit_log ORDER BY created_at DESC LIMIT 3` as any[];
console.log('\nAUDIT LOG'); audit.forEach(a => console.log(`  ${a.action} by ${a.admin_email}`));
