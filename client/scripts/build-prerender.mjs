import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';

/**
 * Writes a real HTML file for every known route, each carrying that route's
 * own title, description, canonical and Open Graph tags.
 *
 * Why this exists. Google executes JavaScript, so it eventually sees the tags
 * React 19 hoists at runtime. Nothing else does. WhatsApp, iMessage, Slack,
 * Discord, Facebook and X all fetch the raw HTML once and read what is in it —
 * they run no script and they do not come back. Without this every link shared
 * anywhere shows the homepage title, whichever page was actually linked. For a
 * restaurant, links to a dish or to the reservation page are most of how the
 * site gets passed around, so that is the whole game.
 *
 * This is not server rendering and does not try to be. The body is still the
 * empty SPA mount; only the head is specialised. That is all a scraper reads,
 * and it keeps the client a plain static bundle with no runtime to operate.
 *
 * Run after vite build, since it copies dist/index.html as its template.
 */

const out = execSync(
  'npx esbuild src/data/pageMeta.ts --bundle --platform=node --format=esm --packages=external',
  { encoding: 'utf8' },
);
const { PAGE_META, dishMeta, BRAND_NAME } = await import(`data:text/javascript,${encodeURIComponent(out)}`);

const BASE = (process.env.SITE_URL ?? 'https://marrowandhearth.com').replace(/\/$/, '');

const template = readFileSync('dist/index.html', 'utf8');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const routes = [
  ...Object.entries(PAGE_META).map(([path, m]) => ({ path, ...m })),
  ...dishMeta(),
  // Legal pages are not in PAGE_META because the copy lives with the page.
  { path: '/legal/privacy', title: 'Privacy', description: `How ${BRAND_NAME} handles reservation and enquiry data.` },
  { path: '/legal/accessibility', title: 'Accessibility', description: `The accessibility commitments of ${BRAND_NAME}, and how to tell us where we fall short.` },
];

for (const { path, title, description, exactTitle } of routes) {
  // The same rule PageShell applies at runtime, so the two never disagree.
  const full = exactTitle ? title : `${title} — ${BRAND_NAME}`;
  const canonical = `${BASE}${path}`;

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(full)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(full)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${esc(canonical)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${esc(canonical)}" />`);

  // A route that silently failed to pick up its own title is worse than a
  // failed build, because it looks fine until someone shares the link.
  if (!html.includes(`<title>${esc(full)}</title>`)) {
    throw new Error(`prerender: could not set <title> for ${path} — has index.html changed?`);
  }

  const file = path === '/' ? 'dist/index.html' : join('dist', path.slice(1), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

console.log(`prerender: ${routes.length} routes`);
