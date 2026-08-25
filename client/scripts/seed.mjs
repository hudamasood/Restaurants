import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Mirrors SEATING_AREAS in src/data/site.ts. Capacity is covers per slot and
// is the one field the frontend has no opinion about, since it never had to
// know how many tables actually exist.
const AREAS = [
  ['s1', 'The Main Room',    'Under the vault, with the hearth in view.',      1,  8, 64, 1],
  ['s2', 'The Terrace',      'Covered and heated. Full menu except the soufflé.', 1, 6, 28, 2],
  ['s3', "The Chef's Table", 'One seating a night. Minimum four guests.',      4,  8,  8, 3],
  ['s4', 'Private Dining',   'Behind the still room. Ten guests and above.',  10, 24, 24, 4],
];

// day_of_week uses Postgres EXTRACT(DOW): 0 = Sunday.
const HOURS = [
  [0, 'Sunday',    '12:00', '22:00'],
  [1, 'Monday',     null,    null  ],
  [2, 'Tuesday',   '17:30', '23:00'],
  [3, 'Wednesday', '17:30', '23:00'],
  [4, 'Thursday',  '17:30', '23:30'],
  [5, 'Friday',    '12:00', '23:59'],
  [6, 'Saturday',  '12:00', '23:59'],
];

for (const [id, name, note, minP, maxP, cap, ord] of AREAS) {
  await sql`
    INSERT INTO seating_areas (id, name, note, min_party, max_party, capacity, sort_order)
    VALUES (${id}, ${name}, ${note}, ${minP}, ${maxP}, ${cap}, ${ord})
    ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, note=EXCLUDED.note, min_party=EXCLUDED.min_party,
      max_party=EXCLUDED.max_party, capacity=EXCLUDED.capacity, sort_order=EXCLUDED.sort_order`;
}

for (const [dow, label, opens, closes] of HOURS) {
  await sql`
    INSERT INTO opening_hours (day_of_week, label, opens_at, closes_at)
    VALUES (${dow}, ${label}, ${opens}, ${closes})
    ON CONFLICT (day_of_week) DO UPDATE SET
      label=EXCLUDED.label, opens_at=EXCLUDED.opens_at, closes_at=EXCLUDED.closes_at`;
}

const a = await sql`SELECT id, name, min_party, max_party, capacity FROM seating_areas ORDER BY sort_order`;
const h = await sql`SELECT day_of_week, label, opens_at, closes_at FROM opening_hours ORDER BY day_of_week`;
console.log('seating areas:');
a.forEach(r => console.log(`   ${r.id}  ${r.name.padEnd(18)} party ${r.min_party}-${r.max_party}, ${r.capacity} covers`));
console.log('opening hours:');
h.forEach(r => console.log(`   ${r.label.padEnd(10)} ${r.opens_at ? r.opens_at + ' - ' + r.closes_at : 'closed'}`));
