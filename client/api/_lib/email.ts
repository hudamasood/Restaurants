import type { Booking } from './reservations';

/**
 * Transactional email.
 *
 * Two deliberate properties:
 *
 * 1. Sending never throws to the caller. A reservation is already committed
 *    by the time we get here, so a mail outage must not turn a successful
 *    booking into a failed request. Failures are logged and reported, and the
 *    guest still gets their reference on screen.
 * 2. With no API key configured the send is skipped rather than faked, and
 *    says so. Local development and preview deploys should not silently
 *    pretend to have emailed someone.
 */

const FROM = process.env.EMAIL_FROM ?? 'Marrow & Hearth <reservations@marrowandhearth.com>';
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'reservations@marrowandhearth.com';

export type SendResult =
  | { sent: true; id: string }
  | { sent: false; reason: 'not_configured' | 'failed'; detail?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Overrides the default reply-to, so staff can answer the sender directly. */
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'not_configured' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        reply_to: opts.replyTo ?? REPLY_TO,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { sent: false, reason: 'failed', detail: `${res.status} ${detail.slice(0, 200)}` };
    }
    const body = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: body.id ?? 'unknown' };
  } catch (e) {
    return { sent: false, reason: 'failed', detail: (e as Error).message };
  }
}

const ADDRESS = '114 Wharfside Street, Fitzrovia, London W1T 4QP';
const PHONE = '+44 20 7946 0114';

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Confirmation email. Built as a table on a dark ground to survive the mail
 * clients that ignore modern CSS, and deliberately restrained: the reference
 * code is the one thing the guest needs to find again at a glance.
 */
export function confirmationEmail(b: Booking): { subject: string; html: string; text: string } {
  const when = `${longDate(b.date)} at ${b.time}`;
  const guests = `${b.partySize} ${b.partySize === 1 ? 'guest' : 'guests'}`;

  const rows: [string, string][] = [
    ['Reference', b.reference],
    ['Date', longDate(b.date)],
    ['Time', b.time],
    ['Guests', String(b.partySize)],
    ['Room', b.seatingAreaName],
  ];
  if (b.occasion) rows.push(['Occasion', b.occasion]);
  if (b.dietaryNotes) rows.push(['Dietary notes', b.dietaryNotes]);
  if (b.accessibilityNotes) rows.push(['Accessibility', b.accessibilityNotes]);

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Your table at Marrow &amp; Hearth</title></head>
<body style="margin:0;padding:0;background:#0B0B0C;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0C;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141416;border:1px solid #2C2C31;">
      <tr><td style="padding:36px 36px 28px;border-bottom:1px solid #2C2C31;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;letter-spacing:4px;text-transform:uppercase;color:#E9E3D7;">Marrow &amp; Hearth</div>
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#948E83;padding-top:10px;">Your table is confirmed</div>
      </td></tr>
      <tr><td style="padding:32px 36px 8px;">
        <div style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#E9E3D7;">${esc(b.name.split(' ')[0])}, we have you for ${esc(guests)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#948E83;padding-top:14px;">${esc(when)}. Please keep the reference below — you will need it to change or cancel.</div>
      </td></tr>
      <tr><td style="padding:24px 36px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows.map(([k, v]) => `<tr>
            <td style="padding:11px 0;border-top:1px solid #2C2C31;font-family:'Courier New',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#635E56;width:40%;">${esc(k)}</td>
            <td style="padding:11px 0;border-top:1px solid #2C2C31;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:${k === 'Reference' ? '#D99A2B' : '#E9E3D7'};${k === 'Reference' ? "font-family:'Courier New',monospace;letter-spacing:2px;" : ''}">${esc(v)}</td>
          </tr>`).join('')}
        </table>
      </td></tr>
      <tr><td style="padding:24px 36px 32px;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#948E83;">
          We hold the table for fifteen minutes past the booking time.<br>
          The souffl&eacute; takes twenty-two minutes and is ordered at the start of the meal.<br>
          To change or cancel, call <span style="color:#E9E3D7;">${PHONE}</span> with your reference.
        </div>
      </td></tr>
      <tr><td style="padding:22px 36px 30px;border-top:1px solid #2C2C31;">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#635E56;">Find us</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#948E83;padding-top:8px;">${ADDRESS}<br>${PHONE}</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = [
    'MARROW & HEARTH',
    'Your table is confirmed.',
    '',
    `${b.name.split(' ')[0]}, we have you for ${guests} on ${when}.`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'We hold the table for fifteen minutes past the booking time.',
    'The soufflé takes twenty-two minutes and is ordered at the start of the meal.',
    `To change or cancel, call ${PHONE} with your reference.`,
    '',
    ADDRESS,
    PHONE,
  ].join('\n');

  return { subject: `Your table at Marrow & Hearth — ${longDate(b.date)}, ${b.time}`, html, text };
}
