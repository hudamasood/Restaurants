import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { LineMask } from '@/components/motion/LineMask';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { Reveal } from '@/components/motion/Reveal';
import { BRAND } from '@/data/brand';
import { formatDate } from '@/lib/format';
import { getReservation } from '@/lib/api';

export default function ReserveConfirm() {
  const { reference } = useParams<{ reference: string }>();

  // Fetched by reference rather than read from this browser's session, so the
  // link works when it is bookmarked, shared, or opened on another device.
  const query = useQuery({
    queryKey: ['reservation', reference],
    enabled: Boolean(reference),
    queryFn: async () => {
      const r = await getReservation(reference!);
      if (!r.ok) throw new Error(r.message);
      return r.data.booking;
    },
    retry: 1,
  });
  const booking = query.data ?? null;

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

  const roomName = booking?.seatingAreaName ?? '—';

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
        <div className="enter-rise mb-14" style={{ animationDelay: '300ms' }}>
          <p className="u-mono mb-3" style={{ color: 'var(--color-bone-faint)' }}>
            Reference
          </p>
          <p
            className="u-num"
            style={{ color: 'var(--color-bone)', fontSize: 'clamp(1.75rem, 5vw, 3rem)', letterSpacing: '0.12em' }}
          >
            {reference}
          </p>
        </div>

        {booking ? (
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <dl className="flex flex-col">
                {[
                  { label: 'Date', value: booking.date ? formatDate(booking.date) : '—' },
                  { label: 'Time', value: booking.time ?? '—' },
                  { label: 'Guests', value: String(booking.partySize ?? '—') },
                  { label: 'Room', value: roomName },
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
                  <div
                    key={row.label}
                    className="enter-rise flex flex-wrap items-baseline justify-between gap-4 border-t py-4"
                    style={{
                      borderColor: 'var(--color-smoke)',
                      animationDelay: `${400 + i * 60}ms`,
                    }}
                  >
                    <dt className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
                      {row.label}
                    </dt>
                    <dd style={{ color: 'var(--color-bone)', textAlign: 'right', maxWidth: '40ch' }}>
                      {row.value}
                    </dd>
                  </div>
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
        ) : query.isLoading ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, maxWidth: 520 }} />
            ))}
          </div>
        ) : (
          <div>
            <p className="mb-8" style={{ color: 'var(--color-bone-dim)', maxWidth: '46ch' }}>
              We could not find a reservation with that reference. Check the code from your
              confirmation email, or call us and we will look it up.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="btn btn--outline">
                <span>{BRAND.phone}</span>
              </a>
              <Link to="/reserve" className="btn btn--ghost">
                <span>Make a new reservation</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
