import { AwsClient } from 'aws4fetch';

/**
 * S3-compatible object storage. Works unchanged against Cloudflare R2 or AWS
 * S3 — R2 is the cheaper choice here because it has no egress fee and these
 * are images served on every page.
 *
 * Unconfigured, uploads are refused with a clear reason rather than failing
 * obscurely deeper in the pipeline.
 */

export interface StorageConfig {
  endpoint: string;
  bucket: string;
  publicBase: string;
}

export function storageConfig(): StorageConfig | null {
  const { S3_ENDPOINT, S3_BUCKET, S3_PUBLIC_BASE, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;
  return {
    endpoint: S3_ENDPOINT.replace(/\/$/, ''),
    bucket: S3_BUCKET,
    // Falls back to the endpoint when no CDN domain is set.
    publicBase: (S3_PUBLIC_BASE ?? `${S3_ENDPOINT}/${S3_BUCKET}`).replace(/\/$/, ''),
  };
}

function client(): AwsClient {
  return new AwsClient({
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    service: 's3',
    region: process.env.S3_REGION ?? 'auto',
  });
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<string> {
  const cfg = storageConfig();
  if (!cfg) throw new Error('Object storage is not configured');

  const url = `${cfg.endpoint}/${cfg.bucket}/${key}`;
  const res = await client().fetch(url, {
    method: 'PUT',
    body: body as BodyInit,
    headers: {
      'content-type': contentType,
      // Derivatives are content-addressed by hash, so they can never change
      // under a given key.
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  return `${cfg.publicBase}/${key}`;
}

export async function deleteObject(key: string): Promise<void> {
  const cfg = storageConfig();
  if (!cfg) return;
  await client().fetch(`${cfg.endpoint}/${cfg.bucket}/${key}`, { method: 'DELETE' });
}
