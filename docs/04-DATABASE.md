# Utshob — Database Specification

## 1. Identity tables
Better Auth-managed:
- user
- session
- account
- verification

Do not duplicate authentication credentials in application tables.

## 2. Application tables

### organizations
- id UUID PK
- name TEXT NOT NULL
- slug TEXT UNIQUE NOT NULL
- description TEXT
- logo_url TEXT
- website_url TEXT
- created_by UUID
- created_at
- updated_at

### organization_members
- id UUID PK
- organization_id FK
- user_id FK
- role TEXT
- created_at
- unique(organization_id, user_id)

### organization_invitations
- id UUID PK
- organization_id FK
- email
- role
- token_hash
- expires_at
- accepted_at
- invited_by
- created_at

### events
- id UUID PK
- organization_id FK
- created_by UUID
- title
- slug
- summary
- description
- category
- event_type
- visibility
- status
- timezone
- starts_at
- ends_at
- venue_name
- venue_address
- venue_lat
- venue_lng
- online_url
- capacity
- cover_image_url
- published_at
- created_at
- updated_at
- unique(slug)

### event_agenda_items
- id UUID PK
- event_id FK
- title
- description
- starts_at
- ends_at
- speaker_name
- location
- sort_order
- created_at

### ticket_types
- id UUID PK
- event_id FK
- name
- description
- price_minor INTEGER
- currency CHAR(3)
- quantity
- sales_start
- sales_end
- status
- created_at
- updated_at

### promo_codes
- id UUID PK
- event_id FK
- code
- discount_type
- discount_value
- max_uses
- used_count
- starts_at
- ends_at
- active
- unique(event_id, code)

### registrations
- id UUID PK
- event_id FK
- user_id nullable
- email
- full_name
- phone nullable
- status
- source
- created_at
- updated_at

### registration_answers
- id UUID PK
- registration_id FK
- question_key
- answer_json
- created_at

### orders
- id UUID PK
- event_id FK
- registration_id FK
- user_id nullable
- amount_minor
- currency
- status
- provider
- provider_reference
- idempotency_key UNIQUE
- created_at
- updated_at

### order_items
- id UUID PK
- order_id FK
- ticket_type_id FK
- quantity
- unit_price_minor
- total_minor

### tickets
- id UUID PK
- event_id FK
- registration_id FK
- ticket_type_id FK
- ticket_number
- qr_token_hash
- status
- issued_at
- cancelled_at
- unique(ticket_number)
- unique(qr_token_hash)

### checkins
- id UUID PK
- event_id FK
- ticket_id FK
- checked_in_by UUID
- checked_in_at
- method
- unique(ticket_id)

### event_questions
- id UUID PK
- event_id FK
- label
- field_key
- field_type
- required
- options_json
- sort_order

### notifications
- id UUID PK
- user_id nullable
- event_id nullable
- channel
- type
- status
- recipient
- provider_message_id
- sent_at
- failure_reason
- created_at

### audit_logs
- id UUID PK
- actor_user_id nullable
- organization_id nullable
- event_id nullable
- action
- entity_type
- entity_id
- metadata_json
- ip_hash nullable
- created_at

### ai_generations
- id UUID PK
- user_id
- organization_id nullable
- event_id nullable
- feature
- model
- input_hash
- output_json
- status
- created_at

## 3. Indexes
Minimum:
- events(slug)
- events(organization_id, status)
- events(starts_at)
- registrations(event_id, created_at)
- registrations(event_id, status)
- tickets(event_id, status)
- tickets(qr_token_hash)
- checkins(event_id, checked_in_at)
- orders(event_id, status)
- notifications(status, created_at)
- audit_logs(event_id, created_at)

## 4. Money
Never store monetary values as floating point.

Use integer minor units:
`1000` = 10.00 for a currency with two decimal places.

Store currency explicitly.

## 5. Time
Store timestamps in UTC.
Store event timezone as IANA timezone, e.g. `Asia/Dhaka`.

Render localized times at the UI layer.

## 6. Capacity
Capacity should be enforced by database transaction/constraint logic, not only UI validation.

## 7. Soft deletion
Prefer status/archive fields for important business records instead of physical deletion.

Hard delete only where legally/business appropriate.

## 8. Migration rule
Every schema change must be a migration committed to version control.

Never ask an AI agent to modify production schema manually without a migration.
