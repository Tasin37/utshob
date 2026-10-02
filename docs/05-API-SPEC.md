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

### POST /api/payments/:provider/webhook
Provider webhook.

Rules:
- verify signature
- persist raw provider reference safely
- make processing idempotent
- update order
- issue ticket only after verified successful payment

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
Generate structured event draft.

### POST /api/ai/description
Generate/rewrite description.

### POST /api/ai/faq
Generate FAQ.

### POST /api/ai/assistant
Natural-language organizer assistant.

The assistant must only access data through authorized server tools.

## 12. Pagination
Use cursor pagination for large attendee lists.

Example:
`?limit=50&cursor=...`

Never return unbounded attendee lists.
