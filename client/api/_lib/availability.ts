import { sql } from './db.js';

export interface Slot {
  time: string;
  available: boolean;
  /** Areas that can still take this party at this time. */
  areas: string[];
}

export interface AvailabilityResult {
  date: string;
  open: boolean;
  reason?: string;
  slots: Slot[];
}

const SLOT_MINUTES = 30;
/** A table is held for the slot it books plus this much of the next. */
const TURN_MINUTES = 120;

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/**
 * Real availability, derived from opening hours, closures, per-area capacity
 * and what is already booked — not a hash of the date.
 *
 * A booking occupies its own slot and every slot within the turn time after
 * it, because the table is not free again the moment the next slot starts.
 */
export async function getAvailability(date: string, party: number): Promise<AvailabilityResult> {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();

  const [hours] = await sql`
    SELECT opens_at, closes_at FROM opening_hours WHERE day_of_week = ${dow}
  ` as { opens_at: string | null; closes_at: string | null }[];

  if (!hours?.opens_at || !hours.closes_at) {
    return { date, open: false, reason: 'Closed on this day', slots: [] };
  }

  const [closure] = await sql`
    SELECT reason FROM closures WHERE on_date = ${date}
  ` as { reason: string }[];
  if (closure) return { date, open: false, reason: closure.reason, slots: [] };

  // Areas that can physically seat this party at all.
  const areas = await sql`
    SELECT id, capacity FROM seating_areas
    WHERE is_active AND min_party <= ${party} AND max_party >= ${party}
    ORDER BY sort_order
  ` as { id: string; capacity: number }[];

  if (areas.length === 0) {
    return { date, open: true, reason: 'No room takes a party of this size', slots: [] };
  }

  // Covers already committed, per area and start time, for live bookings only.
  const booked = await sql`
    SELECT seating_area_id, to_char(at_time, 'HH24:MI') AS at_time, SUM(party_size)::int AS covers
    FROM reservations
    WHERE on_date = ${date} AND status IN ('pending', 'confirmed', 'seated')
    GROUP BY seating_area_id, at_time
  ` as { seating_area_id: string; at_time: string; covers: number }[];

  const open = toMinutes(hours.opens_at.slice(0, 5));
  let close = toMinutes(hours.closes_at.slice(0, 5));
  if (close <= open) close += 24 * 60; // past midnight

  // Last seating leaves room for the turn.
  const lastSeating = close - TURN_MINUTES;

  const slots: Slot[] = [];
  for (let m = open; m <= lastSeating; m += SLOT_MINUTES) {
    const label = toHHMM(m);
    const free: string[] = [];

    for (const area of areas) {
      // Everything overlapping this slot's turn window.
      let used = 0;
      for (const b of booked) {
        if (b.seating_area_id !== area.id) continue;
        let bm = toMinutes(b.at_time);
        if (bm < open) bm += 24 * 60;
        if (Math.abs(bm - m) < TURN_MINUTES) used += b.covers;
      }
      if (used + party <= area.capacity) free.push(area.id);
    }

    slots.push({ time: label, available: free.length > 0, areas: free });
  }

  return { date, open: true, slots };
}

/** True when this exact area still has room for the party at that time. */
export async function areaHasRoom(
  date: string,
  time: string,
  areaId: string,
  party: number,
): Promise<{ ok: boolean; reason?: string }> {
  const [area] = await sql`
    SELECT capacity, min_party, max_party FROM seating_areas
    WHERE id = ${areaId} AND is_active
  ` as { capacity: number; min_party: number; max_party: number }[];

  if (!area) return { ok: false, reason: 'That room is not available' };
  if (party < area.min_party || party > area.max_party) {
    return { ok: false, reason: `That room seats ${area.min_party}–${area.max_party} guests` };
  }

  const [row] = await sql`
    SELECT COALESCE(SUM(party_size), 0)::int AS covers
    FROM reservations
    WHERE on_date = ${date} AND seating_area_id = ${areaId}
      AND status IN ('pending', 'confirmed', 'seated')
      AND ABS(EXTRACT(EPOCH FROM (at_time - ${time}::time)) / 60) < ${TURN_MINUTES}
  ` as { covers: number }[];

  if (row.covers + party > area.capacity) {
    return { ok: false, reason: 'That time was just taken' };
  }
  return { ok: true };
}
