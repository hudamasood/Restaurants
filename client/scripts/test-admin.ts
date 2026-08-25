import 'dotenv/config';
import session from '../api/admin/session.ts';
import adminRes from '../api/admin/reservations.ts';
import adminDish from '../api/admin/dishes.ts';
import reservations from '../api/reservations.ts';
import { sql } from '../api/_lib/db.ts';

const B = 'http://localhost';
const show = async (l: string, r: Response) => {
  const b = await r.json().catch(() => ({}));
  console.log(`${l.padEnd(36)} ${r.status} ${JSON.stringify(b).slice(0, 95)}`);
  return b as any;
};

console.log('GUARDS (no cookie)');
await show('  GET reservations', await adminRes(new Request(`${B}/x?date=2026-08-28`)));
await show('  PATCH dish', await adminDish(new Request(`${B}/x`, { method: 'PATCH', body: '{}' })));

const login = await session(new Request(`${B}/api/admin/session`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.9.9.9' },
  body: JSON.stringify({ email: 'owner@marrowandhearth.com', password: 'ChangeThisPassword123' }) }));
const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];
const auth = { cookie };
console.log('\nsigned in:', login.status === 200);

const d = new Date();
const FRI = (() => { const x = new Date(d); x.setDate(x.getDate() + ((5 - x.getDay() + 7) % 7 || 7)); return x.toISOString().slice(0, 10); })();

// Seed one real booking through the public API.
const made = await reservations(new Request(`${B}/api/reservations`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ date: FRI, time: '19:00', partySize: 4, seatingArea: 's1',
    name: 'Grace Hopper', email: `admin${Date.now()}@example.com`, phone: '+44 20 7946 0000',
    occasion: 'Anniversary', dietaryNotes: 'Severe nut allergy' }) }));
const booking = (await made.json()).booking;
console.log('seeded booking:', booking.reference);

console.log('\nDAY VIEW');
const day = await show('  GET day', await adminRes(new Request(`${B}/x?date=${FRI}`, { headers: auth })));
console.log(`  covers=${day.covers} bookings=${day.bookings.length}`);
const b0 = day.bookings.find((x: any) => x.reference === booking.reference);
console.log(`  dietary surfaced: "${b0?.dietaryNotes}"`);
await show('  GET bad date', await adminRes(new Request(`${B}/x?date=nope`, { headers: auth })));

console.log('\nSTATUS TRANSITION');
await show('  seat the table', await adminRes(new Request(`${B}/x`, {
  method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' },
  body: JSON.stringify({ id: Number(b0.id), status: 'seated', tableAssignment: 'T12' }) })));
await show('  invalid status', await adminRes(new Request(`${B}/x`, {
  method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' },
  body: JSON.stringify({ id: Number(b0.id), status: 'teleported' }) })));

console.log('\nMENU');
const dishes = await show('  GET dishes', await adminDish(new Request(`${B}/x`, { headers: auth })));
console.log(`  count=${dishes.dishes.length}`);
await show('  86 the tomahawk', await adminDish(new Request(`${B}/x`, {
  method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' },
  body: JSON.stringify({ id: 'd11', isAvailable: false }) })));

const pub = await (await import('../api/menu.ts')).default(new Request(`${B}/api/menu`));
const pubBody = await pub.json();
const tom = pubBody.dishes.find((x: any) => x.id === 'd11');
console.log(`  public menu now shows isAvailable=${tom.isAvailable}`);

await adminDish(new Request(`${B}/x`, { method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' },
  body: JSON.stringify({ id: 'd11', isAvailable: true }) }));
console.log('  restored');

const audit = await sql`SELECT action, entity, entity_id, detail FROM audit_log ORDER BY created_at DESC LIMIT 4` as any[];
console.log('\nAUDIT'); audit.forEach(a => console.log(`  ${a.action} ${a.entity} ${a.entity_id ?? ''} ${JSON.stringify(a.detail)}`));

await sql`DELETE FROM reservations WHERE guest_email LIKE '%@example.com'`;
console.log('\ncleanup done');
