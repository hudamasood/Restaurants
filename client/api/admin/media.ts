import { sql } from '../_lib/db.js';
import { json, fail } from '../_lib/http.js';
import { requireAdmin, auditLog } from '../_lib/auth.js';
import { storageConfig } from '../_lib/storage.js';
import { processImage } from '../_lib/images.js';
import { withVercel } from '../_lib/vercel.js';

export const config = {
  runtime: 'nodejs',
  // Generating fifteen derivatives from a large original takes longer than
  // the default budget.
  maxDuration: 60,
};

async function handler(req: Request): Promise<Response> {
  const auth = await requireAdmin(req, ['owner', 'manager']);
  if (auth instanceof Response) return auth;

  if (req.method === 'GET') {
    const rows = (await sql`
      SELECT id, original_name, mime, bytes, width, height, variants, lqip, alt, created_at
      FROM media ORDER BY created_at DESC LIMIT 200
    `) as any[];
    return json({
      configured: storageConfig() !== null,
      media: rows.map((m) => ({
        id: m.id, name: m.original_name, mime: m.mime, bytes: m.bytes,
        width: m.width, height: m.height, variants: m.variants, lqip: m.lqip,
        alt: m.alt, createdAt: new Date(m.created_at).toISOString(),
        // The URL <Picture> should use as its base.
        src: m.variants?.jpeg?.['1600'] ?? m.variants?.jpeg?.['800'] ?? null,
      })),
    });
  }

  if (req.method !== 'POST') return fail('Method not allowed', 405);

  // Refused up front with a reason, rather than failing obscurely once sharp
  // has already spent thirty seconds on derivatives it cannot store.
  if (!storageConfig()) {
    return fail(
      'Object storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.',
      503,
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('Expected multipart/form-data with a "file" field', 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return fail('No file provided', 400);

  const alt = String(form.get('alt') ?? '').slice(0, 300);

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const out = await processImage(bytes, file.name || 'upload', file.type || 'image/jpeg');

    await sql`
      INSERT INTO media (id, original_name, mime, bytes, width, height, variants, lqip, alt, uploaded_by)
      VALUES (${out.id}, ${file.name || 'upload'}, ${out.mime}, ${out.bytes}, ${out.width}, ${out.height},
              ${JSON.stringify(out.variants)}, ${out.lqip}, ${alt}, ${Number(auth.id)})
      ON CONFLICT (id) DO UPDATE SET alt = EXCLUDED.alt
    `;

    await auditLog(auth, 'upload', 'media', out.id, { name: file.name, bytes: out.bytes });

    return json({
      media: {
        id: out.id, width: out.width, height: out.height, variants: out.variants,
        lqip: out.lqip, src: out.variants.jpeg['1600'] ?? out.variants.jpeg['400'],
      },
    }, 201);
  } catch (e) {
    console.error('upload failed', e);
    return fail((e as Error).message || 'Could not process the image', 422);
  }
}

export default withVercel(handler);
