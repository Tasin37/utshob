ALTER TABLE events ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS registrations_event_waitlist_idx
  ON registrations(event_id, created_at)
  WHERE status = 'waitlisted';
