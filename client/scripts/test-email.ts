import 'dotenv/config';
import reservations from '../api/reservations.ts';
import { confirmationEmail, sendEmail } from '../api/_lib/email.ts';
import { sql } from '../api/_lib/db.ts';
import { writeFileSync } from 'node:fs';

const d = new Date();
const FRI = (() => { const x = new Date(d); x.setDate(x.getDate() + ((5 - x.getDay() + 7) % 7 || 7)); return x.toISOString().slice(0, 10); })();

console.log('RESEND_API_KEY set:', Boolean(process.env.RESEND_API_KEY), '\n');

// 1. Unconfigured send must not throw and must report why.
const skipped = await sendEmail({ to: 'a@example.com', subject: 's', html: '<p>x</p>', text: 'x' });
console.log('1 unconfigured send ->', JSON.stringify(skipped));

// 2. A booking must still succeed with no mail provider.
const email = `mail${Date.now()}@example.com`;
const res = await reservations(new Request('http://localhost/api/reservations', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ date: FRI, time: '20:30', partySize: 3, seatingArea: 's1',
    name: 'Ada Lovelace', email, phone: '+44 20 7946 0000',
    occasion: 'Birthday', dietaryNotes: 'No shellfish' }) }));
const body = await res.json() as any;
console.log(`2 booking with no mail provider -> ${res.status}, emailed=${body.emailed}, ref=${body.booking?.reference}`);
if (res.status !== 201) { console.log('   FAILED - booking should still succeed'); process.exit(1); }

// 3. Template renders with real data.
const mail = confirmationEmail(body.booking);
writeFileSync('/tmp/confirmation.html', mail.html);
console.log(`3 subject -> ${mail.subject}`);
console.log(`   html ${mail.html.length} bytes, text ${mail.text.length} bytes`);
console.log(`   reference in html: ${mail.html.includes(body.booking.reference)}`);
console.log(`   optional rows included: occasion=${mail.html.includes('Birthday')} dietary=${mail.html.includes('No shellfish')}`);
console.log('\n--- plain text ---\n' + mail.text);

const del = await sql`DELETE FROM reservations WHERE guest_email LIKE '%@example.com' RETURNING reference`;
console.log(`\ncleanup: removed ${del.length}`);
