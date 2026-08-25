import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

/**
 * Restores a JSON export produced by backup.mjs.
 *
 * A backup with no restore path is a file, not a backup, and the time to find
 * out which one you have is not during an incident. Hence --rehearse: it does
 * the entire restore against the real database and then rolls it back, so the
 * path can be exercised on a schedule without a spare database to aim at.
 *
 * Note what this is for. If the data is merely wrong — a bad migration, a
 * mistaken bulk update — use Neon's point-in-time restore instead: it rewinds
 * to any second in the retention window and brings the schema with it. This is
 * for the case where the Neon project itself is gone and the target is a new,
 * migrated, empty database.
 *
 *   npm run db:restore -- backups/….json             plan only, writes nothing
 *   npm run db:restore -- backups/….json --rehearse  full restore, then rolls back
 *   npm run db:restore -- backups/….json --confirm   full restore, commits
 *
 * Plan-only is the default deliberately: a destructive script whose safe mode
 * requires a flag is a script that will one day be run without it.
 */

// Everything below runs in one transaction. Restoring is a clear-out followed
// by a few dozen inserts, and a failure halfway through an earlier design left
// the database holding neither the old rows nor the new ones — the one outcome
// a restore must never produce.
if (!neonConfig.webSocketConstructor && typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
}

const [file, ...flags] = process.argv.slice(2);
const commit = flags.includes('--confirm');
const rehearse = flags.includes('--rehearse');

if (!file) {
  console.error('Usage: npm run db:restore -- <backup.json> [--rehearse | --confirm]');
  process.exit(1);
}

const backup = JSON.parse(readFileSync(file, 'utf8'));
if (!backup.data || !Array.isArray(backup.tables)) {
  console.error(`${file} is not a backup produced by scripts/backup.mjs.`);
  process.exit(1);
}

const populated = backup.tables.filter((t) => backup.data[t]?.length);
const blank = backup.tables.filter((t) => !backup.data[t]?.length);

console.log(`Backup taken ${backup.takenAt}`);
for (const t of populated) {
  console.log(`  ${t.padEnd(28)} ${String(backup.data[t].length).padStart(6)} rows`);
}
if (blank.length) console.log(`  (empty, will be cleared: ${blank.join(', ')})`);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = await pool.connect();

