import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { admin, type Session } from '@/lib/api';
import { Wordmark } from '@/components/layout/Wordmark';

/**
 * The admin surface is deliberately plain. The public site is theatre; this
 * is a tool used mid-service on a cramped screen, where scanning speed beats
 * atmosphere. It shares the palette and the type, and nothing else — no
 * pinning, no reveals, no page transitions.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const session = useQuery({
    queryKey: ['admin', 'session'],
    queryFn: async () => {
      const r = await admin.me();
      if (!r.ok) throw new Error(r.message);
      return r.data.session;
    },
    retry: false,
    staleTime: 60_000,
  });

  const signOut = useMutation({
    mutationFn: admin.signOut,
    onSuccess: () => {
      qc.clear();
      navigate('/admin/login', { replace: true });
    },
  });

  if (session.isLoading) {
    return <div style={{ padding: '6rem 2rem', color: 'var(--color-bone-dim)' }}>Checking session…</div>;
  }
  if (session.isError) {
    // Every admin query is refetched, not just the session. Page queries mount
    // alongside this shell and fire before authentication, so they hold a 401
    // by the time sign-in succeeds — without this the day view stays empty
    // behind a valid session.
    return (
      <SignIn
        onDone={() => {
          qc.invalidateQueries({ queryKey: ['admin'] });
          session.refetch();
        }}
      />
    );
  }

  const s = session.data as Session;

  return (
    <div style={{ minHeight: '100svh', background: 'var(--color-ink)' }}>
      <header
        className="sticky top-0 z-50 flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4"
        style={{ background: 'var(--color-ash)', borderBottom: '1px solid var(--color-smoke)' }}
      >
        <Wordmark size="sm" />
        <nav className="flex gap-6">
          {[
            { to: '/admin', label: 'Service', end: true },
            { to: '/admin/menu', label: 'Menu' },
          ].map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="u-mono">
              {({ isActive }) => (
                <span style={{ color: isActive ? 'var(--color-saffron)' : 'var(--color-bone-dim)' }}>
                  {l.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-5">
          <span className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
            {s.name} · {s.role}
          </span>
          <button
            type="button"
            onClick={() => signOut.mutate()}
            className="u-mono"
            style={{ color: 'var(--color-bone-dim)' }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main style={{ padding: '2rem 1.5rem 5rem' }}>{children}</main>
    </div>
  );
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const signIn = useMutation({
    mutationFn: () => admin.signIn(email, password),
    onMutate: () => setError(null),
    onSuccess: (r) => (r.ok ? onDone() : setError(r.message)),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div
      className="flex items-center justify-center px-6"
      style={{ minHeight: '100svh', background: 'var(--color-ink)' }}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); signIn.mutate(); }}
        className="w-full max-w-sm border p-8"
        style={{ borderColor: 'var(--color-smoke)', background: 'var(--color-ash)' }}
      >
        <Wordmark size="md" />
        <p className="u-mono mt-3 mb-8" style={{ color: 'var(--color-bone-faint)' }}>
          Staff sign in
        </p>

        <div className="field mb-5">
          <label className="field__label" htmlFor="a-email">Email</label>
          <input
            id="a-email" type="email" autoComplete="username" required
            className="field__control" value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field mb-7">
          <label className="field__label" htmlFor="a-pass">Password</label>
          <input
            id="a-pass" type="password" autoComplete="current-password" required
            className="field__control" value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="mb-6 border-l pl-4"
             style={{ borderColor: 'var(--color-stop)', color: 'var(--color-bone)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={signIn.isPending} className="btn btn--filled w-full">
          <span>{signIn.isPending ? 'Signing in…' : 'Sign in'}</span>
        </button>
      </form>
    </div>
  );
}
