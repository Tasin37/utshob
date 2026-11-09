# Utshob

Utshob is a full-stack event discovery and event-management platform for Bangladesh-based communities, organizers, and attendees. It lets people discover public events, register for free events, purchase paid tickets through manual bKash confirmation, and receive ticket credentials. Organizers can create and publish events, manage attendees, run check-in, invite teammates, review analytics, configure webhooks, and use audited AI assistance for event content.

The project is built as a single Next.js application. The frontend pages, authenticated dashboard, backend API routes, database access, authentication, and server-side integrations live in the same repository and deploy together to Vercel.

## Features

### Public event discovery

- Homepage event discovery with featured and recommended events.
- Homepage displays a maximum of six discovery events.
- Full `/events` directory with:
  - Search by title, category, location, date, and price.
  - Category filtering.
  - Six events per page.
  - Previous/Next pagination.
- Public event pages at `/e/[slug]`.
- Public event metadata and social sharing support.
- Calendar invite generation.
- Responsive Linen visual design with warm parchment surfaces, EB Garamond display typography, Inter interface labels, and a restrained ochre accent.

### Authentication and organizations

- Email/password authentication through Better Auth.
- Sign-up, sign-in, password reset, and session handling.
- Organization workspaces for organizers.
- Organization owner, admin, and member roles.
- Team invitations and invitation acceptance.
- Protected dashboard routes and API authorization.

### Event creation and publishing

The event wizard supports:

- Event title, summary, description, and category.
- In-person, online, and hybrid event types.
- Time zones, start/end times, recurrence, and recurrence end dates.
- Venue name and address.
- Online event links.
- RSVP or paid registration.
- Guest capacity.
- Ticket name, price, and quantity.
- Custom attendee questions.
- Event FAQs.
- Public, unlisted, and private visibility.
- Draft autosave and draft editing.
- Seven-step preview and publishing checklist.
- Cover image URL input.
- Browser image selection with type/size validation, resizing, preview, and draft persistence.
- AI-assisted event copy, description improvement, and FAQ generation.

### Registration, payments, and tickets

- Public RSVP registration.
- Capacity-aware registrations.
- Waitlist support.
- Manual bKash Send Money checkout for paid events.
- bKash transaction ID confirmation.
- Promo codes with percentage and fixed discounts.
- Order and payment status tracking.
- Ticket credentials with opaque ticket tokens and check-in values.
- Receipt generation.
- Registration and payment delivery events for webhook consumers.

### Organizer dashboard

Dashboard sections include:

- Overview and event lineup.
- Event management.
- Attendee management.
- QR/token check-in.
- Analytics.
- Team and organization management.
- Event creation and editing.

Navigation behavior:

- Desktop and tablet use the persistent sidebar.
- Mobile uses an animated hamburger drawer.
- The mobile menu supports open/close animation, a hamburger-to-cross transition, backdrop dismissal, Escape-key dismissal, and close-on-navigation.

### Analytics and AI assistance

Organizer analytics include:

- Registrations.
- Tickets issued.
- Check-ins.
- Attendance rate.
- Paid orders.
- Revenue.
- Average order value.
- Sell-through rate.
- Capacity remaining.
- Registration momentum by day.
- Ticket mix.
- Check-in trend.

AI features include:

- Event draft generation.
- Description optimization.
- FAQ generation.
- Authorized read-only analytics assistant.
- Review-only attendee announcement drafting.

AI operations:

- Run only on the server.
- Require authenticated organization authorization.
- Validate request and response data with Zod.
- Use bounded structured outputs.
- Write audit records for supported AI operations.
- Never send attendee announcements automatically.

### Event domains and integrations

Events support:

- Speakers.
- Sponsors.
- Exhibitors.
- Hybrid event details.
- Recurring events.
- Waitlists.
- Promo codes.
- Calendar exports.
- Organization-scoped webhooks.

Webhook support includes:

