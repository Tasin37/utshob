ALTER TABLE ai_audit_logs
  ADD COLUMN IF NOT EXISTS event_id TEXT REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ai_audit_logs_event_created_idx
  ON ai_audit_logs(event_id, created_at DESC);
