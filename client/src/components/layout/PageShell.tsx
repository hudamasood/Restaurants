import type { ReactNode } from 'react';
import { BRAND } from '@/data/brand';

interface PageShellProps {
  children: ReactNode;
  title: string;
  description: string;
  /** Omit the footer on pages that end in their own full-bleed panel. */
  bare?: boolean;
}

/**
 * React 19 hoists <title> and <meta> from anywhere in the tree, so no
 * helmet library is needed.
 */
export function PageShell({ children, title, description }: PageShellProps) {
  const full = title === BRAND.name ? title : `${title} — ${BRAND.name}`;

  return (
    <>
      <title>{full}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <main id="main">{children}</main>
    </>
  );
}

export function SkipLink() {
  return (
    <a
      href="#main"
      className="u-mono fixed left-4 top-4 z-[300] -translate-y-24 px-5 py-3 focus:translate-y-0"
      style={{
        background: 'var(--color-bone)',
        color: 'var(--color-ink)',
        transition: 'transform 200ms var(--ease-house)',
      }}
    >
      Skip to content
    </a>
  );
}
