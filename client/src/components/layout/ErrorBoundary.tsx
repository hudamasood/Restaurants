import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BRAND } from '@/data/brand';

/**
 * The last line before a white screen.
 *
 * A render error anywhere below this unmounts the whole tree and leaves the
 * visitor staring at nothing — on a restaurant site that means they cannot
 * find the phone number either. The fallback therefore carries the address
 * and telephone, so the page still does its most important job even when
 * the application has failed.
 */
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept to console rather than swallowed, so it reaches whatever
    // monitoring is wired up in production.
    console.error('Unhandled render error', error, info.componentStack);
    if (typeof window !== 'undefined') {
      (window as any).__mhLastError = { message: error.message, stack: error.stack };
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100svh',
          background: 'var(--color-ink)',
          color: 'var(--color-bone)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '34rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-saffron)',
              marginBottom: '1.5rem',
            }}
          >
            {BRAND.name}
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              lineHeight: 1.1,
              marginBottom: '1.25rem',
            }}
          >
            Something went wrong on our side
          </h1>

          <p style={{ color: 'var(--color-bone-dim)', lineHeight: 1.7, marginBottom: '2rem' }}>
            The page failed to load. Reloading usually fixes it. If you were
            booking a table, nothing was charged and no reservation was made —
            please call us and we will take it over the phone.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--filled" onClick={() => window.location.reload()}>
              <span>Reload</span>
            </button>
            <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="btn btn--outline">
              <span>{BRAND.phone}</span>
            </a>
          </div>

          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              letterSpacing: '0.14em',
              color: 'var(--color-bone-faint)',
              marginTop: '2.5rem',
              lineHeight: 1.9,
            }}
          >
            {BRAND.address.line1}, {BRAND.address.city} {BRAND.address.postcode}
          </p>
        </div>
      </div>
    );
  }
}
