import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const r = await sql`select version(), current_database() as db`;
console.log('connected to:', r[0].db);
console.log('postgres    :', r[0].version.split(',')[0]);
const t = await sql`select tablename from pg_tables where schemaname='public' order by tablename`;
console.log('existing public tables:', t.length ? t.map(x=>x.tablename).join(', ') : '(none)');
