# Utshob — Implementation Roadmap

## Phase 0 — Foundation
1. Create Git repository.
2. Create Next.js App Router app.
3. Configure JavaScript + Tailwind.
4. Configure linting/formatting.
5. Create Supabase project.
6. Connect PostgreSQL.
7. Configure Better Auth.
8. Run Better Auth migrations.
9. Establish environment variables.
10. Configure Vercel preview/production.
11. Add base UI system.
12. Add CI.

## Phase 1 — Identity & organization
- sign up/sign in
- sessions
- profile
- organization
- members
- roles
- invitations
- permission middleware

## Phase 2 — Event core
- event CRUD
- drafts
- publish
- public event page
- event slug
- event images
- agenda
- SEO metadata

## Phase 3 — Registration & ticketing
- RSVP
- ticket tiers
- attendee questions
- capacity
- ticket issuance
- QR generation
- confirmation email
- attendee dashboard

## Phase 4 — Payments
- payment adapter
- order lifecycle
- provider integration
- webhook
- idempotency
- receipts
- refunds only after stable payment flow

## Phase 5 — Check-in & analytics
- QR scanner
- manual ticket lookup
- staff role
- check-in history
- organizer analytics
- exports

## Phase 6 — AI MVP
- event draft generator
- description optimizer
- FAQ generator
- organizer assistant
- structured outputs
- tool authorization
- AI audit
- AI evaluation suite

## Phase 7 — Growth
- discovery/search
- categories
- featured events
- promo codes
- reminders
- social sharing
- richer analytics

## Phase 8 — Advanced
- recurring events
- waitlists
- speaker management
- sponsor management
- exhibitor management
- hybrid event support
- integrations/webhooks
- recommendation engine
- advanced AI

## Suggested sprint order
Sprint 1: foundation
Sprint 2: auth/org
Sprint 3: event CRUD
Sprint 4: public event page
Sprint 5: registration
Sprint 6: tickets/QR
Sprint 7: check-in
Sprint 8: analytics
Sprint 9: payments
Sprint 10: AI
Sprint 11: security/performance
Sprint 12: production hardening

## Prioritization rule
Do not start the next domain until the previous domain has:
- database schema
- service layer
- authorization
- API/UI
- tests
- error states
- documentation
