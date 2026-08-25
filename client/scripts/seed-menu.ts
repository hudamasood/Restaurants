import 'dotenv/config';
import { sql } from '../api/_lib/db.ts';
import { STATIONS, COURSES, DISHES } from '../src/data/menu.ts';

// Stations. The rail shows three; still and garden are kitchens that dishes
// belong to without having their own section.
const PUBLIC = new Set(STATIONS.map((s) => s.id));
const ALL = [
  ...STATIONS.map((s, i) => ({ ...s, sort: i + 1, pub: true })),
  { id: 'still', name: 'The Still Room', tagline: '', description: '', image: '', thumbnails: [], sort: 4, pub: false },
  { id: 'garden', name: 'The Garden', tagline: '', description: '', image: '', thumbnails: [], sort: 5, pub: false },
].filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i);

for (const s of ALL) {
  await sql`
    INSERT INTO stations (id, name, tagline, description, image, thumbnails, sort_order, is_public)
    VALUES (${s.id}, ${s.name}, ${s.tagline ?? ''}, ${s.description ?? ''}, ${s.image ?? ''},
            ${s.thumbnails ?? []}, ${s.sort}, ${PUBLIC.has(s.id)})
    ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
      image=EXCLUDED.image, thumbnails=EXCLUDED.thumbnails,
      sort_order=EXCLUDED.sort_order, is_public=EXCLUDED.is_public`;
}

for (const [i, c] of COURSES.entries()) {
  await sql`
    INSERT INTO courses (id, name, sort_order) VALUES (${c.id}, ${c.name}, ${i + 1})
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, sort_order=EXCLUDED.sort_order`;
}

// Two passes: every dish first, then paired drinks, since a pairing points at
// another dish that may not exist yet on the first pass.
for (const d of DISHES) {
  await sql`
    INSERT INTO dishes (
      id, slug, name, description, long_description, station_id, course_id,
      price_cents, price_note, ingredients, dietary, provenance, media,
      is_signature, motion_signature, is_available, pickup_eligible, is_shared, sort_order
    ) VALUES (
      ${d.id}, ${d.slug}, ${d.name}, ${d.description}, ${d.longDescription ?? null},
      ${d.station}, ${d.course}, ${Math.round(d.price * 100)}, ${d.priceNote ?? null},
      ${d.ingredients}, ${JSON.stringify(d.dietary)}, ${JSON.stringify(d.provenance)},
      ${JSON.stringify(d.media)}, ${d.isSignature}, ${d.motionSignature ?? null},
      ${d.isAvailable}, ${d.pickupEligible}, ${d.isShared ?? false}, ${d.sortOrder}
    )
    ON CONFLICT (id) DO UPDATE SET
      slug=EXCLUDED.slug, name=EXCLUDED.name, description=EXCLUDED.description,
      long_description=EXCLUDED.long_description, station_id=EXCLUDED.station_id,
      course_id=EXCLUDED.course_id, price_cents=EXCLUDED.price_cents,
      price_note=EXCLUDED.price_note, ingredients=EXCLUDED.ingredients,
      dietary=EXCLUDED.dietary, provenance=EXCLUDED.provenance, media=EXCLUDED.media,
      is_signature=EXCLUDED.is_signature, motion_signature=EXCLUDED.motion_signature,
      is_available=EXCLUDED.is_available, pickup_eligible=EXCLUDED.pickup_eligible,
      is_shared=EXCLUDED.is_shared, sort_order=EXCLUDED.sort_order`;
}

let paired = 0;
for (const d of DISHES) {
  if (!d.pairedDrink) continue;
  await sql`UPDATE dishes SET paired_drink_id = ${d.pairedDrink} WHERE id = ${d.id}`;
  paired += 1;
}

const [n] = (await sql`SELECT
  (SELECT COUNT(*)::int FROM stations) AS stations,
  (SELECT COUNT(*)::int FROM courses)  AS courses,
  (SELECT COUNT(*)::int FROM dishes)   AS dishes,
  (SELECT COUNT(*)::int FROM dishes WHERE is_signature) AS sigs`) as any[];
console.log(`stations ${n.stations} | courses ${n.courses} | dishes ${n.dishes} | signatures ${n.sigs} | pairings ${paired}`);
