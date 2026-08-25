import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { admin, type AdminBooking } from '@/lib/api';
import { AdminShell } from './AdminShell';
import { formatDate, toISO, addDays } from '@/lib/format';

const FLOW: Record<string, string[]> = {
  confirmed: ['seated', 'no_show', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  seated: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};

const LABEL: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', seated: 'Seated',
  completed: 'Completed', cancelled: 'Cancelled', no_show: 'No show',
};

const TONE: Record<string, string> = {
  pending: 'var(--color-warn)', confirmed: 'var(--color-bone)',
  seated: 'var(--color-saffron)', completed: 'var(--color-ok)',
  cancelled: 'var(--color-bone-faint)', no_show: 'var(--color-stop)',
};

export default function Service() {
  const [date, setDate] = useState(toISO(new Date()));
  const qc = useQueryClient();

  const day = useQuery({
    queryKey: ['admin', 'day', date],
    queryFn: async () => {
      const r = await admin.day(date);
      if (!r.ok) throw new Error(r.message);
      return r.data;
    },
    // A service in progress changes constantly; staff should not have to
    // reload to see a table that was just seated.
    refetchInterval: 30_000,
  });

  const update = useMutation({
    mutationFn: admin.updateBooking,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'day', date] }),
  });

  const bookings = day.data?.bookings ?? [];
  const live = bookings.filter((b) => ['pending', 'confirmed', 'seated'].includes(b.status));

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-end gap-6">
        <div>
          <p className="u-mono mb-2" style={{ color: 'var(--color-bone-faint)' }}>Service</p>
          <h1 className="u-display t-section">{formatDate(date)}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn btn--outline"
                  onClick={() => setDate(toISO(addDays(new Date(`${date}T00:00:00`), -1)))}>
            <span>Prev</span>
          </button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                 className="field__control" style={{ width: 170 }} />
          <button type="button" className="btn btn--outline"
                  onClick={() => setDate(toISO(addDays(new Date(`${date}T00:00:00`), 1)))}>
            <span>Next</span>
          </button>
          <button type="button" className="btn btn--ghost ml-2" onClick={() => setDate(toISO(new Date()))}>
            <span>Today</span>
          </button>
        </div>

        <div className="ml-auto flex gap-8">
          <Stat label="Covers" value={String(day.data?.covers ?? 0)} />
          <Stat label="Bookings" value={String(live.length)} />
        </div>
      </div>

      {day.isLoading && <p style={{ color: 'var(--color-bone-dim)' }}>Loading service…</p>}
      {day.isError && (
        <div>
          <p className="mb-4" style={{ color: 'var(--color-bone-dim)' }}>Could not load this service.</p>
          <button type="button" className="btn btn--outline" onClick={() => day.refetch()}>
            <span>Try again</span>
          </button>
        </div>
      )}

      {day.data && bookings.length === 0 && (
        <p style={{ color: 'var(--color-bone-dim)' }}>No bookings for this date.</p>
      )}

      <div className="flex flex-col gap-3">
        {bookings.map((b) => (
          <Row key={b.id} b={b} onChange={(status) => update.mutate({ id: Number(b.id), status })}
               busy={update.isPending} />
        ))}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>{label}</p>
      <p className="u-num" style={{ color: 'var(--color-bone)', fontSize: '1.6rem' }}>{value}</p>
    </div>
  );
}

function Row({ b, onChange, busy }: { b: AdminBooking; onChange: (s: string) => void; busy: boolean }) {
  const dimmed = ['cancelled', 'no_show', 'completed'].includes(b.status);
  return (
    <article
      className="grid gap-4 border p-4 lg:grid-cols-[80px_1fr_auto]"
      style={{
        borderColor: 'var(--color-smoke)',
        background: 'var(--color-ash)',
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <div>
        <p className="u-num" style={{ color: 'var(--color-bone)', fontSize: '1.1rem' }}>{b.time}</p>
        <p className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>{b.partySize} pax</p>
      </div>

      <div className="min-w-0">
        <p style={{ color: 'var(--color-bone)' }}>
          {b.name}
          <span className="u-num ml-3" style={{ color: 'var(--color-bone-faint)', fontSize: '0.75rem' }}>
            {b.reference}
          </span>
        </p>
        <p className="u-mono mt-1" style={{ color: 'var(--color-bone-dim)' }}>
          {b.seatingAreaName}{b.tableAssignment ? ` · ${b.tableAssignment}` : ''} · {b.phone}
        </p>

        {/* Allergies are the one thing that must not be a click away. */}
        {b.dietaryNotes && (
          <p className="mt-2 border-l pl-3" style={{ borderColor: 'var(--color-stop)', color: 'var(--color-bone)' }}>
            <span className="u-mono" style={{ color: 'var(--color-stop)' }}>Dietary </span>
            {b.dietaryNotes}
          </p>
        )}
        {b.accessibilityNotes && (
          <p className="mt-2 border-l pl-3" style={{ borderColor: 'var(--color-saffron)', color: 'var(--color-bone)' }}>
            <span className="u-mono" style={{ color: 'var(--color-saffron)' }}>Access </span>
            {b.accessibilityNotes}
          </p>
        )}
        {b.occasion && (
          <p className="u-mono mt-2" style={{ color: 'var(--color-bone-faint)' }}>{b.occasion}</p>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <span className="u-mono px-3 py-2" style={{ border: `1px solid ${TONE[b.status]}`, color: TONE[b.status] }}>
          {LABEL[b.status]}
        </span>
        {(FLOW[b.status] ?? []).map((next) => (
          <button key={next} type="button" disabled={busy} onClick={() => onChange(next)}
                  className="u-mono px-3 py-2"
                  style={{ border: '1px solid var(--color-smoke)', color: 'var(--color-bone-dim)' }}>
            {LABEL[next]}
          </button>
        ))}
      </div>
    </article>
  );
}
