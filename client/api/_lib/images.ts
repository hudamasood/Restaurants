import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { putObject } from './storage.ts';

/**
 * Build-equivalent derivatives at request time, so an admin upload lands on
 * exactly the contract <Picture> already consumes: AVIF and WebP across five
 * widths, a JPEG floor for anything ancient, and a 24px inline placeholder.
 */

export const WIDTHS = [400, 800, 1200, 1600, 2400] as const;
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff']);

export interface ProcessedImage {
  id: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  variants: Record<string, Record<string, string>>;
  lqip: string;
}

export async function processImage(
  input: Uint8Array,
  originalName: string,
  declaredMime: string,
): Promise<ProcessedImage> {
  if (input.byteLength > MAX_BYTES) {
    throw new Error(`Image is larger than ${MAX_BYTES / 1024 / 1024}MB`);
  }

  const img = sharp(Buffer.from(input), { failOn: 'error' });
  const meta = await img.metadata();

  // Trust sharp over the client's content-type header.
  const detected = meta.format ? `image/${meta.format}` : declaredMime;
  if (!ALLOWED.has(detected)) throw new Error(`Unsupported image type: ${detected}`);
  if (!meta.width || !meta.height) throw new Error('Could not read image dimensions');

  // Content-addressed, so re-uploading the same file is idempotent and a
  // derivative URL can be cached forever.
  const id = createHash('sha256').update(input).digest('hex').slice(0, 16);
  const stem = originalName.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);

  const variants: Record<string, Record<string, string>> = { avif: {}, webp: {}, jpeg: {} };

  for (const w of WIDTHS) {
    // Never upscale: a 900px original should not produce a blurry 2400px file.
    if (w > meta.width && w !== WIDTHS[0]) continue;

    const resized = sharp(Buffer.from(input)).rotate().resize({ width: w, withoutEnlargement: true });

    const [avif, webp, jpeg] = await Promise.all([
      resized.clone().avif({ quality: 55, effort: 4 }).toBuffer(),
      resized.clone().webp({ quality: 78 }).toBuffer(),
      resized.clone().jpeg({ quality: 80, mozjpeg: true }).toBuffer(),
    ]);

    const [aUrl, wUrl, jUrl] = await Promise.all([
      putObject(`media/${id}/${stem}-${w}.avif`, avif, 'image/avif'),
      putObject(`media/${id}/${stem}-${w}.webp`, webp, 'image/webp'),
      putObject(`media/${id}/${stem}-${w}.jpg`, jpeg, 'image/jpeg'),
    ]);

    variants.avif[w] = aUrl;
    variants.webp[w] = wUrl;
    variants.jpeg[w] = jUrl;
  }

  const lqipBuf = await sharp(Buffer.from(input)).rotate().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();

  return {
    id,
    width: meta.width,
    height: meta.height,
    bytes: input.byteLength,
    mime: detected,
    variants,
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
  };
}
