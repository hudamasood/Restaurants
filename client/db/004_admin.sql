-- ═══════════════════════════════════════════════════════════════════
-- 004 · Admin accounts
--
-- Staff logins only. There are no public accounts: guests book by reference
-- code, which avoids an entire surface area — password reset, session
-- management, deletion requests — for no benefit at this scale.
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE admin_role AS ENUM ('owner', 'manager', 'staff');

CREATE TABLE IF NOT EXISTS admins (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  -- PBKDF2-SHA256, stored as iterations:salt:hash. Chosen over bcrypt so
  -- there is no native dependency to build on a serverless runtime.
  password_hash TEXT NOT NULL,
  role          admin_role NOT NULL DEFAULT 'staff',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,

  -- Brute-force throttling, tracked per account rather than per IP so it
  -- survives an attacker rotating addresses.
  failed_logins SMALLINT NOT NULL DEFAULT 0,
  locked_until  TIMESTAMPTZ,

  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admins_email_idx ON admins (lower(email));

DROP TRIGGER IF EXISTS admins_touch ON admins;
CREATE TRIGGER admins_touch
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- An append-only trail of what staff changed. Menu edits and status changes
-- are the kind of thing someone will later need to account for.
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id   BIGINT REFERENCES admins(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  detail     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_recent_idx ON audit_log (created_at DESC);
