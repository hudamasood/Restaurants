import 'dotenv/config';
import contact from '../api/contact.ts';
import { sql } from '../api/_lib/db.ts';

const post = (body: any, ip = '203.0.113.9') =>
  contact(new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, 'user-agent': 'test' },
    body: JSON.stringify(body),
  }));

const base = (over: any = {}) => ({
  name: 'Ada Lovelace', email: `c${Date.now()}${Math.random().toString(36).slice(2,6)}@example.com`,
  subject: 'Private Dining', message: 'Hello, I would like to enquire about a private dinner for twelve people in March.',
  startedAt: Date.now() - 20_000, ...over,
});

const show = async (label: string, r: Response) => {
  const b = await r.json().catch(() => ({}));
  console.log(`${label.padEnd(34)} ${r.status} ${JSON.stringify(b)}`);
  return b as any;
};

console.log('VALIDATION');
await show('  missing fields', await post({ name: 'A', email: 'bad', message: 'short' }));
await show('  GET not allowed', await contact(new Request('http://localhost/api/contact')));

console.log('\nGENUINE');
const good = await show('  real enquiry', await post(base()));

console.log('\nSPAM HEURISTICS (all should look identical to the caller)');
await show('  honeypot filled', await post(base({ website: 'http://spam.example' })));
await show('  submitted in 400ms', await post(base({ startedAt: Date.now() - 400 })));
await show('  two links', await post(base({ message: 'Visit https://a.example and https://b.example for cheap deals now.' })));
await show('  solicitation keywords', await post(base({ message: 'We offer SEO backlink packages to help you rank higher in search.' })));
await show('  link in name', await post(base({ name: 'www.spam.example' })));

const em = `flood${Date.now()}@example.com`;
for (let i = 0; i < 3; i++) await post(base({ email: em, message: `Message number ${i} about a booking enquiry please.` }), `198.51.100.${i}`);
await show('  fourth from same sender', await post(base({ email: em, message: 'Another different message entirely here.' }), '198.51.100.9'));

const dupEmail = `dup${Date.now()}@example.com`;
const dupMsg = 'This is the exact same message body sent twice in a row.';
await post(base({ email: dupEmail, message: dupMsg }), '198.51.100.20');
await show('  duplicate message', await post(base({ email: dupEmail, message: dupMsg }), '198.51.100.21'));

console.log('\nRATE LIMIT (6th from one IP in 10 min)');
for (let i = 0; i < 5; i++) await post(base(), '192.0.2.77');
await show('  sixth request', await post(base(), '192.0.2.77'));

console.log('\nWHAT LANDED IN THE TABLE');
const rows = await sql`
  SELECT status, spam_reason, COUNT(*)::int AS n FROM enquiries
  WHERE email LIKE '%@example.com'
  GROUP BY status, spam_reason ORDER BY status, n DESC` as any[];
rows.forEach(r => console.log(`   ${String(r.status).padEnd(6)} ${String(r.n).padStart(2)}  ${r.spam_reason ?? '—'}`));

const del = await sql`DELETE FROM enquiries WHERE email LIKE '%@example.com' RETURNING id`;
console.log(`\ncleanup: removed ${del.length}`);
