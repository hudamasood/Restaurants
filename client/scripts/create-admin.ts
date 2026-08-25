import 'dotenv/config';
import { sql } from '../api/_lib/db.ts';
import { hashPassword } from '../api/_lib/auth.ts';

const [email, name, password, role = 'owner'] = process.argv.slice(2);
if (!email || !name || !password) {
  console.error('usage: create-admin <email> <name> <password> [owner|manager|staff]');
  process.exit(1);
}
if (password.length < 12) {
  console.error('password must be at least 12 characters');
  process.exit(1);
}

const hash = await hashPassword(password);
const [row] = (await sql`
  INSERT INTO admins (email, name, password_hash, role)
  VALUES (${email.toLowerCase()}, ${name}, ${hash}, ${role}::admin_role)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name, password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role, is_active = TRUE, failed_logins = 0, locked_until = NULL
  RETURNING id, email, name, role
`) as any[];
console.log(`admin ready: ${row.email} (${row.name}, ${row.role})`);
