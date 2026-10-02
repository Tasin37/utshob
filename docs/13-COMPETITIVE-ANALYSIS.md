# Utshob — Competitive Analysis Notes

## Research basis
The product scope was informed by current public product documentation for Eventbrite, Cvent and Partiful, plus the official documentation for the selected technical stack.

## Eventbrite
Public organizer features include event management, timed entry, reserved seating, custom tickets, embedded checkout, promo codes, organizer check-in, reporting/insights and AI tools. citeturn0search0

### Utshob implication
MVP should include:
- event management
- tickets/RSVP
- promo codes
- QR check-in
- analytics

Do not copy the entire enterprise feature set initially.

## Cvent
Cvent's platform covers registration, attendee management, session management, check-in, reporting, integrations, event websites and marketing. It also exposes enterprise concepts such as roles, APIs and webhooks. citeturn0search7turn0search15

### Utshob implication
The data model should leave room for:
- event sessions
- roles
- APIs/webhooks
- attendee segmentation
- reporting

But these should be phased.

## Partiful
Partiful emphasizes easy event creation, RSVP tracking, invitations, guest interaction, text blasts, ticketing, QR check-in and photo sharing. Its event settings also include guest approval, +1s, questionnaires, privacy controls, reminders and check-in staff. citeturn0search9turn0search3

### Utshob implication
Utshob should prioritize a low-friction public event experience:
- shareable event URL
- simple RSVP
- custom questions
- reminders
- guest privacy
- optional +1
- fast mobile experience

## Product positioning opportunity
Utshob should not attempt to be "everything for everyone" in version 1.

A coherent initial position:
> A modern, AI-assisted event creation and management platform that makes it easy for organizers to create an event, collect registrations, manage attendees and run check-in.

## Feature boundary
### MVP
Create → Publish → Register → Ticket → Check-in → Analyze

### Later
Discover → Recommend → Market → Integrate → Automate
