import { createReservation as schema, referenceParam } from './_lib/schema.ts';
import { createReservation, findByReference } from './_lib/reservations.ts';
import { json, fail, rateLimit, clientIp, fieldErrors } from './_lib/http.ts';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const ip = clientIp(req);

  if (req.method === 'GET') {
    if (!rateLimit(ip, 60, 60_000)) return fail('Too many requests', 429);
    const ref = referenceParam.safeParse(new URL(req.url).searchParams.get('reference') ?? '');
    if (!ref.success) return fail('Not a valid reference', 400);
    try {
      const booking = await findByReference(ref.data);
      return booking ? json({ booking }) : fail('No reservation with that reference', 404);
    } catch (e) {
      console.error('lookup failed', e);
      return fail('Could not load the reservation', 500);
    }
  }

  if (req.method === 'POST') {
    // Bookings are far rarer than availability checks, so a tighter window.
    if (!rateLimit(ip, 8, 60_000)) return fail('Too many booking attempts. Try again shortly.', 429);

    let body: unknown;
    try { body = await req.json(); } catch { return fail('Expected JSON', 400); }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return json({ error: { message: 'Please check the form', fields: fieldErrors(parsed.error) } }, 422);
    }

    try {
      const result = await createReservation(parsed.data);
      if (!result.ok) {
        // 409: the request was well-formed but the world changed underneath it.
        return json({ error: { message: result.message, code: result.code } }, 409);
      }
      return json({ booking: result.booking }, 201);
    } catch (e) {
      console.error('create failed', e);
      return fail('Could not complete the booking', 500);
    }
  }

  return fail('Method not allowed', 405);
}
