import { createReservation as schema, referenceParam } from './_lib/schema.js';
import { createReservation, findByReference } from './_lib/reservations.js';
import { json, fail, rateLimit, clientIp, fieldErrors } from './_lib/http.js';
import { sendEmail, confirmationEmail } from './_lib/email.js';

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
      // The reservation is committed. Email is best-effort from here: a mail
      // outage must not turn a successful booking into a failed request, so
      // the result is reported alongside the booking rather than thrown.
      const mail = confirmationEmail(result.booking);
      const sent = await sendEmail({
        to: result.booking.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      if (!sent.sent && sent.reason === 'failed') {
        console.error('confirmation email failed', result.booking.reference, sent.detail);
      }

      return json({ booking: result.booking, emailed: sent.sent }, 201);
    } catch (e) {
      console.error('create failed', e);
      return fail('Could not complete the booking', 500);
    }
  }

  return fail('Method not allowed', 405);
}
