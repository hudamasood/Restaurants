import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Exports every table to a timestamped JSON file.
 *
 * This is the second line, not the first. Neon's own point-in-time restore is
 * the real recovery mechanism — it is continuous, it can rewind to any second
 * inside the retention window, and it restores the schema with the data. A
 * nightly logical export cannot compete with that and does not try to.
 *
 * What it does instead is get the data out of Neon. Point-in-time restore only
 * helps while the Neon project exists and is reachable: it does not survive the
 * account being suspended for an unpaid invoice, a project deleted by someone
 * with the credentials, or a decision to move hosts. Those are the cases where
 * having a file on disk somewhere else is the difference.
 *
 * It deliberately does not use pg_dump. pg_dump refuses to run against a server
 * newer than itself, so a dump-based script silently stops working the day Neon
 * upgrades Postgres and nobody notices until a restore is needed. This talks to
 * the database through the same driver the application uses, so it keeps
 * working, and it runs anywhere Node runs with no client binary to match.
 *
 *   npm run db:backup            → ./backups/
 *   BACKUP_DIR=/vol npm run db:backup
 */

const sql = neon(process.env.DATABASE_URL);

const tables = await sql`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename
`;

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dir = process.env.BACKUP_DIR ?? 'backups';
mkdirSync(dir, { recursive: true });

const data = {};
let total = 0;

for (const { tablename } of tables) {
  // Table names come from pg_tables, not from user input, and the driver has
  // no placeholder for an identifier — so this is quoted rather than bound.
  const rows = await sql.query(`SELECT * FROM "${tablename}"`);
  data[tablename] = rows;
  total += rows.length;
  console.log(`  ${tablename.padEnd(28)} ${String(rows.length).padStart(6)} rows`);
}

// Password hashes are in this file. It is a full copy of the reservation book
// and every guest's contact details, so it belongs somewhere access-controlled,
// not in a public repository — backups/ is excluded from git for that reason.
const file = join(dir, `backup-${stamp}.json`);
writeFileSync(
  file,
  JSON.stringify({ takenAt: new Date().toISOString(), tables: Object.keys(data), data }, null, 2),
);

console.log(`\n${tables.length} tables, ${total} rows → ${file}`);

// An empty backup is the failure that looks like a success, and it is exactly
// what a wrong DATABASE_URL produces. Fail loudly instead of writing "{}".
if (total === 0) {
  console.error('\nRefusing to call this a backup: every table was empty. Check DATABASE_URL.');
  process.exit(1);
}