- Encrypted signing secrets.
- Event filters.
- HMAC-SHA256 signatures.
- Delivery records.
- Registration-created events.
- Paid-order events.
- Ticket check-in events.

## Technology stack

- Next.js `16.3.8`
- React `19.2.8`
- Better Auth `1.7.7`
- PostgreSQL through `pg`
- Zod `4.6.5`
- `qrcode.react`
- Tailwind CSS 4 and PostCSS
- JavaScript and ES modules
- Google Gemini REST API for server-side AI
- Resend-compatible email delivery
- Vercel-compatible Next.js server routes

## Project structure

```text
app/
  (account)/                 Authentication pages
  api/                       Server API routes
  dashboard/                 Protected organizer dashboard
  e/[slug]/                  Public event page
  events/                    Public event directory
  globals.css                Global design system and responsive styles
  layout.js                  Root layout, fonts, and metadata
  page.js                    Homepage data loading

components/
  analytics/                 Analytics and AI assistant UI
  auth/                      Authentication forms
  checkin/                   Check-in UI
  dashboard/                 Dashboard navigation and sign-out
  events/                    Event cards, directory, wizard, and sharing
  organizations/             Organization and team UI
  registrations/             Public registration and payment UI

lib/
  ai/                        AI providers, schemas, tools, and audit logic
  analytics/                 Analytics queries
  auth/                      Better Auth setup and authorization helpers
  db/                        PostgreSQL connection pool
  email/                     Email delivery
  events/                    Event domain, search, recommendations, and server logic
  integrations/              Webhook encryption, signing, and delivery
  payments/                  Payment validation and receipts
  promos/                    Promo-code logic
  registrations/             Registration and ticket logic

db/migrations/
  001_event_core.sql
  002_payments.sql
  003_payment_completion.sql
  004_ai_audit.sql
  005_event_faqs.sql
  006_ai_audit_event.sql
  007_promo_codes.sql
  008_event_recurrence.sql
  009_event_waitlists.sql
  010_event_speakers.sql
  011_event_sponsors.sql
  012_event_exhibitors.sql
  013_webhooks.sql

tests/                       Domain and validation tests
design.md                   Linen visual design specification
```

## Requirements

- Node.js compatible with the installed Next.js version.
- npm.
- PostgreSQL database.
- Better Auth secret of at least 32 characters.
- Optional Resend account for password reset and verification emails.
- Optional Google AI Studio API key for AI features.
- Optional production bKash merchant number.

## Local setup

### 1. Install dependencies

```powershell
npm install
```

### 2. Create local environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```powershell
Copy-Item .env.example .env.local
```

Required for account and database features:

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters
DATABASE_URL=postgresql://user:password@host:5432/database
```

Optional email configuration:

```env
EMAIL_PROVIDER=resend
EMAIL_API_KEY=replace-with-resend-key
EMAIL_FROM=Utshob <no-reply@example.com>
```

Optional AI configuration:

```env
GEMINI_API_KEY=replace-with-google-ai-key
GEMINI_MODEL=gemini-3.8-flash
```

Optional payment configuration:

```env
BKASH_MERCHANT_NUMBER=01319059266
```

For webhook delivery, also configure:

```env
WEBHOOK_ENCRYPTION_KEY=replace-with-a-long-random-secret
```

Never commit `.env.local`. Never use `NEXT_PUBLIC_*` for database credentials, authentication secrets, email keys, AI keys, payment secrets, or webhook encryption keys.

### 3. Apply database migrations

First apply the Better Auth schema using the project auth configuration:

```powershell
npx auth@latest migrate --config .\lib\auth\config.js
```

Then apply the application migrations to the same PostgreSQL database in this exact order:

```text
001_event_core.sql
002_payments.sql
003_payment_completion.sql
004_ai_audit.sql
005_event_faqs.sql
006_ai_audit_event.sql
007_promo_codes.sql
008_event_recurrence.sql
009_event_waitlists.sql
010_event_speakers.sql
011_event_sponsors.sql
012_event_exhibitors.sql
013_webhooks.sql
```

