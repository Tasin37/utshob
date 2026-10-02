# Utshob — Product Requirements Document (PRD)

## 1. Product summary
Utshob is a web platform that lets organizers create, publish, promote, manage and analyze events while allowing attendees to discover events, RSVP or buy tickets, receive updates and check in.

The product should work for:
- conferences
- workshops
- university events
- cultural programs
- meetups
- concerts
- private parties
- community events
- webinars/hybrid events in later phases

## 2. Product goals
### Primary
- Reduce event creation time.
- Make public event pages attractive and shareable.
- Make RSVP/ticket registration simple.
- Give organizers a reliable operational dashboard.
- Make check-in fast using QR codes.
- Use AI to reduce organizer workload without giving AI uncontrolled authority.

### Secondary
- Support organizer teams and roles.
- Provide event analytics.
- Support promotional codes and ticket tiers.
- Provide integrations through stable APIs/webhooks.

## 3. Non-goals for MVP
- Full hotel/travel booking.
- Complex reserved seating.
- Full vendor marketplace.
- Native iOS/Android apps.
- Livestream infrastructure.
- Automated financial settlement/payout engine.
- AI that autonomously publishes, refunds, deletes or sends bulk messages without human confirmation.

## 4. Personas
### Organizer
Creates and manages events, tickets, attendees, communications and analytics.

### Organizer team member
Works on assigned event tasks according to role permissions.

### Attendee
Discovers an event, views details, registers/pays, receives ticket/QR and checks in.

### Check-in staff
Scans QR codes and sees only operational attendee information required for entry.

### Platform admin
Moderates users/events, handles reports, audits activity and manages platform configuration.

## 5. Core user journeys
### Journey A — create and publish
1. Sign in.
2. Create organization/profile.
3. Click Create Event.
4. Enter title, description, category, date/time, venue/online location and cover image.
5. Configure visibility.
6. Configure RSVP or ticket tiers.
7. Preview.
8. Publish.
9. Receive public event URL.

### Journey B — attendee registration
1. Open public event URL.
2. Review event.
3. Select RSVP/ticket.
4. Enter attendee information.
5. Accept required terms.
6. Pay if required.
7. Receive confirmation and QR ticket.
8. Add event to calendar.

### Journey C — check-in
1. Organizer opens check-in mode.
2. Staff member signs in or receives event-scoped permission.
3. Scan QR.
4. Server verifies ticket and event.
5. Show valid/already-used/invalid status.
6. Record check-in timestamp and staff member.
7. Dashboard updates attendance.

### Journey D — AI event creation
1. Organizer enters a natural-language brief.
2. AI proposes title, description, category, agenda outline, FAQ and promotional copy.
3. AI returns structured draft.
4. Organizer edits/approves.
5. Nothing is published automatically.

## 6. MVP features

### Authentication
- Email/password
- Immediate sign-in after registration; email verification is not required
- Password reset
- Session management
- Social login can be phase 2
- Optional passkeys/2FA later

Better Auth supports Next.js integration and organization/member/role capabilities. citeturn0search1turn0search17

### Organizer organizations
- Create organization
- Organization profile/logo
- Members
- Roles
- Invitations
- Event ownership

Suggested roles:
- owner
- admin
- event_manager
- checkin_staff
- analyst

### Event management
Fields:
- title
- slug
- summary
- description
- category
- event type: in_person / online / hybrid
- timezone
- starts_at
- ends_at
- venue name/address
- online URL
- capacity
- cover image
- visibility: public / unlisted / private
- status: draft / published / cancelled / completed / archived

Capabilities:
- create
- edit
- duplicate
- preview
- publish/unpublish
- cancel
- archive

### Registration
- RSVP registration
- Ticket registration
- Required/optional attendee fields
- Custom questions
- Confirmation
- Cancellation
- Registration status
- Capacity enforcement
- Optional waitlist

### Ticketing
- Ticket tiers
- Price
- Quantity/capacity
- Sales start/end
- Early-bird price
- Promo codes
- QR ticket
- Ticket status

Payment processing must use a provider adapter; the initial implementation can support one provider and keep the domain model provider-neutral.

### Event page
- Responsive public page
- Cover image
- event details
- agenda
- organizer
- venue/map link
- ticket/RSVP CTA
- share button
- FAQ
- terms
- SEO metadata

### Attendee dashboard
- Upcoming events
- Past events
- Tickets
- Registration details
- QR code
- Cancellation where allowed

### Organizer dashboard
- event count
- registrations
- ticket sales
- check-ins
- revenue where applicable
- conversion rate
- attendee list
- exports

### Check-in
- QR scanner
- ticket verification
- duplicate scan detection
- manual lookup
- check-in history
- event-scoped staff permissions

### Notifications
- registration confirmation
- ticket issued
- event reminder
- event update
- cancellation
- organizer invitation

Use an email/SMS adapter rather than hard-coding one vendor.

## 7. AI features

### MVP AI-1: Event Copilot
Input:
"Create a one-day university AI conference for 300 students in Chittagong."

Output:
- title options
- summary
- long description
- category
- audience
- agenda draft
- FAQ draft
- required attendee questions
- promotional copy

### MVP AI-2: Description optimizer
Rewrite event descriptions for:
- concise
- professional
- energetic
- SEO-friendly

### MVP AI-3: FAQ generator
Generate FAQs from event data, but mark them as drafts.

### MVP AI-4: Organizer assistant
Answer questions using the current organizer's authorized event data:
- "How many people registered?"
- "Which ticket tier is almost sold out?"
- "Show today's check-ins."

AI must use tools for live facts rather than inventing database values.

### Phase 2 AI
- audience/promotion suggestions
- registration anomaly detection
- attendee segmentation
- personalized event recommendations
- agenda conflict detection
- post-event summary
- feedback analysis

## 8. Functional requirements
FR-001 User can register/login/logout.
FR-002 Organizer can create an organization.
FR-003 Authorized member can create an event.
FR-004 Organizer can save event drafts.
FR-005 Organizer can publish an event.
FR-006 Public user can view published public/unlisted events.
FR-007 Public user can register where registration is enabled.
FR-008 System enforces capacity atomically.
FR-009 Paid registration creates an order/payment record.
FR-010 Successful registration creates an attendee/ticket record.
FR-011 Ticket contains unique QR token.
FR-012 Authorized staff can check in a ticket.
FR-013 Duplicate check-in is rejected or explicitly handled.
FR-014 Organizer can export attendee data.
FR-015 System records security-sensitive actions in audit logs.
FR-016 AI-generated content is editable before publication.
FR-017 AI tools cannot bypass authorization.
FR-018 Platform admin can suspend event/user where authorized.

## 9. Non-functional requirements
- Mobile-first responsive UI.
- Core public pages should be SEO-friendly.
- Server-side authorization for every protected mutation.
- No secret API key in client bundle.
- Idempotent payment/check-in operations.
- Accessible keyboard navigation for core flows.
- Clear loading/error/empty states.
- Structured logs.
- Production errors observable.
- Database migrations version-controlled.
- API responses have stable schemas.

## 10. Success metrics
MVP metrics:
- event creation completion rate
- median time to publish
- registration completion rate
- registration failure rate
- check-in success rate
- duplicate check-in rate
- notification delivery rate
- AI draft acceptance/edit rate
- AI error/refusal rate
- weekly active organizers
