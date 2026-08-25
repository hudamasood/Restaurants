import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Next Friday (open 12:00) and next Monday (closed).
const d = new Date();
const nextDow = (target) => { const x=new Date(d); x.setDate(x.getDate()+((target-x.getDay()+7)%7||7)); return x.toISOString().slice(0,10); };
const FRI = nextDow(5), MON = nextDow(1);
console.log('test dates -> Friday:', FRI, '| Monday:', MON, '\n');

const { getAvailability, areaHasRoom } = await import('../api/_lib/availability.ts').catch(async () => {
  // plain node cannot import .ts; inline the queries instead
  return {};
});
