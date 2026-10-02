CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Community',
  event_type TEXT NOT NULL DEFAULT 'in_person' CHECK (event_type IN ('in_person', 'online', 'hybrid')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed', 'archived')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  venue_name TEXT NOT NULL DEFAULT '',
  venue_address TEXT NOT NULL DEFAULT '',
  online_url TEXT,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  cover_image_url TEXT,
  registration_mode TEXT NOT NULL DEFAULT 'rsvp' CHECK (registration_mode IN ('rsvp', 'paid')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS events_organization_status_idx ON events(organization_id, status, starts_at);
CREATE INDEX IF NOT EXISTS events_public_listing_idx ON events(starts_at) WHERE status = 'published' AND visibility = 'public';

CREATE TABLE IF NOT EXISTS ticket_types (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BDT',
  quantity INTEGER CHECK (quantity IS NULL OR quantity > 0),
  sales_start TIMESTAMPTZ,
  sales_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_types_event_status_idx ON ticket_types(event_id, status);

CREATE TABLE IF NOT EXISTS event_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'email', 'phone', 'select', 'checkbox')),
  required BOOLEAN NOT NULL DEFAULT false,
  options_json JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, field_key)
);