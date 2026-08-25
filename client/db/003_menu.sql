-- ═══════════════════════════════════════════════════════════════════
-- 003 · Menu
--
-- The menu becomes editable data rather than a compiled constant. Until now
-- a price change needed a code deploy.
--
-- dietary, provenance and media are JSONB rather than side tables. They are
-- always read together with their dish and never queried across dishes, so
-- normalising them would buy nothing and cost four joins on the hottest
-- read in the app. ingredients is a text[] for the same reason.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  tagline     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  thumbnails  TEXT[] NOT NULL DEFAULT '{}',
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  -- Stations that exist as a kitchen but are not their own rail section.
  is_public   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS courses (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dishes (
  id               TEXT PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  long_description TEXT,

  station_id       TEXT NOT NULL REFERENCES stations(id),
  course_id        TEXT NOT NULL REFERENCES courses(id),

  -- Cents, so money is never a float.
  price_cents      INTEGER NOT NULL CHECK (price_cents >= 0),
  price_note       TEXT,

  ingredients      TEXT[]  NOT NULL DEFAULT '{}',
  dietary          JSONB   NOT NULL DEFAULT '{}'::jsonb,
  provenance       JSONB   NOT NULL DEFAULT '[]'::jsonb,
  media            JSONB   NOT NULL DEFAULT '{}'::jsonb,

  is_signature     BOOLEAN NOT NULL DEFAULT FALSE,
  motion_signature TEXT,
  paired_drink_id  TEXT REFERENCES dishes(id) ON DELETE SET NULL,

  -- Availability must never depend on a build: a sold-out dish showing as
  -- available is a service problem, so this is read live.
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  pickup_eligible  BOOLEAN NOT NULL DEFAULT FALSE,
  is_shared        BOOLEAN NOT NULL DEFAULT FALSE,

  sort_order       SMALLINT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dishes_listing_idx
  ON dishes (course_id, sort_order) WHERE is_available;
CREATE INDEX IF NOT EXISTS dishes_station_idx ON dishes (station_id);
CREATE INDEX IF NOT EXISTS dishes_signature_idx ON dishes (sort_order) WHERE is_signature;

-- Free-text search over name and description. array_to_string is only STABLE,
-- so ingredients cannot join this expression; they get their own array index
-- and are searched by containment instead.
CREATE INDEX IF NOT EXISTS dishes_search_idx ON dishes
  USING GIN (to_tsvector('english', name || ' ' || description));

CREATE INDEX IF NOT EXISTS dishes_ingredients_idx ON dishes USING GIN (ingredients);

DROP TRIGGER IF EXISTS dishes_touch ON dishes;
CREATE TRIGGER dishes_touch
  BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
