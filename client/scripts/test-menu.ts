import 'dotenv/config';
import menuHandler from '../api/menu.ts';
import { DISHES, STATIONS, COURSES } from '../src/data/menu.ts';

const res = await menuHandler(new Request('http://localhost/api/menu'));
const api = await res.json() as any;
console.log(`GET /api/menu -> ${res.status}, cache: ${res.headers.get('cache-control')}`);
console.log(`stations ${api.stations.length} | courses ${api.courses.length} | dishes ${api.dishes.length}\n`);

// The whole design rests on the API payload being indistinguishable from the
// bundled constant, so compare them field by field.
// Deep key-sorted compare: Postgres JSONB does not preserve key order, so
// ordering differences inside dietary/media are not data differences.
const norm = (v: any): string => {
  if (Array.isArray(v)) return `[${v.map(norm).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${k}:${norm(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
};
let mismatch = 0;
for (const local of DISHES) {
  const remote = api.dishes.find((x: any) => x.id === local.id);
  if (!remote) { console.log(`MISSING ${local.slug}`); mismatch++; continue; }
  if (norm(local) !== norm(remote)) {
    mismatch++;
    if (mismatch <= 3) {
      const lk = Object.keys(local as any), rk = Object.keys(remote);
      const diff = [...new Set([...lk, ...rk])].filter(
        (k) => JSON.stringify((local as any)[k]) !== JSON.stringify(remote[k]));
      console.log(`DIFF ${local.slug}: ${diff.join(', ')}`);
      diff.forEach(k => console.log(`   ${k}\n     bundle: ${JSON.stringify((local as any)[k])}\n     api:    ${JSON.stringify(remote[k])}`));
    }
  }
}
console.log(`dish parity: ${DISHES.length - mismatch}/${DISHES.length} identical`);

const sm = STATIONS.filter(s => !api.stations.find((x: any) => x.id === s.id && x.name === s.name)).length;
const cm = COURSES.filter(c => !api.courses.find((x: any) => x.id === c.id && x.name === c.name)).length;
console.log(`stations parity: ${STATIONS.length - sm}/${STATIONS.length}`);
console.log(`courses parity:  ${COURSES.length - cm}/${COURSES.length}`);

const bad = await menuHandler(new Request('http://localhost/api/menu', { method: 'POST' }));
console.log(`\nPOST -> ${bad.status}`);
