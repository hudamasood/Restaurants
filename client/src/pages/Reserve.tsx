import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getAvailability, createReservation, type BookingInput } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { Picture } from '@/components/media/Picture';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { SEATING_AREAS } from '@/data/site';
import { addDays, formatDate, toISO } from '@/lib/format';
import type { ReservationDraft } from '@/types';
import { PAGE_META } from '@/data/pageMeta';

const STEPS = ['Date', 'Time', 'Guests', 'Seating', 'Details'] as const;

const DRAFT_KEY = 'mh:reservation-draft';

const detailsSchema = z.object({
  name: z.string().min(2, 'Please enter a name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(7, 'Please enter a contact number'),
});

export default function Reserve() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const canAnimate = useCanAnimate();

  const step = Math.min(5, Math.max(1, Number(params.get('step') ?? '1')));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>();

  const [draft, setDraft] = useState<ReservationDraft>(() => {
    const stored = sessionStorage.getItem(DRAFT_KEY);
    const base: ReservationDraft = {
      date: params.get('date'),
      time: null,
      partySize: params.get('party') ? Number(params.get('party')) : null,
      seatingArea: null,
      name: '',
      email: '',
      phone: '',
      occasion: '',
      dietaryNotes: '',
      accessibilityNotes: '',
    };
    if (stored) {
      try {
        return { ...base, ...JSON.parse(stored) };
      } catch {
        return base;
      }
    }
    return base;
  });

  const update = (patch: Partial<ReservationDraft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > step ? 1 : -1);
      const p = new URLSearchParams(params);
      p.set('step', String(next));
      setParams(p);
    },
    [params, setParams, step],
  );

  // Container height animates to the new step, so nothing jumps.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.scrollHeight));
    ro.observe(el);
    setHeight(el.scrollHeight);
    return () => ro.disconnect();
  }, [step]);

  // Real availability, from the kitchen's actual bookings.
  const party = draft.partySize ?? 2;
  const availability = useQuery({
    queryKey: ['availability', draft.date, party],
    enabled: Boolean(draft.date),
    queryFn: async () => {
      const r = await getAvailability(draft.date!, party);
      if (!r.ok) throw new Error(r.message);
      return r.data;
    },
    // A slot someone else just took should not linger in the grid.
    staleTime: 15_000,
    retry: 1,
  });
  const slots = availability.data?.slots ?? [];

  const booking = useMutation({
    mutationFn: (input: BookingInput) => createReservation(input),
    onMutate: () => {
      setErrors({});
      setSubmitError(null);
    },
    onSuccess: (result) => {
      if (result.ok) {
        sessionStorage.removeItem(DRAFT_KEY);
        navigate(`/reserve/${result.data.booking.reference}`);
        return;
      }

      if (result.kind === 'validation') {
        setErrors(result.fields);
        return;
      }

      if (result.kind === 'conflict') {
        // The slot filled between choosing it and confirming. Send the guest
        // back to the time step with fresh availability rather than leaving
        // them on a dead form.
        setSubmitError(result.message);
        if (result.code === 'slot_taken') {
          update({ time: null });
          availability.refetch();
          goTo(2);
        }
        return;
      }

      // The draft deliberately stays in sessionStorage, so a failure here
      // costs the guest nothing they typed.
      setSubmitError(result.message);
    },
    onError: (e: Error) => setSubmitError(e.message || 'Could not complete the booking.'),
  });

  const submit = () => {
    const parsed = detailsSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    booking.mutate({
      date: draft.date!,
      time: draft.time!,
      partySize: draft.partySize!,
      seatingArea: draft.seatingArea!,
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      occasion: draft.occasion,
      dietaryNotes: draft.dietaryNotes,
      accessibilityNotes: draft.accessibilityNotes,
    });
  };

  const canAdvance = [
    Boolean(draft.date),
    Boolean(draft.time),
    Boolean(draft.partySize),
    Boolean(draft.seatingArea),
    true,
  ][step - 1];


  return (
    <PageShell {...PAGE_META['/reserve']}>
      <div className="u-shell" style={{ paddingTop: 'calc(var(--nav-h) + 4rem)' }}>
        <Reveal y={0}>
          <p className="u-mono mb-6" style={{ color: 'var(--color-saffron)' }}>
            Reservations
          </p>
        </Reveal>
        <LineMask text="A table by the fire" as="h1" className="u-display mb-12" animateOnMount />

        {/* Progress */}
        <ol className="mb-14 flex flex-wrap gap-x-6 gap-y-2">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={n > step}
                  onClick={() => goTo(n)}
                  className="u-mono flex items-center gap-2"
                  style={{
                    color: current
                      ? 'var(--color-bone)'
                      : done
                        ? 'var(--color-bone-dim)'
                        : 'var(--color-bone-ghost)',
                    cursor: n > step ? 'default' : 'pointer',
                    transition: `color ${DUR.short}s var(--ease-house)`,
                  }}
                >
                  <span className="u-num">{String(n).padStart(2, '0')}</span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="u-shell pb-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <motion.div
              animate={{ height }}
              transition={{ duration: DUR.short, ease: EASE.house }}
              style={{ overflow: 'hidden' }}
            >
              <div ref={containerRef}>
                {/* Keyed so each step remounts and replays its entrance. A CSS
                    keyframe rather than an inline-style transition: an
                    interrupted one used to leave the whole step at opacity 0,
                    which read as "no times available" while the grid sat
                    fully populated underneath. */}
                <div
                  key={step}
                  className={
                    canAnimate ? (direction === 1 ? 'step-in-forward' : 'step-in-back') : undefined
                  }
                >
                    {step === 1 && <StepDate draft={draft} update={update} />}
                    {step === 2 && (
                      <StepTime
                        slots={slots}
                        draft={draft}
                        update={update}
                        loading={availability.isLoading}
                        failed={availability.isError}
                        closedReason={availability.data && !availability.data.open ? availability.data.reason : undefined}
                        onRetry={() => availability.refetch()}
                      />
                    )}
                    {step === 3 && <StepGuests draft={draft} update={update} />}
                    {step === 4 && <StepSeating draft={draft} update={update} />}
                    {step === 5 && (
                      <StepDetails draft={draft} update={update} errors={errors} />
                    )}
                </div>
              </div>
            </motion.div>

            {submitError && (
              <p
                role="alert"
                className="mt-10 border-l pl-5"
                style={{
                  borderColor: 'var(--color-stop)',
                  color: 'var(--color-bone)',
                  paddingTop: '0.35rem',
                  paddingBottom: '0.35rem',
                }}
              >
                {submitError}
              </p>
            )}

            <div className="mt-12 flex gap-3">
              {step > 1 && (
                <button type="button" onClick={() => goTo(step - 1)} className="btn btn--outline">
                  <span>Back</span>
                </button>
              )}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => goTo(step + 1)}
                  disabled={!canAdvance}
                  className="btn btn--filled"
                >
                  <span>Continue</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={booking.isPending}
                  className="btn btn--filled"
                >
                  <span>{booking.isPending ? 'Confirming…' : 'Confirm reservation'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Persistent summary rail */}
          <aside className="lg:col-span-5">
            <div
              className="border p-7 lg:sticky lg:p-8"
              style={{ borderColor: 'var(--color-smoke)', top: 'calc(var(--nav-h) + 2rem)' }}
            >
              <p className="u-mono mb-7" style={{ color: 'var(--color-bone-faint)' }}>
                Your table
              </p>

              <dl className="flex flex-col">
                {[
                  { label: 'Date', value: draft.date ? formatDate(draft.date) : null, step: 1 },
                  { label: 'Time', value: draft.time, step: 2 },
                  {
                    label: 'Guests',
                    value: draft.partySize ? `${draft.partySize} ${draft.partySize === 1 ? 'guest' : 'guests'}` : null,
                    step: 3,
                  },
                  {
                    label: 'Room',
                    value: SEATING_AREAS.find((s) => s.id === draft.seatingArea)?.name ?? null,
                    step: 4,
                  },
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, y: canAnimate ? 8 : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: DUR.base,
                      delay: i * 0.06,
                      ease: EASE.house,
                    }}
                    className="flex items-baseline justify-between gap-4 border-t py-4"
                    style={{ borderColor: 'var(--color-smoke)' }}
                  >
                    <dt className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
                      {row.label}
                    </dt>
                    <dd className="flex items-center gap-3">
                      <span style={{ color: row.value ? 'var(--color-bone)' : 'var(--color-bone-ghost)' }}>
                        {row.value ?? '—'}
                      </span>
                      {row.value && row.step < step && (
                        <button
                          type="button"
                          onClick={() => goTo(row.step)}
                          className="u-mono"
                          style={{ color: 'var(--color-bone-faint)' }}
                        >
                          Edit
                        </button>
                      )}
                    </dd>
                  </motion.div>
                ))}
              </dl>

              <p
                className="u-mono mt-7 pt-6"
                style={{
                  color: 'var(--color-bone-faint)',
                  lineHeight: 1.9,
                  borderTop: '1px solid var(--color-smoke)',
                }}
              >
                Held for 15 minutes past the booking time
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

