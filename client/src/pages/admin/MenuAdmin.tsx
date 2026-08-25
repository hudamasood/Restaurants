import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { admin, type AdminDish } from '@/lib/api';
import { AdminShell } from './AdminShell';

export default function MenuAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [onlyUnavailable, setOnlyUnavailable] = useState(false);

  const dishes = useQuery({
    queryKey: ['admin', 'dishes'],
    queryFn: async () => {
      const r = await admin.dishes();
      if (!r.ok) throw new Error(r.message);
      return r.data.dishes;
    },
  });

  const update = useMutation({
    mutationFn: admin.updateDish,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'dishes'] });
      // The public menu reads the same rows, so drop its cache too.
      qc.invalidateQueries({ queryKey: ['menu'] });
    },
  });

  const all = dishes.data ?? [];
  const q = filter.trim().toLowerCase();
  const rows = all.filter((d) =>
    (!onlyUnavailable || !d.isAvailable) &&
    (!q || d.name.toLowerCase().includes(q) || d.courseName.toLowerCase().includes(q)));

  const off = all.filter((d) => !d.isAvailable).length;

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-end gap-6">
        <div>
          <p className="u-mono mb-2" style={{ color: 'var(--color-bone-faint)' }}>Menu</p>
          <h1 className="u-display t-section">{all.length} dishes</h1>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or course…"
          className="field__control"
          style={{ maxWidth: 280 }}
        />
        <button
          type="button"
          onClick={() => setOnlyUnavailable((v) => !v)}
          className="u-mono px-4 py-2"
          style={{
            border: `1px solid ${onlyUnavailable ? 'var(--color-saffron)' : 'var(--color-smoke)'}`,
            color: onlyUnavailable ? 'var(--color-saffron)' : 'var(--color-bone-dim)',
          }}
        >
          Off menu ({off})
        </button>
      </div>

      {dishes.isLoading && <p style={{ color: 'var(--color-bone-dim)' }}>Loading menu…</p>}
      {dishes.isError && (
        <button type="button" className="btn btn--outline" onClick={() => dishes.refetch()}>
          <span>Try again</span>
        </button>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((d) => (
          <DishRow key={d.id} d={d} busy={update.isPending}
                   onToggle={() => update.mutate({ id: d.id, isAvailable: !d.isAvailable })}
                   onPrice={(price) => update.mutate({ id: d.id, price })} />
        ))}
      </div>
    </AdminShell>
  );
}

function DishRow({
  d, onToggle, onPrice, busy,
}: { d: AdminDish; onToggle: () => void; onPrice: (p: number) => void; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(d.price));

  return (
    <article
      className="grid items-center gap-4 border p-3 lg:grid-cols-[1fr_150px_110px_130px]"
      style={{
        borderColor: 'var(--color-smoke)',
        background: 'var(--color-ash)',
        opacity: d.isAvailable ? 1 : 0.6,
      }}
    >
      <div className="min-w-0">
        <p style={{ color: 'var(--color-bone)' }}>
          {d.name}
          {d.isSignature && (
            <span className="u-mono ml-3" style={{ color: 'var(--color-saffron)' }}>Signature</span>
          )}
        </p>
        <p className="u-mono mt-1" style={{ color: 'var(--color-bone-faint)' }}>
          {d.courseName} · {d.stationName}
        </p>
      </div>

      <p className="u-mono" style={{ color: 'var(--color-bone-dim)' }}>{d.stationName}</p>

      {editing ? (
        <input
          autoFocus
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => {
            const n = Number(price);
            if (Number.isFinite(n) && n >= 0 && n !== d.price) onPrice(n);
            setEditing(false);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className="field__control u-num"
          style={{ width: 90 }}
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="u-num text-left"
                style={{ color: 'var(--color-bone)' }}>
          £{d.price}
        </button>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={onToggle}
        className="u-mono px-3 py-2"
        style={{
          border: `1px solid ${d.isAvailable ? 'var(--color-ok)' : 'var(--color-stop)'}`,
          color: d.isAvailable ? 'var(--color-ok)' : 'var(--color-stop)',
        }}
      >
        {d.isAvailable ? 'On menu' : 'Off menu'}
      </button>
    </article>
  );
}
