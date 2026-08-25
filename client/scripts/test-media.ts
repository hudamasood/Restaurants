import 'dotenv/config';
import sharp from 'sharp';
import media from '../api/admin/media.ts';
import session from '../api/admin/session.ts';
import { storageConfig } from '../api/_lib/storage.ts';

console.log('storage configured:', storageConfig() !== null, '\n');

const login = await session(new Request('http://localhost/api/admin/session', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.5.5.5' },
  body: JSON.stringify({ email: 'owner@marrowandhearth.com', password: 'ChangeThisPassword123' }) }));
const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];

// A real 2000x1500 JPEG to run through the pipeline.
const original = await sharp({
  create: { width: 2000, height: 1500, channels: 3, background: { r: 74, g: 17, b: 25 } },
}).jpeg({ quality: 90 }).toBuffer();
console.log(`source: 2000x1500 jpeg, ${(original.length / 1024).toFixed(0)}kb`);

console.log('\nGUARD');
const anon = await media(new Request('http://localhost/x', { method: 'POST' }));
console.log(`  no cookie -> ${anon.status}`);

console.log('\nUPLOAD (storage unconfigured)');
const fd = new FormData();
fd.append('file', new File([new Uint8Array(original)], 'tomahawk.jpg', { type: 'image/jpeg' }));
fd.append('alt', 'A dry-aged tomahawk');
const up = await media(new Request('http://localhost/x', { method: 'POST', headers: { cookie }, body: fd }));
const body = await up.json();
console.log(`  ${up.status} ${JSON.stringify(body).slice(0, 150)}`);

console.log('\nTRANSFORMS (sharp directly, bypassing storage)');
for (const w of [400, 800, 1600]) {
  const r = sharp(original).resize({ width: w, withoutEnlargement: true });
  const [a, wp, j] = await Promise.all([
    r.clone().avif({ quality: 55, effort: 4 }).toBuffer(),
    r.clone().webp({ quality: 78 }).toBuffer(),
    r.clone().jpeg({ quality: 80, mozjpeg: true }).toBuffer(),
  ]);
  const m = await sharp(a).metadata();
  console.log(`  ${String(w).padStart(4)}px -> avif ${String(Math.round(a.length/1024)).padStart(3)}kb | webp ${String(Math.round(wp.length/1024)).padStart(3)}kb | jpeg ${String(Math.round(j.length/1024)).padStart(3)}kb  (${m.width}x${m.height})`);
}

const lqip = await sharp(original).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
console.log(`  lqip     -> ${lqip.length} bytes inline base64`);

console.log('\nNO UPSCALE');
const small = await sharp({ create: { width: 500, height: 400, channels: 3, background: { r: 20, g: 20, b: 20 } } }).jpeg().toBuffer();
const big = await sharp(small).resize({ width: 2400, withoutEnlargement: true }).jpeg().toBuffer();
console.log(`  500px source asked for 2400px -> ${(await sharp(big).metadata()).width}px (not upscaled)`);

console.log('\nREJECTS');
try {
  await sharp(Buffer.from('not an image at all')).metadata();
  console.log('  non-image accepted (BUG)');
} catch { console.log('  non-image rejected by sharp'); }
