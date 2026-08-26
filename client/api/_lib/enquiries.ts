import { sql } from './db.js';
import { checkSpam } from './spam.js';
import { sendEmail } from './email.js';
import type { CreateEnquiry } from './schema.js';

const TO = process.env.ENQUIRY_INBOX ?? process.env.EMAIL_REPLY_TO ?? 'reservations@marrowandhearth.com';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface EnquiryResult {
  id: string;
  /** Spam is accepted and quietly filed rather than refused — see below. */
  filtered: boolean;
  notified: boolean;
}

export async function createEnquiry(
  input: CreateEnquiry,
  meta: { ip?: string; userAgent?: string },
): Promise<EnquiryResult> {
  const elapsedMs = input.startedAt ? Date.now() - input.startedAt : undefined;
  const verdict = await checkSpam({ ...input, honeypot: input.website, elapsedMs });

  const [row] = (await sql`
    INSERT INTO enquiries (name, email, subject, message, status, ip, user_agent, spam_reason)
    VALUES (
      ${input.name}, ${input.email}, ${input.subject}, ${input.message},
      ${verdict.spam ? 'spam' : 'new'}::enquiry_status,
      ${meta.ip ?? null}, ${meta.userAgent ?? null}, ${verdict.reason ?? null}
    )
    RETURNING id
  `) as { id: string }[];

  // Spam is stored but not emailed, and the caller still gets a success. A
  // bot learns nothing from being told it was caught, and a false positive
  // is recoverable because the message is in the table rather than discarded.
  if (verdict.spam) return { id: String(row.id), filtered: true, notified: false };

  const sent = await sendEmail({
    to: TO,
    // So hitting reply in the inbox answers the guest, not ourselves.
    replyTo: input.email,
    subject: `[Enquiry] ${input.subject} — ${input.name}`,
    text: [
      `From:    ${input.name} <${input.email}>`,
      `Subject: ${input.subject}`,
      '',
      input.message,
      '',
      `Reply directly to this email to answer ${input.name}.`,
    ].join('\n'),
    html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
      <p style="margin:0 0 4px"><strong>${esc(input.name)}</strong> &lt;${esc(input.email)}&gt;</p>
      <p style="margin:0 0 18px;color:#666">${esc(input.subject)}</p>
      <div style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:14px">${esc(input.message)}</div>
      <p style="margin:20px 0 0;color:#888;font-size:13px">Reply directly to this email to answer ${esc(input.name)}.</p>
    </div>`,
  });

  if (!sent.sent && sent.reason === 'failed') {
    console.error('enquiry notification failed', row.id, sent.detail);
  }

  return { id: String(row.id), filtered: false, notified: sent.sent };
}
