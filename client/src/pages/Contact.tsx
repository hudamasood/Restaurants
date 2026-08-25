import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { sendEnquiry } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { DUR, EASE } from '@/motion/constants';
import { BRAND } from '@/data/brand';
import { HOURS, todayHours } from '@/data/site';

const schema = z.object({
  name: z.string().min(2, 'Please enter a name'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'A little more detail, please'),
});

export default function Contact() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: params.get('subject') ?? 'General enquiry',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // Honeypot: hidden from people, so anything in it came from a bot.
  const [website, setWebsite] = useState('');
  // When this form rendered, used to catch submissions faster than a person
  // could plausibly type.
  const startedAt = useRef(Date.now());
  const today = todayHours();

  const enquiry = useMutation({
    mutationFn: sendEnquiry,
    onMutate: () => {
      setErrors({});
      setSendError(null);
    },
    onSuccess: (result) => {
      if (result.ok) {
        setSent(true);
        return;
      }
      if (result.kind === 'validation') {
        setErrors(result.fields);
        return;
      }
      setSendError(result.message);
    },
    onError: (e: Error) => setSendError(e.message || 'Could not send your message.'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    enquiry.mutate({ ...form, website, startedAt: startedAt.current });
  };

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
    `${BRAND.address.line1}, ${BRAND.address.city}`,
  )}&zoom=15&size=800x600&scale=2&maptype=roadmap`;

  return (
    <PageShell
      title="Contact"
      description={`${BRAND.address.line1}, ${BRAND.address.line2}, ${BRAND.address.city} ${BRAND.address.postcode}. Reservations, private dining and press enquiries.`}
    >
      <div className="u-shell" style={{ paddingTop: 'calc(var(--nav-h) + 6rem)' }}>
        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            Contact
          </p>
        </Reveal>
        <LineMask text="Find us, or write to us" as="h1" className="u-display mb-16" animateOnMount />
      </div>

      <div className="u-shell pb-28">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-16">
          {/* Details */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="mb-10">
                <p className="u-mono mb-4" style={{ color: 'var(--color-bone-faint)' }}>
                  Address
                </p>
                <address className="not-italic" style={{ color: 'var(--color-bone)', lineHeight: 1.9, fontSize: 'var(--t-lede)' }}>
                  {BRAND.address.line1}
                  <br />
                  {BRAND.address.line2}
                  <br />
                  {BRAND.address.city} {BRAND.address.postcode}
                </address>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="mb-10">
                <p className="u-mono mb-4" style={{ color: 'var(--color-bone-faint)' }}>
                  Direct
                </p>
                <div className="flex flex-col gap-2">
                  <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="link-rule w-fit" style={{ color: 'var(--color-bone)' }}>
                    {BRAND.phone}
                  </a>
                  <a href={`mailto:${BRAND.email}`} className="link-rule w-fit" style={{ color: 'var(--color-bone)' }}>
                    {BRAND.email}
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="mb-10">
                <p className="u-mono mb-4" style={{ color: 'var(--color-bone-faint)' }}>
                  Hours
                </p>
                <ul className="flex flex-col gap-2">
                  {HOURS.map((h) => (
                    <li
                      key={h.day}
                      className="u-num flex justify-between gap-6 border-b pb-2"
                      style={{
                        borderColor: 'var(--color-smoke)',
                        color: h.short === today.short ? 'var(--color-bone)' : 'var(--color-bone-dim)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <span>{h.day}</span>
                      <span>{h.open ? `${h.open} — ${h.close}` : 'Closed'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div>
                <p className="u-mono mb-4" style={{ color: 'var(--color-bone-faint)' }}>
                  Getting here
                </p>
                <p style={{ color: 'var(--color-bone-dim)', lineHeight: 1.8 }}>
                  Six minutes from Goodge Street, eight from Tottenham Court Road. Two accessible
                  parking bays on Wharfside Street, and step-free access from the main entrance.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Map + form */}
          <div className="lg:col-span-7">
            <CurtainMask className="mb-12">
              <div
                className="relative w-full"
                style={{ aspectRatio: '16/9', background: 'var(--color-ash-2)' }}
              >
                <img
                  src={mapUrl}
                  alt={`Map showing ${BRAND.name} on ${BRAND.address.line1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={{ filter: 'grayscale(1) invert(0.9) contrast(0.86) brightness(0.82)' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{ border: '1px solid var(--color-smoke)' }}
                >
                  <span
                    className="u-mono px-4 py-2"
                    style={{ background: 'var(--color-ink)', color: 'var(--color-bone)' }}
                  >
                    {BRAND.address.line1}
                  </span>
                </div>
              </div>
            </CurtainMask>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.base, ease: EASE.house }}
                  className="border p-8"
                  style={{ borderColor: 'var(--color-saffron)' }}
                >
                  <p className="u-mono mb-3" style={{ color: 'var(--color-saffron)' }}>
                    Sent
                  </p>
                  <h2 className="u-display mb-3" style={{ fontSize: 'var(--t-dish-lg)' }}>
                    Thank you
                  </h2>
                  <p style={{ color: 'var(--color-bone-dim)' }}>
                    We reply to enquiries within one working day. For anything time-critical, call{' '}
                    {BRAND.phone}.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={submit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DUR.micro }}
                  className="grid gap-7 sm:grid-cols-2"
                >
                  <div className="field" data-invalid={Boolean(errors.name)}>
                    <label className="field__label" htmlFor="c-name">
                      Name
                    </label>
                    <input
                      id="c-name"
                      className="field__control"
                      value={form.name}
                      autoComplete="name"
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    {errors.name && <p className="field__error">{errors.name}</p>}
                  </div>

                  <div className="field" data-invalid={Boolean(errors.email)}>
                    <label className="field__label" htmlFor="c-email">
                      Email
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      className="field__control"
                      value={form.email}
                      autoComplete="email"
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    {errors.email && <p className="field__error">{errors.email}</p>}
                  </div>

                  <div className="field sm:col-span-2">
                    <label className="field__label" htmlFor="c-subject">
                      Subject
                    </label>
                    <select
                      id="c-subject"
                      className="field__control"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    >
                      {[
                        'General enquiry',
                        'The Main Room',
                        "The Chef's Table",
                        'Private Dining',
                        'The Terrace',
                        'Events',
                        'Press',
                        'Allergens',
                      ].map((s) => (
                        <option key={s} value={s} style={{ background: 'var(--color-ash)' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field sm:col-span-2" data-invalid={Boolean(errors.message)}>
                    <label className="field__label" htmlFor="c-message">
                      Message
                    </label>
                    <textarea
                      id="c-message"
                      className="field__control"
                      style={{ minHeight: '9rem' }}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                    {errors.message && <p className="field__error">{errors.message}</p>}
                  </div>

                  {/* Honeypot. Hidden from people and from assistive tech, so
                      anything that arrives in it came from a bot. Not
                      display:none — some bots skip those. */}
                  <div aria-hidden="true" className="u-vh">
                    <label htmlFor="c-website">Leave this field empty</label>
                    <input
                      id="c-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  {sendError && (
                    <div className="sm:col-span-2">
                      <p
                        role="alert"
                        className="border-l pl-5"
                        style={{
                          borderColor: 'var(--color-stop)',
                          color: 'var(--color-bone)',
                          paddingTop: '0.35rem',
                          paddingBottom: '0.35rem',
                        }}
                      >
                        {sendError}
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <button type="submit" disabled={enquiry.isPending} className="btn btn--filled">
                      <span>{enquiry.isPending ? 'Sending…' : 'Send enquiry'}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
