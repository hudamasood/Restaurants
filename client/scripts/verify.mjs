import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const cols = await sql`
  SELECT table_name, column_name, data_type, is_nullable
  FROM information_schema.columns WHERE table_schema='public'
    AND table_name IN ('reservations','seating_areas','opening_hours','closures')
  ORDER BY table_name, ordinal_position`;
let cur='';
for (const c of cols) {
  if (c.table_name!==cur) { cur=c.table_name; console.log(`\n${cur}`); }
  console.log(`   ${c.column_name.padEnd(22)} ${c.data_type}${c.is_nullable==='NO'?' NOT NULL':''}`);
}
const idx = await sql`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='reservations' ORDER BY indexname`;
console.log('\nreservations indexes:'); idx.forEach(i=>console.log('   ',i.indexname));
const e = await sql`SELECT enumlabel FROM pg_enum JOIN pg_type t ON t.oid=enumtypid WHERE typname='reservation_status' ORDER BY enumsortorder`;
console.log('\nreservation_status:', e.map(x=>x.enumlabel).join(' | '));
