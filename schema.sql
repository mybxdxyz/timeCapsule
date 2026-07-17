-- Run this once against your Netlify Database (Neon Postgres),
-- e.g. via `netlify db shell` or any Postgres client using the connection string.

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deliver_at  TIMESTAMPTZ NOT NULL,
  sent        BOOLEAN NOT NULL DEFAULT false,
  sent_at     TIMESTAMPTZ
);

-- Speeds up the "what's due" query the scheduled function runs daily.
CREATE INDEX IF NOT EXISTS idx_messages_due
  ON messages (deliver_at)
  WHERE sent = false;
