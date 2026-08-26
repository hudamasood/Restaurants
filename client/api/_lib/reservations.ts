import { sql } from './db.js';
import { areaHasRoom } from './availability.js';
import type { CreateReservation } from './schema.js';

const CHARS = 'ACDEFGHJKLMNPQRTUVWXY34679'; // no easily-confused glyphs

function makeReference(): string {
  let out = 'MH-';
  for (let i = 0; i < 4; i += 1) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export interface Booking {
  reference: string;
  date: string;
  time: string;
  partySize: number;
  seatingArea: string;
  seatingAreaName: string;
  name: string;
  email: string;
  phone: string;
  occasion: string;
  dietaryNotes: string;
  accessibilityNotes: string;
  status: string;
  createdAt: string;
}

export type CreateResult =
  | { ok: true; booking: Booking }
  | { ok: false; code: 'slot_taken' | 'duplicate' | 'invalid'; message: string };

export async function createReservation(input: CreateReservation): Promise<CreateResult> {
  const room = await areaHasRoom(input.date, input.time, input.seatingArea, input.partySize);
  if (!room.ok) return { ok: false, code: 'slot_taken', message: room.reason! };

  // Reference codes are short enough to collide; retry rather than fail.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const reference = makeReference();
    try {
      const [row] = await sql`
        INSERT INTO reservations (
          reference, on_date, at_time, party_size, seating_area_id,
          guest_name, guest_email, guest_phone,
          occasion, dietary_notes, accessibility_notes
        ) VALUES (
          ${reference}, ${input.date}, ${input.time}, ${input.partySize}, ${input.seatingArea},
          ${input.name}, ${input.email}, ${input.phone},
          ${input.occasion}, ${input.dietaryNotes}, ${input.accessibilityNotes}
        )
        RETURNING reference, to_char(on_date,'YYYY-MM-DD') AS date,
                  to_char(at_time,'HH24:MI') AS time, party_size, seating_area_id,
                  guest_name, guest_email, guest_phone, occasion,
                  dietary_notes, accessibility_notes, status, created_at
      ` as any[];
      return { ok: true, booking: shape(row, await areaName(input.seatingArea)) };
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (msg.includes('reservations_reference_key')) continue; // collision, retry
      if (msg.includes('reservations_no_double_book_idx')) {
        return {
          ok: false,
          code: 'duplicate',
          message: 'There is already a booking for this email at that time.',
        };
      }
      throw e;
    }
  }
  return { ok: false, code: 'invalid', message: 'Could not allocate a reference. Try again.' };
}

async function areaName(id: string): Promise<string> {
  const [a] = await sql`SELECT name FROM seating_areas WHERE id = ${id}` as { name: string }[];
  return a?.name ?? '';
}

function shape(r: any, seatingAreaName: string): Booking {
  return {
    reference: r.reference,
    date: r.date,
    time: r.time,
    partySize: r.party_size,
    seatingArea: r.seating_area_id,
    seatingAreaName,
    name: r.guest_name,
    email: r.guest_email,
    phone: r.guest_phone,
    occasion: r.occasion,
    dietaryNotes: r.dietary_notes,
    accessibilityNotes: r.accessibility_notes,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function findByReference(reference: string): Promise<Booking | null> {
  const [row] = await sql`
    SELECT r.reference, to_char(r.on_date,'YYYY-MM-DD') AS date,
           to_char(r.at_time,'HH24:MI') AS time, r.party_size, r.seating_area_id,
           r.guest_name, r.guest_email, r.guest_phone, r.occasion,
           r.dietary_notes, r.accessibility_notes, r.status, r.created_at,
           s.name AS area_name
    FROM reservations r
    JOIN seating_areas s ON s.id = r.seating_area_id
    WHERE r.reference = ${reference}
  ` as any[];
  return row ? shape(row, row.area_name) : null;
}
