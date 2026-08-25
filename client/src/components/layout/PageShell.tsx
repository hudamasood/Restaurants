import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { BRAND } from '@/data/brand';

interface PageShellProps {
  children: ReactNode;
  title: string;
  description: string;
  /** The title is already complete; do not append the brand name. */
  exactTitle?: boolean;
  /** Omit the footer on pages that end in their own full-bleed panel. */
  bare?: boolean;
}

/**
 * Keeps the document head in step with the current page.
 *
 * This used to render <title> and <meta> straight into the tree and let React
 * 19 hoist them, which is the idiomatic thing and looked correct in a browser.
 * It was not. React hoists those tags but does not deduplicate them against the
 * ones already in index.html, so every page ended up with two descriptions and
 * two og:titles. A browser resolves that in the page's favour and a crawler
 * does not — it reads the first one it meets, which was the homepage's, on
 * every single page.
 *
 * So the tags are updated in place instead. There is exactly one of each, the
 * one the prerender step wrote, and it always says what this page says.
 */
function setMeta(selector: string, attr: string, key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute(selector.startsWith('link') ? 'href' : 'content', value);
}

export function PageShell({ children, title, description, exactTitle }: PageShellProps) {
  const full = exactTitle ? title : `${title} — ${BRAND.name}`;
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = full;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', full);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);

    // Canonical and og:url have to be absolute, and on a deploy preview the
    // origin is not the production one — so read it rather than assume it.
    const url = `${location.origin}${pathname}`;
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('link[rel="canonical"]', 'rel', 'canonical', url);
  }, [full, description, pathname]);

  return <main id="main">{children}</main>;
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
