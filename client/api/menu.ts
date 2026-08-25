import { getMenu } from './_lib/menu';
import { json, fail, rateLimit, clientIp } from './_lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return fail('Method not allowed', 405);
  if (!rateLimit(`menu:${clientIp(req)}`, 120, 60_000)) return fail('Too many requests', 429);

  try {
    const menu = await getMenu();
    // The menu changes rarely, but availability lives on the same payload and
    // a sold-out dish showing as available is a service problem — so this is
    // short and revalidated rather than cached hard.
    return json(menu, 200, {
      'cache-control': 'public, max-age=30, stale-while-revalidate=300',
    });
  } catch (e) {
    console.error('menu failed', e);
    return fail('Could not load the menu', 500);
  }
}
