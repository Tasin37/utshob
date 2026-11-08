CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feature TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed')),
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_audit_logs_organization_created_idx
  ON ai_audit_logs(organization_id, created_at DESC);
