import { sql } from './db.ts';

/**
 * Returns the menu in exactly the shape src/types/index.ts already declares,
 * so consumers cannot tell whether it came from the bundle or the database.
 * That is what lets the bundled copy stay as a first-paint fallback.
 */

export interface MenuPayload {
  stations: unknown[];
  courses: unknown[];
  dishes: unknown[];
}

export async function getMenu(): Promise<MenuPayload> {
  const [stations, courses, dishes] = await Promise.all([
    sql`SELECT id, name, tagline, description, image, thumbnails
        FROM stations WHERE is_public ORDER BY sort_order`,
    sql`SELECT id, name FROM courses ORDER BY sort_order`,
    sql`SELECT id, slug, name, description, long_description, station_id, course_id,
               price_cents, price_note, ingredients, dietary, provenance, media,
               is_signature, motion_signature, paired_drink_id,
               is_available, pickup_eligible, is_shared, sort_order
        FROM dishes ORDER BY sort_order`,
  ]);

  return {
    stations: (stations as any[]).map((s) => ({
      id: s.id,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      image: s.image,
      thumbnails: s.thumbnails ?? [],
    })),
    courses: (courses as any[]).map((c) => ({ id: c.id, name: c.name })),
    dishes: (dishes as any[]).map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      description: d.description,
      ...(d.long_description ? { longDescription: d.long_description } : {}),
      station: d.station_id,
      course: d.course_id,
      // Stored as cents; the app has always worked in whole units.
      price: d.price_cents / 100,
      ...(d.price_note ? { priceNote: d.price_note } : {}),
      ingredients: d.ingredients ?? [],
      dietary: d.dietary,
      provenance: d.provenance,
      media: d.media,
      isSignature: d.is_signature,
      ...(d.motion_signature ? { motionSignature: d.motion_signature } : {}),
      ...(d.paired_drink_id ? { pairedDrink: d.paired_drink_id } : {}),
      isAvailable: d.is_available,
      pickupEligible: d.pickup_eligible,
      ...(d.is_shared ? { isShared: true } : {}),
      sortOrder: d.sort_order,
    })),
  };
}
