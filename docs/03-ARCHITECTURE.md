# Utshob — System Architecture

## 1. High-level architecture
```text
Browser
  |
  v
Vercel / Next.js
  |
  +--> Better Auth
  |       |
  |       +--> Supabase PostgreSQL
  |
  +--> Utshob service layer
  |       |
  |       +--> Supabase PostgreSQL
  |       +--> Supabase Storage
  |       +--> AI provider
  |       +--> Payment provider
  |       +--> Email/SMS provider
  |
  +--> Public event pages
```

## 2. Domain modules
- Identity
- Organizations
- Events
- Event agenda
- Tickets
- Registrations
- Orders/payments
- Check-in
- Notifications
- Analytics
- AI
- Audit
- Admin

## 3. Request flow: protected mutation
```text
POST /api/events
→ Better Auth session
→ authorize organization permission
→ validate input
→ service.createEvent()
→ database transaction
→ audit log
→ response
```

## 4. Registration flow
```text
Public event page
→ registration form
→ server validation
→ capacity transaction
→ registration created
→ ticket/order created
→ payment if needed
→ confirmation
→ notification job
```

For paid events, never mark a ticket as paid solely because a browser says payment succeeded. Confirm using the payment provider's server-side result/webhook.

## 5. Check-in flow
```text
Scanner
→ POST /api/check-in
→ authenticate staff
→ verify event permission
→ hash/resolve QR token
→ transaction
→ create check-in
→ return status
```

## 6. AI architecture
```text
Organizer
  |
  v
AI UI
  |
  v
AI service
  |
  +--> authorization context
  +--> prompt/template
  +--> model provider
  +--> structured output validation
  +--> tool calls
           |
           +--> read event
           +--> read registration stats
           +--> create draft
           +--> propose action
```

AI should never directly execute arbitrary SQL.

## 7. AI action model
Classify tools:
- READ: safe read-only queries
- DRAFT: create editable content
- CONFIRM: action proposal requiring human confirmation
- MUTATE: sensitive action requiring explicit user confirmation and server authorization

MVP AI can use READ + DRAFT. Add MUTATE later.

## 8. Event URL strategy
Use:
`/e/[slug]`

Slugs must be unique.

For changes to event title, slug should remain stable unless organizer explicitly changes it.

## 9. Background jobs
Do not make MVP architecture dependent on a complex queue.

Use provider-neutral job interface:
- sendConfirmation
- sendReminder
- sendEventUpdate
- processWebhook
- generatePostEventSummary

Initial implementation may use Vercel-compatible scheduled/server mechanisms or a queue provider later.

## 10. Realtime
Optional:
- live check-in count
- dashboard updates
- organizer attendee changes

Supabase Realtime supports authorization through policies for private channels. citeturn1search12
