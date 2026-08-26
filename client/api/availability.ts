import { availabilityQuery } from './_lib/schema.js';
import { getAvailability } from './_lib/availability.js';
import { json, fail, rateLimit, clientIp, fieldErrors } from './_lib/http.js';
import { withVercel } from './_lib/vercel.js';

export const config = { runtime: 'nodejs' };

async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return fail('Method not allowed', 405);
  if (!rateLimit(clientIp(req), 60, 60_000)) return fail('Too many requests', 429);

  const url = new URL(req.url);
  const parsed = availabilityQuery.safeParse({
    date: url.searchParams.get('date'),
    party: url.searchParams.get('party'),
  });
  if (!parsed.success) return json({ error: { message: 'Invalid request', fields: fieldErrors(parsed.error) } }, 400);

  try {
    const result = await getAvailability(parsed.data.date, parsed.data.party);
    // Availability moves constantly; let the browser hold it only briefly.
    return json(result, 200, { 'cache-control': 'private, max-age=15' });
  } catch (e) {
    console.error('availability failed', e);
    return fail('Could not load availability', 500);
  }
}

export default withVercel(handler);
