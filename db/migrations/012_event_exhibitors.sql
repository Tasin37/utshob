CREATE TABLE IF NOT EXISTS event_exhibitors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 160),
  description TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  website_url TEXT,
  booth_label TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS event_exhibitors_event_order_idx
  ON event_exhibitors(event_id, sort_order, created_at);
