import { sql } from './db.js';

/**
 * Layered spam checks, cheapest first, none of which ask anything of a real
 * guest. No CAPTCHA: this form is on the contact page of a restaurant, and
 * making a person solve a puzzle to ask about a wheelchair ramp is a worse
 * trade than occasionally filing a junk enquiry.
 */

export interface SpamVerdict {
  spam: boolean;
  reason?: string;
}

/** Links are the single strongest signal on a restaurant contact form. */
const LINK = /(https?:\/\/|www\.)/i;
const BAIT = /\b(seo|backlink|crypto|casino|viagra|forex|loan offer|guest post|link building|rank higher)\b/i;

export async function checkSpam(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Hidden field a person never sees, and so never fills in. */
  honeypot?: string;
  /** Milliseconds between the form rendering and being submitted. */
  elapsedMs?: number;
}): Promise<SpamVerdict> {
  if (input.honeypot && input.honeypot.trim() !== '') {
    return { spam: true, reason: 'honeypot filled' };
  }

  // A human cannot read the page, type a name, an email and ten words of
  // message in under three seconds.
  if (typeof input.elapsedMs === 'number' && input.elapsedMs >= 0 && input.elapsedMs < 3000) {
    return { spam: true, reason: `submitted in ${input.elapsedMs}ms` };
  }

  const body = `${input.subject}\n${input.message}`;
  const links = (body.match(/(https?:\/\/|www\.)/gi) ?? []).length;
  if (links >= 2) return { spam: true, reason: `${links} links` };
  if (LINK.test(input.name)) return { spam: true, reason: 'link in name' };
  if (BAIT.test(body)) return { spam: true, reason: 'solicitation keywords' };

  // Same sender flooding the form.
  const [recent] = (await sql`
    SELECT COUNT(*)::int AS n FROM enquiries
    WHERE lower(email) = lower(${input.email})
      AND created_at > now() - interval '1 hour'
  `) as { n: number }[];
  if (recent.n >= 3) return { spam: true, reason: 'more than three in an hour' };

  // The identical message sent twice.
  const [dupe] = (await sql`
    SELECT COUNT(*)::int AS n FROM enquiries
    WHERE lower(email) = lower(${input.email})
      AND message = ${input.message}
      AND created_at > now() - interval '24 hours'
  `) as { n: number }[];
  if (dupe.n > 0) return { spam: true, reason: 'duplicate of a recent message' };

  return { spam: false };
}
