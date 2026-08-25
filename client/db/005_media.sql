-- ═══════════════════════════════════════════════════════════════════
-- 005 · Media
--
-- Uploaded images and the derivatives generated from them. One row per
-- original; the variants it produced live in JSONB because they are always
-- read as a set and never queried individually.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS media (
  id            TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  mime          TEXT NOT NULL,
  bytes         INTEGER NOT NULL,
  width         INTEGER NOT NULL,
  height        INTEGER NOT NULL,

  -- { avif: {400: url, ...}, webp: {...}, jpeg: {...} }
  variants      JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- 24px base64 placeholder, inlined by <Picture> before the real file lands.
  lqip          TEXT NOT NULL DEFAULT '',

  alt           TEXT NOT NULL DEFAULT '',
  uploaded_by   BIGINT REFERENCES admins(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_recent_idx ON media (created_at DESC);
