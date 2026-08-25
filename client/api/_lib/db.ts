import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

/** HTTP-based Postgres client. Safe on serverless — no pool to exhaust. */
export const sql = neon(process.env.DATABASE_URL);
