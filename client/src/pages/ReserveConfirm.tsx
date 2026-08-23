import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { PageShell } from '@/components/layout/PageShell';
import { LineMask } from '@/components/motion/LineMask';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { Reveal } from '@/components/motion/Reveal';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { BRAND } from '@/data/brand';
import { SEATING_AREAS } from '@/data/site';
import { formatDate } from '@/lib/format';
import type { Reservation } from '@/types';

export default function ReserveConfirm() {
  const { reference } = useParams<{ reference: string }>();
  const canAnimate = useCanAnimate();
  const [booking, setBooking] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!reference) return;
    const raw = sessionStorage.getItem(`mh:reservation:${reference}`);
    if (raw) {
      try {
        setBooking(JSON.parse(raw));
      } catch {
        setBooking(null);
      }
    }
  }, [reference]);

  const ics = useMemo(() => {
    if (!booking?.date || !booking.time) return null;
    const start = `${booking.date.replace(/-/g, '')}T${booking.time.replace(':', '')}00`;
    const body = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//${BRAND.name}//Reservations//EN`,
      'BEGIN:VEVENT',
      `UID:${booking.reference}@marrowandhearth.com`,
      `DTSTART:${start}`,
      `SUMMARY:${BRAND.name} — table for ${booking.partySize}`,
      `LOCATION:${BRAND.address.line1}\\, ${BRAND.address.city} ${BRAND.address.postcode}`,
      `DESCRIPTION:Reference ${booking.reference}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
  }, [booking]);

  const room = SEATING_AREAS.find((s) => s.id === booking?.seatingArea);

  return (
    <PageShell
      title="Reservation Confirmed"
      description="Your table is confirmed. Keep the reference code."
    >
      <div className="u-shell" style={{ paddingTop: 'calc(var(--nav-h) + 6rem)', paddingBottom: '7rem' }}>
        <CurtainMask from="top" className="mb-12">
          <div style={{ height: 1, background: 'var(--color-saffron)' }} />
        </CurtainMask>

        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            Confirmed
          </p>
        </Reveal>

        <LineMask
          text={booking ? `Thank you, ${booking.name.split(' ')[0]}` : 'Your table is confirmed'}
          as="h1"
          className="u-display mb-8"
          animateOnMount
        />

        {/* Reference code line-masks in, mono, +300ms */}
        <motion.div
          className="mb-14"
          initial={{ opacity: 0, y: canAnimate ? 12 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: DUR.base,
            delay: 0.3,
            ease: EASE.house,
          }}
        >
          <p className="u-mono mb-3" style={{ color: 'var(--color-bone-faint)' }}>
            Reference
          </p>
          <p
            className="u-num"
            style={{ color: 'var(--color-bone)', fontSize: 'clamp(1.75rem, 5vw, 3rem)', letterSpacing: '0.12em' }}
          >
            {reference}
          </p>
        </motion.div>

        {booking ? (
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <dl className="flex flex-col">
                {[
                  { label: 'Date', value: booking.date ? formatDate(booking.date) : '—' },
                  { label: 'Time', value: booking.time ?? '—' },
                  { label: 'Guests', value: String(booking.partySize ?? '—') },
                  { label: 'Room', value: room?.name ?? '—' },
                  { label: 'Name', value: booking.name },
                  { label: 'Email', value: booking.email },
                  ...(booking.occasion ? [{ label: 'Occasion', value: booking.occasion }] : []),
                  ...(booking.dietaryNotes
                    ? [{ label: 'Dietary', value: booking.dietaryNotes }]
                    : []),
                  ...(booking.accessibilityNotes
                    ? [{ label: 'Access', value: booking.accessibilityNotes }]
                    : []),
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, y: canAnimate ? 10 : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: DUR.base,
                      delay: 0.4 + i * 0.06,
                      ease: EASE.house,
                    }}
                    className="flex flex-wrap items-baseline justify-between gap-4 border-t py-4"
                    style={{ borderColor: 'var(--color-smoke)' }}
                  >
                    <dt className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
                      {row.label}
                    </dt>
                    <dd style={{ color: 'var(--color-bone)', textAlign: 'right', maxWidth: '40ch' }}>
                      {row.value}
                    </dd>
                  </motion.div>
                ))}
              </dl>

              <div className="mt-10 flex flex-wrap gap-3">
                {ics && (
                  <a href={ics} download={`${reference}.ics`} className="btn btn--outline">
                    <span>Add to calendar</span>
                  </a>
                )}
                <Link to="/menu" className="btn btn--ghost">
                  <span>Browse the menu</span>
                </Link>
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="border p-7 lg:p-8" style={{ borderColor: 'var(--color-smoke)' }}>
                <p className="u-mono mb-5" style={{ color: 'var(--color-bone-faint)' }}>
                  Before you arrive
                </p>
                <ul className="flex flex-col gap-4" style={{ color: 'var(--color-bone-dim)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                  <li>The table is held for fifteen minutes past the booking time.</li>
                  <li>
                    The soufflé takes twenty-two minutes and is ordered at the start of the meal, not
                    the end.
                  </li>
                  <li>
                    To change or cancel, call{' '}
                    <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="link-rule" style={{ color: 'var(--color-bone)' }}>
                      {BRAND.phone}
                    </a>{' '}
                    with your reference.
                  </li>
                </ul>

                <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--color-smoke)' }}>
                  <p className="u-mono mb-2" style={{ color: 'var(--color-bone-faint)' }}>
                    Find us
                  </p>
                  <address className="not-italic" style={{ color: 'var(--color-bone-dim)', lineHeight: 1.8 }}>
                    {BRAND.address.line1}
                    <br />
                    {BRAND.address.line2}
                    <br />
                    {BRAND.address.city} {BRAND.address.postcode}
                  </address>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div>
            <p className="mb-8" style={{ color: 'var(--color-bone-dim)', maxWidth: '46ch' }}>
              We could not find the details for this reference in this browser session. The
              confirmation email holds the full booking — or call us with the code above.
            </p>
            <Link to="/reserve" className="btn btn--outline">
              <span>Make a new reservation</span>
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
}