Use your database provider's SQL editor or `psql`. Review migrations before applying them to production.

### 4. Start the development server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

```powershell
npm run dev       # Start the Next.js development server
npm run build     # Create a production build
npm run start     # Start the production server
npm run lint      # Run ESLint
npm test          # Run the Node test suite
```

## API overview

### Authentication

```text
/api/auth/[...all]
```

Better Auth handles sign-up, sign-in, sessions, password reset, and authentication callbacks.

### Public APIs

```text
GET  /api/public/events/[slug]/calendar
POST /api/public/events/[slug]/register
```

These routes support calendar downloads and public event registration.

### Events

```text
GET    /api/events
POST   /api/events
GET    /api/events/[eventId]
PATCH  /api/events/[eventId]
POST   /api/events/[eventId]/publish
GET    /api/events/[eventId]/analytics
GET    /api/events/[eventId]/attendees
POST   /api/events/[eventId]/check-in
```

Additional event routes manage speakers, sponsors, exhibitors, and promo codes.

### Orders

```text
POST /api/orders
GET  /api/orders/[orderId]
POST /api/orders/[orderId]/confirm
```

Paid orders use manual bKash confirmation and issue tickets after a valid transaction ID is submitted.

### AI

```text
POST /api/ai/event-draft
POST /api/ai/description
POST /api/ai/faq
POST /api/ai/assistant
POST /api/ai/announcement
```

All AI routes require authentication and appropriate organization authorization.

### Webhooks

```text
GET    /api/integrations/webhooks
POST   /api/integrations/webhooks
PATCH  /api/integrations/webhooks/[endpointId]
DELETE /api/integrations/webhooks/[endpointId]
```

Webhook delivery is organization-scoped and signed using encrypted endpoint secrets.

## Deployment on Vercel

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Select the Next.js framework preset.
4. Use `npm run build` as the build command.
5. Add production environment variables in Vercel.
6. Create or connect a production PostgreSQL database.
7. Apply Better Auth and application migrations before using the dashboard.
8. Set `BETTER_AUTH_URL` to the final production URL.
9. Configure Resend if password reset or verification email delivery is required.
10. Configure Gemini if AI features are required.
11. Configure `WEBHOOK_ENCRYPTION_KEY` before creating webhook endpoints.
12. Configure the bKash merchant number for paid events.
13. Redeploy after changing environment variables.
14. Test public pages, authentication, registration, dashboard authorization, event creation, payments, check-in, AI, and webhooks.

Vercel runs the `app/api` routes as server-side functions, so a separate backend deployment is not required.

## Security and operational notes

- Keep all secrets server-side.
- Rotate credentials immediately if they are exposed.
- Use separate environment variables for local, preview, and production deployments.
- Use a pooled PostgreSQL connection where the provider supports it.
- Do not apply unreviewed migrations directly to production.
- AI responses are drafts and require organizer review.
- Webhook failures are recorded and should not roll back the primary event operation.
- Manual bKash payments require human verification of the submitted transaction ID.
- Configure backups and a restore process for the production database.
- Monitor Vercel function logs and database connection errors.

## Validation status

The project is validated with:

- 41 automated tests passing.
- ESLint passing with three existing `no-img-element` warnings on the public event page.
- Successful Next.js production build.
- Successful `git diff --check`.

The image warnings are performance recommendations, not build failures.

## Design system

The visual language is defined in [`design.md`](./design.md):

- Primary ink: `#2A2420`
- Secondary text and borders: `#7A6E64`
- Interaction accent: `#A47D4E`
- Foundation neutral: `#EEE7D9`
- Surface: `#F7F1E3`
- Display font: EB Garamond
- Interface font: Inter

The design intentionally uses warm negative space, tactile card surfaces, restrained borders, and a single accent color for primary actions.

## License

This repository does not currently declare a license. Add an appropriate license file before distributing the project publicly.
