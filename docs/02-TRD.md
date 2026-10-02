# Utshob — Technical Requirements Document (TRD)

## 1. Architecture decision
Use a modular monolith first.

### Runtime
Next.js App Router with React and JavaScript.

Next.js is a full-stack React framework and the App Router is the current router supporting modern React server features. citeturn0search4

### Data
Supabase PostgreSQL is the system of record.

### Authentication
Better Auth owns:
- users
- sessions
- accounts
- verification
- organization membership where configured

Better Auth supports PostgreSQL adapters and migrations. citeturn1search2turn1search7

### Important boundary
Do NOT enable Supabase Auth as a second application authentication system in MVP.

Use:
Better Auth → application session → Next.js server authorization → PostgreSQL.

Supabase is used for Postgres, Storage and optionally Realtime.

## 2. Recommended repository
```text
utshob/
├─ app/
│  ├─ (marketing)/
│  ├─ (auth)/
│  ├─ dashboard/
│  ├─ events/
│  ├─ e/
│  └─ api/
├─ components/
├─ features/
│  ├─ auth/
│  ├─ organizations/
│  ├─ events/
│  ├─ registrations/
│  ├─ tickets/
│  ├─ checkin/
│  ├─ notifications/
│  ├─ analytics/
│  └─ ai/
├─ lib/
│  ├─ auth/
│  ├─ db/
│  ├─ permissions/
│  ├─ payments/
│  ├─ notifications/
│  ├─ ai/
│  └─ validation/
├─ db/
│  ├─ migrations/
│  └─ seeds/
├─ tests/
├─ public/
├─ docs/
└─ package.json
```

## 3. Application layers
### UI layer
React components, forms, tables, dashboards.

### Feature layer
Business-oriented modules.

### Service layer
Use cases such as:
- createEvent
- publishEvent
- registerAttendee
- issueTicket
- checkInTicket
- createPaymentOrder
- generateEventDraft

### Repository/data layer
Database queries and transactions.

### Adapter layer
External providers:
- AI
- payment
- email
- SMS
- maps
- analytics

Never scatter vendor SDK calls across UI components.

## 4. Server/client rule
Default to Server Components.

Use Client Components only for:
- interactive forms
- scanners
- charts needing browser interaction
- local UI state
- realtime subscriptions

All sensitive mutations execute on the server.

## 5. Validation
Use a schema validation library such as Zod.

Validate:
- request body
- URL params
- search params
- AI tool arguments
- webhook payloads
- imported CSV data

## 6. Authorization
Authorization must be checked server-side.

Pattern:
```text
request
→ authenticate session
→ identify organization/event
→ check permission
→ validate input
→ execute transaction
→ audit sensitive action
→ return response
```

Never trust:
- user_id from browser
- organization_id from browser
- role from browser
- event ownership from browser
- ticket status from browser

## 7. Database
Use UUID/text IDs consistently.

Use:
- foreign keys
- unique constraints
- check constraints where practical
- indexes for lookup paths
- transactions for registration/payment/check-in
- timestamps in UTC
- event timezone stored separately

## 8. Storage
Use Supabase Storage for:
- event cover images
- organization logos
- optional attendee assets

Storage access should use explicit policies. Supabase Storage is designed to work with Postgres RLS policies. citeturn1search3

## 9. RLS decision
Because Better Auth is the application identity provider, do not assume Supabase's `auth.uid()` represents the Better Auth user.

Preferred MVP:
- do not expose direct privileged database operations to the browser
- use server-side database access
- enforce application authorization
- add database-level RLS where a reliable identity propagation design exists

Supabase recommends enabling RLS on exposed schemas/tables and using policies for granular authorization. citeturn1search4

## 10. Concurrency requirements
Registration capacity:
- transaction
- lock or atomic conditional update
- unique constraints
- idempotency key

Check-in:
- unique ticket/event check-in constraint
- transaction
- return already_checked_in state instead of double inserting

## 11. Performance
Targets for MVP:
- public event page LCP target < 2.5s on a reasonable mobile connection
- API p95 target < 500ms for ordinary CRUD excluding external providers
- check-in verification target < 500ms excluding network latency
- paginated attendee lists
- indexed filters
- avoid N+1 queries

## 12. Deployment
Vercel:
- Preview for pull requests
- Production for main/release
- environment-specific secrets

Vercel documents Local, Preview and Production environments and supports separate environment variables. citeturn1search13turn1search5

## 13. Observability
Track:
- request ID
- user ID where permitted
- organization ID
- event ID
- operation name
- duration
- success/failure
- provider request IDs where safe

Do not log passwords, session tokens, payment secrets or full sensitive attendee data.

## 14. Dependency rules
- Keep packages minimal.
- Pin or lock versions.
- Review major upgrades before applying.
- Never let AI coding agents add dependencies without documenting why.