/* ── Steps ────────────────────────────────────────────────────────────── */

function StepDate({
  draft,
  update,
}: {
  draft: ReservationDraft;
  update: (p: Partial<ReservationDraft>) => void;
}) {
  const today = new Date();
  const canAnimate = useCanAnimate();
  const days = Array.from({ length: 90 }, (_, i) => addDays(today, i));

  return (
    <div>
      <h2 className="u-display mb-3" style={{ fontSize: 'var(--t-dish-lg)' }}>
        Choose a date
      </h2>
      <p className="mb-9" style={{ color: 'var(--color-bone-dim)' }}>
        Ninety days ahead. We are closed on Mondays.
      </p>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-7">
        {days.map((d, i) => {
          const iso = toISO(d);
          const closed = d.getDay() === 1;
          const selected = draft.date === iso;

          return (
            <button
              key={iso}
              type="button"
              disabled={closed}
              onClick={() => update({ date: iso })}
              title={closed ? 'Closed on Mondays' : undefined}
              aria-label={`${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}${closed ? ' — closed' : ''}`}
              // A CSS keyframe with no forwards fill: the resting style is the
              // visible one, so an interrupted entrance cannot strand a date
              // at partial opacity and make the calendar look unusable.
              className={canAnimate ? 'enter-rise relative flex flex-col items-center gap-1 py-3' : 'relative flex flex-col items-center gap-1 py-3'}
              style={{
                border: `1px solid ${selected ? 'var(--color-saffron)' : 'var(--color-smoke)'}`,
                background: selected ? 'var(--color-ash-3)' : 'transparent',
                cursor: closed ? 'not-allowed' : 'pointer',
                animationDelay: canAnimate ? `${Math.min(Math.floor(i / 7), 8) * 20}ms` : undefined,
                transition: `border-color ${DUR.short}s var(--ease-house), background-color ${DUR.short}s var(--ease-house)`,
              }}
            >
              <span
                className="u-mono"
                style={{ color: 'var(--color-bone-faint)', fontSize: '0.5625rem', opacity: closed ? 0.45 : 1 }}
              >
                {d.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span
                className="u-num"
                style={{ color: 'var(--color-bone)', fontSize: '0.875rem', opacity: closed ? 0.45 : 1 }}
              >
                {d.getDate()}
              </span>
              {closed && (
                // Struck through rather than merely dimmed, so a closed day
                // reads as closed at a glance instead of as low contrast.
                <span
                  aria-hidden="true"
                  className="absolute left-2 right-2 top-1/2"
                  style={{ height: 1, background: 'var(--color-bone-dim)', opacity: 0.7 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepTime({
  slots,
  draft,
  update,
  loading,
  failed,
  closedReason,
  onRetry,
}: {
  slots: { time: string; available: boolean }[];
  draft: ReservationDraft;
  update: (p: Partial<ReservationDraft>) => void;
  loading: boolean;
  failed: boolean;
  closedReason?: string;
  onRetry: () => void;
}) {
  const canAnimate = useCanAnimate();

  return (
    <div>
      <h2 className="u-display mb-3" style={{ fontSize: 'var(--t-dish-lg)' }}>
        Choose a time
      </h2>
      <p className="mb-9" style={{ color: 'var(--color-bone-dim)' }}>
        {draft.date ? formatDate(draft.date) : 'Pick a date first.'}
      </p>

      {loading ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5" aria-busy="true">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 46 }} />
          ))}
        </div>
      ) : failed ? (
        <div>
          <p className="mb-5" style={{ color: 'var(--color-bone-dim)' }}>
            We could not load available times just now.
          </p>
          <button type="button" onClick={onRetry} className="btn btn--outline">
            <span>Try again</span>
          </button>
        </div>
      ) : closedReason ? (
        <p style={{ color: 'var(--color-bone-dim)' }}>{closedReason}. Choose another date.</p>
      ) : slots.length === 0 ? (
        <p style={{ color: 'var(--color-bone-dim)' }}>
          No times are available for that date. Choose another.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {slots.map((slot, i) => {
            const selected = draft.time === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => update({ time: slot.time })}
                aria-label={`${slot.time}${slot.available ? '' : ' — fully booked'}`}
                // See StepDate: a CSS keyframe with no forwards fill, so an
                // interrupted entrance cannot leave the grid looking dead.
                className={canAnimate ? 'u-num enter-rise relative py-3.5' : 'u-num relative py-3.5'}
                style={{
                  border: `1px solid ${selected ? 'var(--color-saffron)' : 'var(--color-smoke)'}`,
                  background: selected ? 'var(--color-ash-3)' : 'transparent',
                  color: 'var(--color-bone)',
                  fontSize: '0.875rem',
                  cursor: slot.available ? 'pointer' : 'not-allowed',
                  animationDelay: canAnimate ? `${Math.min(i, 8) * 30}ms` : undefined,
                  transition: `border-color ${DUR.short}s var(--ease-house), background-color ${DUR.short}s var(--ease-house)`,
                }}
              >
                {/* Unavailable slots stay visible and struck through rather
                    than hidden — showing scarcity converts better. Dimming is
                    on the label, not the button, so it cannot collide with
                    the entrance animation's opacity. */}
                <span style={{ opacity: slot.available ? 1 : 0.4 }}>{slot.time}</span>
                {!slot.available && (
                  <span
                    aria-hidden="true"
                    className="absolute left-3 right-3 top-1/2"
                    style={{ height: 1, background: 'var(--color-bone-dim)', opacity: 0.7 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepGuests({
  draft,
  update,
}: {
  draft: ReservationDraft;
  update: (p: Partial<ReservationDraft>) => void;
}) {
  const large = (draft.partySize ?? 0) > 8;

  return (
    <div>
      <h2 className="u-display mb-3" style={{ fontSize: 'var(--t-dish-lg)' }}>
        How many guests?
      </h2>
      <p className="mb-9" style={{ color: 'var(--color-bone-dim)' }}>
        Up to eight online. Larger parties are handled by the private dining team.
      </p>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
          const selected = draft.partySize === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => update({ partySize: n })}
              className="u-num py-4"
              style={{
                border: `1px solid ${selected ? 'var(--color-saffron)' : 'var(--color-smoke)'}`,
                background: selected ? 'var(--color-ash-3)' : 'transparent',
                color: 'var(--color-bone)',
                transition: `all ${DUR.short}s var(--ease-house)`,
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {large && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DUR.short, ease: EASE.house }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mt-8 border-l p-6"
              style={{ borderColor: 'var(--color-saffron)', background: 'var(--color-ash)' }}
            >
              <p className="u-mono mb-3" style={{ color: 'var(--color-saffron)' }}>
                Nine or more
              </p>
              <p className="mb-5" style={{ color: 'var(--color-bone-dim)' }}>
                Parties above eight go to private dining, where the room and the menu are set
                together rather than booked from a slot grid.
              </p>
              <a href="/contact?subject=Private%20Dining" className="btn btn--outline">
                <span>Private dining enquiry</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepSeating({
  draft,
  update,
}: {
  draft: ReservationDraft;
  update: (p: Partial<ReservationDraft>) => void;
}) {
  const party = draft.partySize ?? 2;

  return (
    <div>
      <h2 className="u-display mb-3" style={{ fontSize: 'var(--t-dish-lg)' }}>
        Choose a room
      </h2>
      <p className="mb-9" style={{ color: 'var(--color-bone-dim)' }}>
        Four rooms take reservations. Availability depends on party size.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {SEATING_AREAS.map((area) => {
          const eligible = party >= area.minParty && party <= area.maxParty;
          const selected = draft.seatingArea === area.id;

          return (
            <button
              key={area.id}
              type="button"
              disabled={!eligible}
              onClick={() => update({ seatingArea: area.id })}
              className="group text-left"
              style={{
                border: `1px solid ${selected ? 'var(--color-saffron)' : 'var(--color-smoke)'}`,
                opacity: eligible ? 1 : 0.35,
                cursor: eligible ? 'pointer' : 'not-allowed',
                transition: `all ${DUR.short}s var(--ease-house)`,
              }}
            >
              <Picture
                src={area.image}
                alt={area.name}
                ratio="16/10"
                sizes="(max-width: 640px) 100vw, 40vw"
                className="w-full"
              />
              <div className="p-5">
                <h3 className="u-display mb-2" style={{ fontSize: 'var(--t-dish)' }}>
                  {area.name}
                </h3>
                <p className="u-mono" style={{ color: 'var(--color-bone-faint)', lineHeight: 1.8 }}>
                  {eligible
                    ? area.note
                    : `${area.minParty}–${area.maxParty} guests`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDetails({
  draft,
  update,
  errors,
}: {
  draft: ReservationDraft;
  update: (p: Partial<ReservationDraft>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div>
      <h2 className="u-display mb-3" style={{ fontSize: 'var(--t-dish-lg)' }}>
        Your details
      </h2>
      <p className="mb-9" style={{ color: 'var(--color-bone-dim)' }}>
        We will send a reference code and a calendar file to your email.
      </p>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field
          id="name"
          label="Name"
          value={draft.name}
          onChange={(v) => update({ name: v })}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          id="email"
          label="Email"
          type="email"
          value={draft.email}
          onChange={(v) => update({ email: v })}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          id="phone"
          label="Phone"
          type="tel"
          value={draft.phone}
          onChange={(v) => update({ phone: v })}
          error={errors.phone}
          autoComplete="tel"
        />
        <Field
          id="occasion"
          label="Occasion (optional)"
          value={draft.occasion}
          onChange={(v) => update({ occasion: v })}
        />

        <div className="sm:col-span-2">
          <div className="field">
            <label className="field__label" htmlFor="dietary">
              Dietary notes
            </label>
            <textarea
              id="dietary"
              className="field__control"
              value={draft.dietaryNotes}
              onChange={(e) => update({ dietaryNotes: e.target.value })}
              placeholder="Allergies, intolerances, anything the kitchen should know."
            />
            <p className="u-mono" style={{ color: 'var(--color-bone-faint)', lineHeight: 1.8 }}>
              Our menu marks finned fish and shellfish separately —{' '}
              <a href="/allergens" className="link-rule" style={{ color: 'var(--color-bone-dim)' }}>
                see the full legend
              </a>
            </p>
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="field">
            <label className="field__label" htmlFor="access">
              Accessibility needs
            </label>
            <textarea
              id="access"
              className="field__control"
              value={draft.accessibilityNotes}
              onChange={(e) => update({ accessibilityNotes: e.target.value })}
              placeholder="Step-free access, seating preferences, anything else."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="field" data-invalid={Boolean(error)}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="field__control"
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
