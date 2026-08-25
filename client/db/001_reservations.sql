-- ═══════════════════════════════════════════════════════════════════
-- 001 · Reservations
--
-- Mirrors the domain model already declared in src/types/index.ts, so the
-- shapes the frontend types against and the shapes the database stores are
-- the same thing rather than two drifting definitions.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seating_areas (
  id          TEXT PRIMARY KEY,
  name        TEXT        NOT NULL,
  note        TEXT        NOT NULL DEFAULT '',
  min_party   SMALLINT    NOT NULL CHECK (min_party >= 1),
  max_party   SMALLINT    NOT NULL CHECK (max_party >= min_party),
  -- Covers that may be seated in this area in one time slot.
  capacity    SMALLINT    NOT NULL CHECK (capacity > 0),
  image       TEXT        NOT NULL DEFAULT '',
  sort_order  SMALLINT    NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE
);

-- One row per weekday. day_of_week follows Postgres EXTRACT(DOW): 0 = Sunday.
-- A NULL opens_at means closed that day.
CREATE TABLE IF NOT EXISTS opening_hours (
  day_of_week SMALLINT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
  label       TEXT     NOT NULL,
  opens_at    TIME,
  closes_at   TIME,
  CHECK ((opens_at IS NULL) = (closes_at IS NULL))
);

-- Holiday closures and one-off private events, which override opening_hours.
CREATE TABLE IF NOT EXISTS closures (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  on_date  DATE NOT NULL UNIQUE,
  reason   TEXT NOT NULL DEFAULT 'Closed'
);

CREATE TYPE reservation_status AS ENUM (
  'pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'
);

CREATE TABLE IF NOT EXISTS reservations (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Guest-facing code, e.g. MH-4K2P. Unique so it can be looked up alone.
  reference           TEXT        NOT NULL UNIQUE,
  on_date             DATE        NOT NULL,
  at_time             TIME        NOT NULL,
  party_size          SMALLINT    NOT NULL CHECK (party_size BETWEEN 1 AND 24),
  seating_area_id     TEXT        NOT NULL REFERENCES seating_areas(id),

  guest_name          TEXT        NOT NULL,
  guest_email         TEXT        NOT NULL,
  guest_phone         TEXT        NOT NULL,

  occasion            TEXT        NOT NULL DEFAULT '',
  -- Treated as health information; see the privacy page.
  dietary_notes       TEXT        NOT NULL DEFAULT '',
  accessibility_notes TEXT        NOT NULL DEFAULT '',

  status              reservation_status NOT NULL DEFAULT 'confirmed',
  internal_notes      TEXT        NOT NULL DEFAULT '',
  table_assignment    TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Availability is always queried as "what is booked for this date, area and
-- slot", so that is the index.
CREATE INDEX IF NOT EXISTS reservations_slot_idx
  ON reservations (on_date, seating_area_id, at_time)
  WHERE status IN ('pending', 'confirmed', 'seated');

CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations (on_date);

-- A guest cannot hold two bookings for the same slot with the same email.
CREATE UNIQUE INDEX IF NOT EXISTS reservations_no_double_book_idx
  ON reservations (on_date, at_time, lower(guest_email))
  WHERE status IN ('pending', 'confirmed');

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reservations_touch ON reservations;
CREATE TRIGGER reservations_touch
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
