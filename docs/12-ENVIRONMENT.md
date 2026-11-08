# Utshob — Environment & Deployment

## Local
Create `.env.local` and never commit it.

Example variable categories:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database / Better Auth PostgreSQL
DATABASE_URL=

# AI - Google AI Studio free tier (server-only)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

# Email
EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM=

# Payments
PAYMENT_PROVIDER=
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
```

## Important
Use only the variables actually required by the selected libraries and providers.

Do not expose:
- database passwords
- Better Auth secrets
- service-role keys
- AI provider secret keys
- payment secrets
- webhook secrets

`NEXT_PUBLIC_*` variables are intentionally browser-visible and must never contain secrets.

## Identity and event setup
The organizer account and event flows require a PostgreSQL database and Better Auth secret.

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to the Supabase PostgreSQL connection string.
2. Generate a secret of at least 32 characters for `BETTER_AUTH_SECRET` and set `BETTER_AUTH_URL` to the local or deployed app URL.
3. Set `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, and `EMAIL_FROM` to enable password reset emails. Team invitations are delivered inside the Team screen and do not send email. Email delivery is optional for signup/sign-in.
4. Apply the Better Auth tables with `npx auth@latest migrate --config ./lib/auth/config.js`.
5. Apply `db/migrations/001_event_core.sql` to the same database using the Supabase SQL editor or `psql`.
6. Apply `db/migrations/002_payments.sql` and `db/migrations/003_payment_completion.sql` in order.
7. Apply `db/migrations/004_ai_audit.sql` for the Phase 6 AI audit log.
8. Apply `db/migrations/005_event_faqs.sql` for reviewed event FAQs.
9. Apply `db/migrations/006_ai_audit_event.sql` for event-scoped assistant audit records.
10. Apply `db/migrations/007_promo_codes.sql` for promo codes and discounted orders.
11. Apply `db/migrations/008_event_recurrence.sql` for recurring event settings.
12. Apply `db/migrations/009_event_waitlists.sql` for RSVP waitlist support.
13. Apply `db/migrations/010_event_speakers.sql` for event speaker profiles.
14. Apply `db/migrations/011_event_sponsors.sql` for event sponsor profiles.
15. Apply `db/migrations/012_event_exhibitors.sql` for event exhibitor profiles.
16. Apply `db/migrations/013_webhooks.sql` for organization webhook endpoints and delivery records.
8. Set `BKASH_MERCHANT_NUMBER` for manual bKash checkout. It defaults to `01319059266`.
9. Create a Google AI Studio API key and set `GEMINI_API_KEY` on the server to enable the event draft generator. `GEMINI_MODEL` defaults to `gemini-3.8-flash`. Google may apply free-tier quotas and rate limits.
10. Set `WEBHOOK_ENCRYPTION_KEY` to a long random server-only secret before enabling webhook delivery.

Paid checkout currently uses bKash Send Money. The attendee submits the bKash transaction ID after payment, and the order is confirmed with a ticket.

Never use production credentials for local development. The app reports missing auth/database settings on account pages and does not create local-only accounts.

## Vercel
Configure separate variables for:
- Preview
- Production

Vercel provides separate deployment environments and environment-specific variables. citeturn1search13turn1search5

## Deployment checklist
- production database connected
- migrations applied
- auth callback URLs correct
- cookie domain/secure settings verified
- public app URL configured
- payment webhooks configured
- email sender verified
- storage policies verified
- rate limits enabled
- monitoring enabled
- backups/restore process tested

## Database rule
Never run an unreviewed production migration directly from an AI agent.

Generate migration → review → test → apply.
