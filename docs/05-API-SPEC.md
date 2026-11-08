# Utshob — API Specification

## 1. API principles
- JSON
- `/api/v1` for public stable API when external API consumers are introduced
- Internal web endpoints may initially use `/api/...`
- Authentication via Better Auth session
- Consistent error format
- Validate every input
- Authorization before data access
- Idempotency for payment/check-in-sensitive operations

## 2. Error format
```json
{
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event not found",
    "requestId": "req_123"
  }
}
```

## 3. Auth
Better Auth owns auth endpoints, including the Next.js integration route.

Recommended:
`/api/auth/[...all]`

Better Auth documents this Next.js handler pattern. citeturn0search1

## 4. Organizations
### POST /api/organizations
Create organization.

### GET /api/organizations
List organizations accessible to current user.

### GET /api/organizations/:id
Get organization.

### PATCH /api/organizations/:id
Update organization.

### POST /api/organizations/:id/invitations
Invite member.

### PATCH /api/organizations/:id/members/:memberId
Change role.

## 5. Events
### POST /api/events
Create draft.

Request:
```json
{
  "organizationId": "uuid",
  "title": "AI Conference 2027",
  "slug": "ai-conference-2027",
  "eventType": "in_person",
  "timezone": "Asia/Dhaka",
  "startsAt": "2027-02-10T09:00:00Z",
  "endsAt": "2027-02-10T17:00:00Z"
}
```

### GET /api/events/:id
Get event for authorized organizer.

### PATCH /api/events/:id
Update event.

### POST /api/events/:id/publish
Publish after validation.

### POST /api/events/:id/cancel
Cancel.

### GET /api/public/events/:slug
Public event data.

## 6. Tickets
### POST /api/events/:id/ticket-types
Create ticket type.

### PATCH /api/ticket-types/:id
Update.

### DELETE /api/ticket-types/:id
Archive.

## 7. Registration
### POST /api/events/:id/register
Create registration.

Header:
`Idempotency-Key: <unique-key>`

### GET /api/registrations/:id
Get registration where authorized.

### POST /api/registrations/:id/cancel
Cancel where policy allows.

## 8. Payments
### POST /api/orders
Create order.

Request may include `promoCode`. The server validates the active event code, usage limit, and validity window, then stores the discount and final amount transactionally.

### GET /api/events/:eventId/promo-codes
List promo codes for an organizer with owner/admin access.

### POST /api/events/:eventId/promo-codes
Create a fixed-amount or percentage promo code for an event. Requires owner/admin organization access.

### POST /api/orders/:orderId/confirm
Confirm a manual bKash payment.

Request:
```json
{
  "transactionId": "8N7A2B3C"
}
```

Rules:
- require the authenticated order owner
- validate the bKash transaction ID
- update the order and registration transactionally
- issue tickets only after confirmation

### GET /api/events/:eventId/analytics
Returns authorized event metrics, including registrations, revenue, average paid order value, ticket sell-through, attendance rate, daily trends, and ticket mix.

### GET /api/public/events/:slug/calendar
Download an RFC 5545 calendar invite for a public event with scheduled start and end times.

Public event pages expose Open Graph/Twitter metadata and a share action using the Web Share API with clipboard fallback.

The homepage also exposes deterministic recommendations ranked from upcoming date, category, event type, and location similarity to featured events. Recommendations never expose private events and exclude their seed events.

The homepage discovery section displays at most six events. Additional published events are available at `/events`, with six-event pagination and the same search/category filters.

Hybrid events expose both the in-person venue and online access link when available. Calendar invites include both locations.

When an RSVP event is full and waitlists are enabled, the registration endpoint stores the attendee with `status: "waitlisted"` and does not issue a ticket.

### GET/POST /api/events/:eventId/speakers
List or create speaker profiles for an event. Requires owner/admin organization access.

### DELETE /api/events/:eventId/speakers/:speakerId
Remove an event speaker with owner/admin organization access.

### GET/POST /api/events/:eventId/sponsors
List or create sponsor profiles for an event. Requires owner/admin organization access.

### DELETE /api/events/:eventId/sponsors/:sponsorId
Remove an event sponsor with owner/admin organization access.

### GET/POST /api/events/:eventId/exhibitors
List or create exhibitor profiles for an event. Requires owner/admin organization access.

### DELETE /api/events/:eventId/exhibitors/:exhibitorId
Remove an event exhibitor with owner/admin organization access.

### GET/POST /api/integrations/webhooks
List or create organization webhook endpoints. Requires owner/admin organization access.

Creating an endpoint returns its signing secret once. Store it securely; it is encrypted at rest and cannot be retrieved later.

### DELETE /api/integrations/webhooks/:endpointId
Remove an organization webhook endpoint.

Webhook deliveries use `POST` with `X-Utshob-Event` and `X-Utshob-Signature: sha256=<hmac-sha256>` headers. Payloads contain `id`, `event`, `createdAt`, and `data`. Supported event names are `registration.created`, `order.paid`, and `ticket.checked_in`.

## 9. Check-in
### POST /api/events/:id/check-in
Request:
```json
{
  "qrToken": "opaque-token"
}
```

Response examples:
```json
{
  "status": "checked_in",
  "ticketId": "uuid",
  "attendeeName": "Example User",
  "checkedInAt": "2027-02-10T09:31:00Z"
}
```

Already checked:
```json
{
  "status": "already_checked_in",
  "checkedInAt": "2027-02-10T09:31:00Z"
}
```

## 10. Analytics
### GET /api/events/:id/analytics
Return:
- registrations
- paid registrations
- tickets sold
- revenue
- check-ins
- check-in rate
- registrations by day
- ticket tier distribution

## 11. AI
### POST /api/ai/event-draft
Generate an editable, structured event content draft for an organization. It requires an authenticated owner or admin, validates the brief, records an `ai_audit_logs` entry, and never publishes or persists the generated content automatically.

Request:
```json
{
  "organizationId": "organization-id",
  "brief": "A Saturday pottery workshop for beginners in Dhaka."
}
```

### POST /api/ai/description
Generate/rewrite description. Requires an authenticated organization owner or admin, validates the source and tone, records an `ai_audit_logs` entry, and returns a reviewable replacement without saving it automatically.

### POST /api/ai/faq
Generate reviewable structured FAQs from event context. Requires an authenticated organization owner or admin, validates the context, and records an `ai_audit_logs` entry.

### POST /api/ai/assistant
Natural-language organizer assistant for one authorized event. It reads live analytics server-side, returns structured answers with source labels, and records an event-scoped audit entry. It cannot mutate event data.

The assistant must only access data through authorized server tools.

### POST /api/ai/announcement
Draft a reviewable attendee announcement for an authorized event. Accepts `organizationId`, `eventId`, and a goal of `reminder`, `last-chance`, or `thank-you`. It reads event analytics through the authorized read-only tool and never sends the announcement.

## 12. Pagination
Use cursor pagination for large attendee lists.

Example:
`?limit=50&cursor=...`

Never return unbounded attendee lists.
