import { z } from 'zod';
import { sql } from '../_lib/db.js';
import { json, fail, fieldErrors } from '../_lib/http.js';
import { requireAdmin, auditLog } from '../_lib/auth.js';
import { dateString } from '../_lib/schema.js';
import { withVercel } from '../_lib/vercel.js';

export const config = { runtime: 'nodejs' };

const STATUSES = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'] as const;

const patch = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(STATUSES).optional(),
  tableAssignment: z.string().trim().max(40).nullable().optional(),
  internalNotes: z.string().trim().max(2000).optional(),
});

async function handler(req: Request): Promise<Response> {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  /* The day view. Everything for one service, in seating order. */
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const date = dateString.safeParse(url.searchParams.get('date') ?? '');
    if (!date.success) return fail('Provide ?date=YYYY-MM-DD', 400);

    const rows = (await sql`
      SELECT r.id, r.reference, to_char(r.on_date,'YYYY-MM-DD') AS date,
             to_char(r.at_time,'HH24:MI') AS time, r.party_size, r.seating_area_id,
             s.name AS area_name, r.guest_name, r.guest_email, r.guest_phone,
             r.occasion, r.dietary_notes, r.accessibility_notes,
             r.status, r.table_assignment, r.internal_notes, r.created_at
      FROM reservations r
      JOIN seating_areas s ON s.id = r.seating_area_id
      WHERE r.on_date = ${date.data}
      ORDER BY r.at_time, s.sort_order, r.created_at
    `) as any[];

    const covers = rows
      .filter((r) => ['pending', 'confirmed', 'seated'].includes(r.status))
      .reduce((n, r) => n + r.party_size, 0);

    return json({
      date: date.data,
      covers,
      bookings: rows.map((r) => ({
        id: String(r.id),
        reference: r.reference,
        date: r.date,
        time: r.time,
        partySize: r.party_size,
        seatingArea: r.seating_area_id,
        seatingAreaName: r.area_name,
        name: r.guest_name,
        email: r.guest_email,
        phone: r.guest_phone,
        occasion: r.occasion,
        // Surfaced prominently in the UI: the kitchen needs to see this
        // before the guest sits down, not after.
        dietaryNotes: r.dietary_notes,
        accessibilityNotes: r.accessibility_notes,
        status: r.status,
        tableAssignment: r.table_assignment,
        internalNotes: r.internal_notes,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    });
  }

  /* Status transitions, table assignment and notes. */
  if (req.method === 'PATCH') {
    let body: unknown;
    try { body = await req.json(); } catch { return fail('Expected JSON', 400); }

    const parsed = patch.safeParse(body);
    if (!parsed.success) {
      return json({ error: { message: 'Invalid change', fields: fieldErrors(parsed.error) } }, 422);
    }
    const { id, status, tableAssignment, internalNotes } = parsed.data;

    const [before] = (await sql`SELECT status FROM reservations WHERE id = ${id}`) as any[];
    if (!before) return fail('No such reservation', 404);

    const [row] = (await sql`
      UPDATE reservations SET
        status           = COALESCE(${status ?? null}::reservation_status, status),
        table_assignment = COALESCE(${tableAssignment ?? null}, table_assignment),
        internal_notes   = COALESCE(${internalNotes ?? null}, internal_notes)
      WHERE id = ${id}
      RETURNING id, reference, status, table_assignment, internal_notes
    `) as any[];

    await auditLog(auth, 'update', 'reservation', String(id), {
      from: before.status, to: row.status,
      ...(tableAssignment !== undefined ? { tableAssignment } : {}),
    });

    return json({
      booking: {
        id: String(row.id), reference: row.reference, status: row.status,
        tableAssignment: row.table_assignment, internalNotes: row.internal_notes,
      },
    });
  }

  return fail('Method not allowed', 405);
}

export default withVercel(handler);
