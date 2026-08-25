-- ═══════════════════════════════════════════════════════════════════
-- 002 · Enquiries
--
-- Contact-form submissions. Stored as well as emailed, so an enquiry is not
-- lost if mail delivery fails — the same reasoning as reservations, where the
-- database is the record and email is a notification.
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE enquiry_status AS ENUM ('new', 'read', 'answered', 'spam', 'archived');

CREATE TABLE IF NOT EXISTS enquiries (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT 'General enquiry',
  message     TEXT NOT NULL,

  status      enquiry_status NOT NULL DEFAULT 'new',
  -- Kept for abuse handling and to answer "did this actually arrive".
  ip          TEXT,
  user_agent  TEXT,
  -- Why the spam heuristics rejected it, when they did.
  spam_reason TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The admin queue reads newest-first, filtered by status.
CREATE INDEX IF NOT EXISTS enquiries_queue_idx
  ON enquiries (status, created_at DESC);

-- Throttling and duplicate detection both look up by sender.
CREATE INDEX IF NOT EXISTS enquiries_email_idx
  ON enquiries (lower(email), created_at DESC);
