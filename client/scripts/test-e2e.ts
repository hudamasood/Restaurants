import 'dotenv/config';
import { createServer } from 'node:http';
import availability from '../api/availability.ts';
import reservations from '../api/reservations.ts';
import { sql } from '../api/_lib/db.ts';

// Serve the two functions the way Vercel will, so the browser client is
// exercised against real HTTP rather than called directly.
const server = createServer(async (req, res) => {
  const url = new URL(req.url!, 'http://localhost:8787');
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = chunks.length ? Buffer.concat(chunks).toString() : undefined;
  const request = new Request(`http://localhost:8787${url.pathname}${url.search}`, {
    method: req.method, headers: req.headers as any, body,
  });
  const fn = url.pathname === '/api/availability' ? availability : reservations;
  const out = await fn(request);
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(await out.text());
});
await new Promise<void>((r) => server.listen(8787, r));

const { getAvailability, createReservation, getReservation } = await import('../src/lib/api.ts');
(globalThis as any).__BASE = 'http://localhost:8787';
const origFetch = globalThis.fetch;
globalThis.fetch = ((u: any, i: any) =>
  origFetch(typeof u === 'string' && u.startsWith('/') ? `http://localhost:8787${u}` : u, i)) as any;

const d = new Date();
const FRI = (() => { const x = new Date(d); x.setDate(x.getDate() + ((5 - x.getDay() + 7) % 7 || 7)); return x.toISOString().slice(0, 10); })();

console.log('E2E through src/lib/api.ts over HTTP\n');

const a = await getAvailability(FRI, 2);
console.log('1 availability      ', a.ok ? `ok, ${a.data.slots.length} slots, first ${a.data.slots[0].time}` : `FAIL ${a.message}`);

const bad = await createReservation({ date: FRI, time: '19:00', partySize: 2, seatingArea: 's1', name: 'A', email: 'nope', phone: '1' });
console.log('2 invalid payload   ', !bad.ok && bad.kind === 'validation' ? `validation, fields: ${Object.keys(bad.fields).join(',')}` : 'UNEXPECTED');

const email = `e2e${Date.now()}@example.com`;
const made = await createReservation({ date: FRI, time: '19:30', partySize: 2, seatingArea: 's1', name: 'E2E Guest', email, phone: '+44 20 7946 0000', occasion: 'Anniversary' });
console.log('3 create            ', made.ok ? `ok, ${made.data.booking.reference} in ${made.data.booking.seatingAreaName}` : `FAIL ${made.message}`);
if (!made.ok) process.exit(1);
const ref = made.data.booking.reference;

const got = await getReservation(ref);
console.log('4 fetch by reference', got.ok ? `ok, ${got.data.booking.name}, party ${got.data.booking.partySize}` : `FAIL ${got.message}`);

const missing = await getReservation('MH-ZZZZ');
console.log('5 unknown reference ', !missing.ok && missing.kind === 'notFound' ? 'notFound' : 'UNEXPECTED');

const dupe = await createReservation({ date: FRI, time: '19:30', partySize: 2, seatingArea: 's1', name: 'E2E Guest', email, phone: '+44 20 7946 0000' });
console.log('6 duplicate         ', !dupe.ok && dupe.kind === 'conflict' ? `conflict: "${dupe.message}"` : `UNEXPECTED ${JSON.stringify(dupe).slice(0,80)}`);

// Persistence across a "restart": query the DB directly.
const [row] = await sql`SELECT reference, guest_name FROM reservations WHERE reference = ${ref}` as any[];
console.log('7 persisted in DB   ', row ? `yes, ${row.reference} / ${row.guest_name}` : 'NO - not persisted');

const del = await sql`DELETE FROM reservations WHERE guest_email LIKE '%@example.com' RETURNING reference`;
console.log(`\ncleanup: removed ${del.length}`);
server.close();
