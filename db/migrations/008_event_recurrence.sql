ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT NOT NULL DEFAULT 'none'
  CHECK (recurrence_frequency IN ('none', 'weekly', 'monthly'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER NOT NULL DEFAULT 1
  CHECK (recurrence_interval BETWEEN 1 AND 12);
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS events_recurrence_idx
  ON events(recurrence_frequency, recurrence_until)
  WHERE recurrence_frequency <> 'none';
