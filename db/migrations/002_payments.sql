CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id TEXT REFERENCES registrations(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_reference TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_event_status_idx ON orders(event_id, status);
CREATE INDEX IF NOT EXISTS orders_idempotency_key_idx ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS orders_registration_idx ON orders(registration_id);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_ticket_type_idx ON order_items(ticket_type_id);
