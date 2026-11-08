ALTER TABLE registrations
  DROP CONSTRAINT IF EXISTS registrations_status_check;

ALTER TABLE registrations
  ADD CONSTRAINT registrations_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlisted'));

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS ticket_type_id TEXT REFERENCES ticket_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tickets_ticket_type_idx ON tickets(ticket_type_id);
