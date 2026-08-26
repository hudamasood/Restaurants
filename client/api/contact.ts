import { createEnquiry as schema } from './_lib/schema.js';
import { createEnquiry } from './_lib/enquiries.js';
import { json, fail, rateLimit, clientIp, fieldErrors } from './_lib/http.js';
import { withVercel } from './_lib/vercel.js';

export const config = { runtime: 'nodejs' };

async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return fail('Method not allowed', 405);

  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000)) {
    return fail('Too many messages. Please try again shortly.', 429);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return fail('Expected JSON', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ error: { message: 'Please check the form', fields: fieldErrors(parsed.error) } }, 422);
  }

  try {
    const result = await createEnquiry(parsed.data, {
      ip,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
    // Deliberately identical whether or not the heuristics filtered it. A bot
    // that learns which of its messages were caught can iterate; a guest
    // wrongly filtered still has their message stored for staff to find.
    return json({ received: true, notified: result.notified }, 201);
  } catch (e) {
    console.error('enquiry failed', e);
    return fail('Could not send your message. Please call us instead.', 500);
  }
}

export default withVercel(handler);
