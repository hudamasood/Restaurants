import 'dotenv/config';
import { getAvailability } from '../api/_lib/availability.ts';
import { createReservation, findByReference } from '../api/_lib/reservations.ts';
import { sql } from '../api/_lib/db.ts';

const d = new Date();
const nextDow = (t: number) => { const x = new Date(d); x.setDate(x.getDate() + ((t - x.getDay() + 7) % 7 || 7)); return x.toISOString().slice(0, 10); };
const FRI = nextDow(5), MON = nextDow(1);
console.log(`dates -> Friday ${FRI} (open) | Monday ${MON} (closed)\n`);

console.log('1. CLOSED DAY');
const mon = await getAvailability(MON, 2);
console.log(`   open=${mon.open} reason="${mon.reason}" slots=${mon.slots.length}\n`);

console.log('2. OPEN DAY, party of 2');
const fri = await getAvailability(FRI, 2);
console.log(`   open=${fri.open} slots=${fri.slots.length}`);
console.log(`   first=${fri.slots[0]?.time} last=${fri.slots.at(-1)?.time}`);
console.log(`   areas at 19:00: ${fri.slots.find(s => s.time === '19:00')?.areas.join(', ')}\n`);

console.log('3. PARTY OF 12 (only Private Dining takes it)');
const big = await getAvailability(FRI, 12);
console.log(`   areas at 19:00: ${big.slots.find(s => s.time === '19:00')?.areas.join(', ') || '(none)'}\n`);

console.log('4. CREATE A BOOKING');
const made = await createReservation({
  date: FRI, time: '19:00', partySize: 2, seatingArea: 's1',
  name: 'Test Guest', email: `test${Date.now()}@example.com`, phone: '+44 20 7946 0000',
  occasion: 'Anniversary', dietaryNotes: 'No shellfish', accessibilityNotes: '',
});
if (!made.ok) { console.log('   FAILED:', made.message); process.exit(1); }
console.log(`   reference=${made.booking.reference} room=${made.booking.seatingAreaName}\n`);

console.log('5. LOOK IT UP');
const found = await findByReference(made.booking.reference);
console.log(`   found=${!!found} name=${found?.name} party=${found?.partySize} time=${found?.time}\n`);

console.log('6. DUPLICATE EMAIL, SAME SLOT');
const dup = await createReservation({
  date: FRI, time: '19:00', partySize: 2, seatingArea: 's1',
  name: 'Test Guest', email: made.booking.email, phone: '+44 20 7946 0000',
  occasion: '', dietaryNotes: '', accessibilityNotes: '',
});
console.log(`   ok=${dup.ok} ${dup.ok ? '' : `code=${dup.code} "${dup.message}"`}\n`);

console.log('7. FILL THE CHEF\'S TABLE (capacity 8) THEN OVERBOOK');
for (let i = 0; i < 2; i++) {
  await createReservation({ date: FRI, time: '20:00', partySize: 4, seatingArea: 's3',
    name: `Filler ${i}`, email: `fill${i}-${Date.now()}@example.com`, phone: '+44 20 7946 0001',
    occasion: '', dietaryNotes: '', accessibilityNotes: '' });
}
const over = await createReservation({ date: FRI, time: '20:00', partySize: 4, seatingArea: 's3',
  name: 'Overflow', email: `over${Date.now()}@example.com`, phone: '+44 20 7946 0002',
  occasion: '', dietaryNotes: '', accessibilityNotes: '' });
console.log(`   ok=${over.ok} ${over.ok ? '(SHOULD HAVE BEEN REFUSED)' : `refused: "${over.message}"`}`);

const after = await getAvailability(FRI, 4);
const s3at20 = after.slots.find(s => s.time === '20:00');
console.log(`   s3 still offered at 20:00? ${s3at20?.areas.includes('s3') ? 'YES (bug)' : 'no - correctly withheld'}`);
console.log(`   turn-time spillover, 21:00 offers s3? ${after.slots.find(s=>s.time==='21:00')?.areas.includes('s3') ? 'YES (bug)' : 'no - correctly held'}\n`);

console.log('cleanup');
const del = await sql`DELETE FROM reservations WHERE guest_email LIKE '%@example.com' RETURNING reference`;
console.log(`   removed ${del.length} test bookings`);
