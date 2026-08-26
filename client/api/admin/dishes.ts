import { z } from 'zod';
import { sql } from '../_lib/db.js';
import { json, fail, fieldErrors } from '../_lib/http.js';
import { requireAdmin, auditLog } from '../_lib/auth.js';
import { withVercel } from '../_lib/vercel.js';

export const config = { runtime: 'nodejs' };

/**
 * Menu editing. Every field is optional: the common case by far is toggling
 * one dish's availability mid-service, and that should not require sending
 * the whole record back.
 */
const patch = z.object({
  id: z.string().min(1).max(32),
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(600).optional(),
  longDescription: z.string().trim().max(4000).nullable().optional(),
  price: z.coerce.number().min(0).max(100000).optional(),
  priceNote: z.string().trim().max(120).nullable().optional(),
  isAvailable: z.boolean().optional(),
  isSignature: z.boolean().optional(),
  pickupEligible: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

async function handler(req: Request): Promise<Response> {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  /* Everything, including unavailable dishes the public endpoint still shows
     but which staff need to see flagged. */
  if (req.method === 'GET') {
    const rows = (await sql`
      SELECT d.id, d.slug, d.name, d.description, d.price_cents, d.price_note,
             d.course_id, d.station_id, d.is_available, d.is_signature,
             d.pickup_eligible, d.sort_order, d.media, d.updated_at,
             c.name AS course_name, s.name AS station_name
      FROM dishes d
      JOIN courses c ON c.id = d.course_id
      JOIN stations s ON s.id = d.station_id
      ORDER BY d.sort_order
    `) as any[];

    return json({
      dishes: rows.map((d) => ({
        id: d.id, slug: d.slug, name: d.name, description: d.description,
        price: d.price_cents / 100, priceNote: d.price_note,
        course: d.course_id, courseName: d.course_name,
        station: d.station_id, stationName: d.station_name,
        isAvailable: d.is_available, isSignature: d.is_signature,
        pickupEligible: d.pickup_eligible, sortOrder: d.sort_order,
        image: d.media?.primary ?? null,
        updatedAt: new Date(d.updated_at).toISOString(),
      })),
    });
  }

  if (req.method === 'PATCH') {
    let body: unknown;
    try { body = await req.json(); } catch { return fail('Expected JSON', 400); }

    const parsed = patch.safeParse(body);
    if (!parsed.success) {
      return json({ error: { message: 'Invalid change', fields: fieldErrors(parsed.error) } }, 422);
    }
    const p = parsed.data;

    const [before] = (await sql`
      SELECT name, price_cents, is_available FROM dishes WHERE id = ${p.id}
    `) as any[];
    if (!before) return fail('No such dish', 404);

    const [row] = (await sql`
      UPDATE dishes SET
        name             = COALESCE(${p.name ?? null}, name),
        description      = COALESCE(${p.description ?? null}, description),
        long_description = COALESCE(${p.longDescription ?? null}, long_description),
        price_cents      = COALESCE(${p.price === undefined ? null : Math.round(p.price * 100)}, price_cents),
        price_note       = COALESCE(${p.priceNote ?? null}, price_note),
        is_available     = COALESCE(${p.isAvailable ?? null}, is_available),
        is_signature     = COALESCE(${p.isSignature ?? null}, is_signature),
        pickup_eligible  = COALESCE(${p.pickupEligible ?? null}, pickup_eligible),
        sort_order       = COALESCE(${p.sortOrder ?? null}, sort_order)
      WHERE id = ${p.id}
      RETURNING id, slug, name, price_cents, is_available, is_signature, sort_order
    `) as any[];

    await auditLog(auth, 'update', 'dish', p.id, {
      ...(p.name && p.name !== before.name ? { name: [before.name, p.name] } : {}),
      ...(p.price !== undefined ? { price: [before.price_cents / 100, p.price] } : {}),
      ...(p.isAvailable !== undefined ? { isAvailable: [before.is_available, p.isAvailable] } : {}),
    });

    return json({
      dish: {
        id: row.id, slug: row.slug, name: row.name, price: row.price_cents / 100,
        isAvailable: row.is_available, isSignature: row.is_signature, sortOrder: row.sort_order,
      },
    });
  }

  return fail('Method not allowed', 405);
}

export default withVercel(handler);
