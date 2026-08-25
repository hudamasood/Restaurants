import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const dir = new URL('../db/', import.meta.url).pathname;

/**
 * Split SQL into statements. Neon's HTTP driver takes one statement per call.
 * Walks the text so that semicolons inside line comments, single-quoted
 * strings and $$-quoted function bodies are not treated as terminators.
 */
function splitStatements(text) {
  const out = [];
  let buf = '';
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);

    // -- line comment: drop to end of line
    if (rest.startsWith('--')) {
      const nl = text.indexOf('\n', i);
      i = nl === -1 ? text.length : nl + 1;
      continue;
    }
    // $tag$ ... $tag$ dollar-quoted block: copy verbatim
    const dollar = /^\$([A-Za-z_]*)\$/.exec(rest);
    if (dollar) {
      const tag = dollar[0];
      const end = text.indexOf(tag, i + tag.length);
      const stop = end === -1 ? text.length : end + tag.length;
      buf += text.slice(i, stop);
      i = stop;
      continue;
    }
    // '...' string literal: copy verbatim, handling '' escapes
    if (rest[0] === "'") {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === "'" && text[j + 1] === "'") { j += 2; continue; }
        if (text[j] === "'") { j += 1; break; }
        j += 1;
      }
      buf += text.slice(i, j);
      i = j;
      continue;
    }
    if (rest[0] === ';') { out.push(buf); buf = ''; i += 1; continue; }
    buf += text[i];
    i += 1;
  }
  if (buf.trim()) out.push(buf);
  return out.map(s => s.trim()).filter(Boolean);
}

await sql`CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;
const done = new Set((await sql`SELECT name FROM _migrations`).map(r => r.name));

for (const file of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
  if (done.has(file)) { console.log('skip   ', file); continue; }
  const stmts = splitStatements(readFileSync(join(dir, file), 'utf8'));
  try {
    for (const s of stmts) await sql.query(s);
    await sql`INSERT INTO _migrations (name) VALUES (${file})`;
    console.log('applied', file, `(${stmts.length} statements)`);
  } catch (e) {
    console.error('FAILED ', file, '\n  ', e.message);
    process.exit(1);
  }
}
const t = await sql`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
console.log('\ntables now:', t.map(x => x.tablename).join(', '));
