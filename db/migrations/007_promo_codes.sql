CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, code),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CHECK (discount_type <> 'percent' OR discount_value <= 100)
);

CREATE INDEX IF NOT EXISTS promo_codes_event_active_idx ON promo_codes(event_id, active);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id TEXT REFERENCES promo_codes(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_minor INTEGER NOT NULL DEFAULT 0 CHECK (discount_minor >= 0);

CREATE INDEX IF NOT EXISTS orders_promo_code_idx ON orders(promo_code_id);
