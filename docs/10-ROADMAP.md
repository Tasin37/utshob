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
- manual bKash payment flow
- order lifecycle
- bKash merchant number configuration
- transaction ID confirmation
- idempotency
- receipts
- organizer payment verification and refunds

## Phase 5 — Check-in & analytics
- QR scanner
- manual ticket lookup
- staff role
- check-in history
- organizer analytics
- exports

## Phase 6 — AI MVP
- event draft generator (started: protected, structured, audited wizard flow using configurable free-tier Gemini access)
- description optimizer (started: protected, structured, audited wizard action)
- FAQ generator (started: protected, structured, audited Questions-step action with reviewed persistence and public display)
- organizer assistant (started: protected live-data Q&A in analytics)
- structured outputs (complete for event, description, FAQ, and assistant flows)
- tool authorization (complete for the read-only analytics assistant tool)
- AI audit (complete for generation, optimizer, FAQ, and assistant requests)
- AI evaluation suite (started: deterministic local regression cases for schemas, limits, and untrusted input)

## Phase 7 — Growth
- discovery/search
- categories
- featured events (complete: nearest upcoming public events are highlighted on the homepage)
- promo codes (complete: organizer API, checkout validation, fixed/percentage discounts, usage limits)
- reminders (complete: public events provide downloadable calendar reminders)
- social sharing (complete: Web Share API with clipboard fallback and social metadata)
- richer analytics (complete: revenue, order value, sell-through, attendance, trends, and ticket mix)

## Phase 8 — Advanced
- recurring events (started: validated weekly/monthly recurrence metadata is stored and shown on public pages)
- waitlists (started: full RSVP events can accept waitlisted registrations)
- speaker management (started: organizer API and public speaker profiles)
- sponsor management (started: organizer API and public sponsor profiles)
- exhibitor management (complete: protected organizer API, migration, validation, and public exhibitor profiles)
- hybrid event support (complete: organizer preview/checklist, public venue and online access display, and combined calendar location)
- integrations/webhooks (complete: organization-scoped endpoints, encrypted signing secrets, event filters, delivery records, signed delivery service, and registration/payment/check-in event wiring)
- recommendation engine (complete: deterministic upcoming-event ranking using category, event type, and location similarity)
- advanced AI (complete: audited, authorized attendee-announcement drafting with structured reviewable output)

## Suggested sprint order
Sprint 1: foundation
Sprint 2: auth/org
Sprint 3: event CRUD
Sprint 4: public event page
Sprint 5: registration
Sprint 6: tickets/QR
Sprint 7: check-in
Sprint 8: analytics
Sprint 9: manual bKash payments
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
