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

# AI
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=

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
3. Set `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, and `EMAIL_FROM` to enable password reset and team invitations. Email delivery is optional for signup/sign-in. For local testing without a domain, Resend's `onboarding@resend.dev` sender can deliver only to the email associated with your Resend account.
4. Apply the Better Auth tables with `npx auth@latest migrate --config ./lib/auth/config.js`.
5. Apply `db/migrations/001_event_core.sql` to the same database using the Supabase SQL editor or `psql`.

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
