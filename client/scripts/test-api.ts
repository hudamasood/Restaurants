import 'dotenv/config';
import availability from '../api/availability.ts';
import reservations from '../api/reservations.ts';
import { sql } from '../api/_lib/db.ts';

const d = new Date();
const nextDow = (t: number) => { const x = new Date(d); x.setDate(x.getDate() + ((t - x.getDay() + 7) % 7 || 7)); return x.toISOString().slice(0, 10); };
const FRI = nextDow(5), MON = nextDow(1);
const B = 'http://localhost';
const show = async (label: string, r: Response) => {
  const b = await r.json().catch(() => ({}));
  console.log(`${label}\n   ${r.status} ${JSON.stringify(b).slice(0, 150)}`);
  return b as any;
};

console.log('AVAILABILITY');
await show('  GET missing params', await availability(new Request(`${B}/api/availability`)));
await show('  GET bad date', await availability(new Request(`${B}/api/availability?date=31-08-2026&party=2`)));
await show('  GET party=99', await availability(new Request(`${B}/api/availability?date=${FRI}&party=99`)));
const okA = await show('  GET closed Monday', await availability(new Request(`${B}/api/availability?date=${MON}&party=2`)));
const okB = await show('  GET open Friday', await availability(new Request(`${B}/api/availability?date=${FRI}&party=2`)));
console.log(`   -> Monday open=${okA.open}, Friday slots=${okB.slots?.length}`);
await show('  POST to availability', await availability(new Request(`${B}/api/availability`, { method: 'POST' })));

console.log('\nRESERVATIONS');
await show('  POST non-JSON', await reservations(new Request(`${B}/api/reservations`, { method: 'POST', body: 'nope' })));
await show('  POST invalid fields', await reservations(new Request(`${B}/api/reservations`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ date: FRI, time: '19:00', partySize: 2, seatingArea: 's1', name: 'A', email: 'bad', phone: '1' }) })));

const email = `api${Date.now()}@example.com`;
const created = await show('  POST valid', await reservations(new Request(`${B}/api/reservations`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ date: FRI, time: '18:30', partySize: 2, seatingArea: 's1',
    name: 'API Test', email, phone: '+44 20 7946 0000', occasion: 'Birthday' }) })));

const ref = created?.booking?.reference;
await show('  GET by reference', await reservations(new Request(`${B}/api/reservations?reference=${ref}`)));
await show('  GET bad reference', await reservations(new Request(`${B}/api/reservations?reference=XX-1`)));
await show('  GET unknown reference', await reservations(new Request(`${B}/api/reservations?reference=MH-ZZZZ`)));
await show('  POST duplicate', await reservations(new Request(`${B}/api/reservations`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ date: FRI, time: '18:30', partySize: 2, seatingArea: 's1',
    name: 'API Test', email, phone: '+44 20 7946 0000' }) })));
await show('  DELETE', await reservations(new Request(`${B}/api/reservations`, { method: 'DELETE' })));

const del = await sql`DELETE FROM reservations WHERE guest_email LIKE '%@example.com' RETURNING reference`;
console.log(`\ncleanup: removed ${del.length}`);
