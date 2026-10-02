# Utshob — UX/UI Specification

## 1. Design direction
Utshob should feel:
- modern
- festive without being childish
- trustworthy
- fast
- organizer-focused

Use Tailwind CSS for implementation. Tailwind's current Next.js guide uses the PostCSS plugin approach. citeturn1search0

## 2. Public navigation
- Home
- Discover Events
- Categories
- Create Event
- About
- Sign in

## 3. Organizer navigation
Sidebar:
- Overview
- Events
- Registrations
- Tickets
- Check-in
- Analytics
- Team
- Settings
- AI Assistant

## 4. Attendee navigation
- Discover
- My Events
- Tickets
- Profile

## 5. Required screens

### Marketing
- Landing page
- Event discovery
- Event details
- Category listing

### Auth
- Sign up
- Sign in
- Verify email
- Forgot password
- Reset password

### Organizer
- Dashboard
- Event list
- Create event
- Edit event
- Preview event
- Publish confirmation
- Attendees
- Ticket types
- Promo codes
- Check-in
- Analytics
- Team management
- Organization settings

### Attendee
- Registration
- Payment
- Confirmation
- Ticket
- My events

### Admin
- User management
- Event moderation
- Reports
- Audit logs

## 6. Event creation wizard
Step 1: Basics
Step 2: Date & location
Step 3: Tickets/RSVP
Step 4: Questions
Step 5: Branding
Step 6: Preview
Step 7: Publish

Autosave drafts.

## 7. Public event page
Above fold:
- cover
- title
- date/time
- location
- CTA
- organizer

Below:
- description
- agenda
- speakers
- tickets
- FAQ
- organizer
- share

## 8. UX states
Every data screen must define:
- loading
- empty
- success
- validation error
- permission denied
- not found
- server error
- offline/retry where relevant

## 9. Accessibility
- semantic HTML
- visible focus
- keyboard operation
- accessible form labels
- error announcements
- sufficient contrast
- alt text for meaningful images
- scanner has manual-code fallback

## 10. Mobile
Prioritize:
- event page
- registration
- ticket
- check-in

Check-in interface should have large tap targets and minimal visual complexity.
