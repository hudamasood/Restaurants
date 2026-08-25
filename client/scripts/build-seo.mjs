import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Signature slugs are read from the built data rather than hardcoded, so the
// sitemap cannot drift from the menu.
const out = execSync(
  'npx esbuild src/data/menu.ts --bundle --platform=node --format=esm --packages=external',
  { encoding: 'utf8' },
);
const mod = await import(`data:text/javascript,${encodeURIComponent(out)}`);

const BASE = process.env.SITE_URL ?? 'https://marrowandhearth.com';
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  ['/', '1.0', 'weekly'],
  ['/menu', '0.9', 'weekly'],
  ['/still-room', '0.8', 'monthly'],
  ['/story', '0.7', 'monthly'],
  ['/story/kitchen', '0.6', 'monthly'],
  ['/experience', '0.7', 'monthly'],
  ['/gallery', '0.6', 'monthly'],
  ['/reserve', '0.9', 'monthly'],
  ['/contact', '0.7', 'monthly'],
  ['/allergens', '0.6', 'monthly'],
  ['/legal/privacy', '0.3', 'yearly'],
  ['/legal/accessibility', '0.3', 'yearly'],
];

const dishPages = mod.DISHES.filter((d) => d.isSignature).map((d) => [`/menu/${d.slug}`, '0.8', 'monthly']);

const urls = [...staticPages, ...dishPages]
  .map(([loc, priority, freq]) =>
    `  <url>\n    <loc>${BASE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`)
  .join('\n');

writeFileSync('public/sitemap.xml',
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
console.log(`sitemap: ${staticPages.length} static + ${dishPages.length} signature dishes = ${staticPages.length + dishPages.length} urls`);