try {
  const {
    rows: [{ db: name }],
  } = await db.query('SELECT current_database() AS db');
  console.log(`\nTarget: ${name}`);

  if (!commit && !rehearse) {
    console.log('\nPlan only. Nothing was written. Add --rehearse to test it, --confirm to restore.');
    process.exit(0);
  }

  await db.query('BEGIN');

  // Clearing every table in one statement sidesteps parent/child ordering on
  // the way out. Going back in, order matters: dishes reference stations, so
  // stations has to exist first.
  //
  // Deferring the constraints would avoid the question, but SET CONSTRAINTS
  // only moves constraints declared DEFERRABLE and these are not, so it does
  // nothing here — it looked like it worked only because nothing tested it.
  // Instead the tables are sorted by their actual foreign keys, read from the
  // catalogue, so adding a table later cannot break the restore.
  const all = backup.tables.map((t) => `"${t}"`).join(', ');
  await db.query(`TRUNCATE ${all} RESTART IDENTITY CASCADE`);

  const { rows: fks } = await db.query(`
    SELECT c.conrelid::regclass::text AS child, c.confrelid::regclass::text AS parent
    FROM pg_constraint c
    WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
      AND c.conrelid <> c.confrelid
  `);
  const parents = new Map(backup.tables.map((t) => [t, new Set()]));
  for (const { child, parent } of fks) {
    if (parents.has(child) && parents.has(parent)) parents.get(child).add(parent);
  }

  const ordered = [];
  const placed = new Set();
  // Plain repeated sweeps rather than a proper graph walk: a dozen tables makes
  // the difference unmeasurable, and this cannot recurse into a stack overflow.
  while (ordered.length < backup.tables.length) {
    const next = backup.tables.filter(
      (t) => !placed.has(t) && [...parents.get(t)].every((p) => placed.has(p)),
    );
    if (!next.length) {
      const stuck = backup.tables.filter((t) => !placed.has(t));
      throw new Error(`circular foreign keys between: ${stuck.join(', ')}`);
    }
    for (const t of next) {
      ordered.push(t);
      placed.add(t);
    }
  }

  // Most id columns here are GENERATED ALWAYS AS IDENTITY, which rejects an
  // explicit value outright. A restore has to keep the original ids — other
  // tables reference them — so those inserts need OVERRIDING SYSTEM VALUE.
  // Postgres rejects that clause on a table with no identity column, so it is
  // added per table rather than everywhere.
  const { rows: identityCols } = await db.query(`
    SELECT c.relname AS tbl
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relnamespace = 'public'::regnamespace AND a.attidentity IN ('a', 'd')
  `);
  const hasIdentity = new Set(identityCols.map((r) => r.tbl));

  // json and jsonb values come back from the backup as JS objects and arrays,
  // and the driver turns a JS array into a Postgres array literal — which a
  // jsonb column rejects. The dietary, provenance and media columns on dishes
  // are all arrays, so these have to be handed over as text and cast back.
  const { rows: jsonColRows } = await db.query(`
    SELECT table_name AS tbl, column_name AS col
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type IN ('json', 'jsonb')
  `);
  const jsonCols = new Set(jsonColRows.map((r) => `${r.tbl}.${r.col}`));

  for (const table of ordered.filter((t) => populated.includes(t))) {
    const rows = backup.data[table];
    const cols = Object.keys(rows[0]);
    const overriding = hasIdentity.has(table) ? 'OVERRIDING SYSTEM VALUE ' : '';

    // One statement per table rather than one per row: a few hundred round
    // trips to a hosted database is the difference between seconds and minutes.
    const values = [];
    const tuples = rows.map(
      (row) =>
        `(${cols
          .map((c) => {
            const json = jsonCols.has(`${table}.${c}`) && row[c] !== null;
            const n = values.push(json ? JSON.stringify(row[c]) : row[c]);
            return json ? `$${n}::jsonb` : `$${n}`;
          })
          .join(', ')})`,
    );

    await db.query(
      `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(', ')}) ` +
        `${overriding}VALUES ${tuples.join(', ')}`,
      values,
    );
    console.log(`  restored ${table} (${rows.length})`);
  }

  // RESTART IDENTITY left every sequence at 1, which would collide with the ids
  // just inserted — the next reservation would fail on a duplicate key. Move
  // each sequence past the largest value in its own column.
  //
  // pg_get_serial_sequence rather than walking pg_depend: an identity column's
  // sequence is an internal dependency and a serial column's is an auto one, so
  // matching on either alone quietly misses half the tables.
  const { rows: seqs } = await db.query(`
    SELECT c.relname AS tbl, a.attname AS col,
           pg_get_serial_sequence(quote_ident(c.relname), a.attname) AS seq
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
      AND pg_get_serial_sequence(quote_ident(c.relname), a.attname) IS NOT NULL
  `);
  for (const { seq, tbl, col } of seqs) {
    await db.query(
      `SELECT setval('${seq}', COALESCE((SELECT MAX("${col}") FROM "${tbl}"), 0) + 1, false)`,
    );
  }

  // Counted inside the transaction, before deciding its fate — a rehearsal that
  // reported numbers it had not actually verified would be worth nothing.
  let restored = 0;
  for (const table of backup.tables) {
    const {
      rows: [{ n }],
    } = await db.query(`SELECT count(*)::int AS n FROM "${table}"`);
    const expected = backup.data[table].length;
    if (n !== expected) throw new Error(`${table}: restored ${n} rows, backup held ${expected}`);
    restored += n;
  }

  if (commit) {
    await db.query('COMMIT');
    console.log(
      `\nRestored ${restored} rows across ${backup.tables.length} tables, ${seqs.length} sequences reset.`,
    );
  } else {
    await db.query('ROLLBACK');
    console.log(
      `\nRehearsal passed: ${restored} rows across ${backup.tables.length} tables, ` +
        `${seqs.length} sequences reset — then rolled back. The database is unchanged.`,
    );
  }
} catch (err) {
  await db.query('ROLLBACK').catch(() => {});
  console.error(`\nRestore failed, nothing was changed: ${err.message}`);
  process.exitCode = 1;
} finally {
  db.release();
  await pool.end();
}
