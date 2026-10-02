# Utshob — Security Specification

## 1. Threat model
Protect against:
- unauthorized event access
- IDOR/BOLA
- session theft
- CSRF where applicable
- XSS
- SQL injection
- malicious file uploads
- QR replay
- duplicate check-in
- payment webhook forgery
- rate abuse
- prompt injection
- AI tool abuse
- data leakage between organizations

## 2. Authentication
Use Better Auth.

Never:
- store plaintext passwords
- expose session secrets
- accept user identity from request body

Better Auth provides Next.js integration and session management capabilities. citeturn0search1turn0search17

## 3. Authorization
Use resource + action checks:
```text
organization.update
event.create
event.update
event.publish
event.read_private
attendee.read
attendee.export
checkin.execute
analytics.read
```

A user must pass:
1. authenticated
2. organization membership
3. role permission
4. event scope where relevant

## 4. IDOR prevention
Never implement:
```js
db.events.findById(eventId)
```
without checking the authenticated user's organization/event permission.

## 5. QR security
QR should contain an opaque high-entropy token, not sensitive attendee data.

Store a hash of the token where possible.

Check:
- event
- ticket status
- ticket validity
- cancellation
- prior check-in

## 6. Payment security
- verify provider webhook signature
- idempotent webhook processing
- never trust client payment status
- never store raw card data
- store provider reference only
- restrict refund actions

## 7. Upload security
- validate MIME type and extension
- enforce file size
- generate safe object names
- avoid executing uploaded files
- use separate storage buckets/policies

## 8. Rate limiting
Rate limit:
- auth endpoints
- registration endpoints
- check-in endpoints
- AI endpoints
- password reset
- invitation sending

## 9. AI security
AI cannot:
- bypass authorization
- execute arbitrary SQL
- reveal secrets
- access another organization's events
- publish content without allowed workflow
- issue refunds without explicit authorized flow

## 10. Secrets
Secrets only in Vercel/server environment variables.

Vercel environment variables are encrypted at rest and can be scoped to environments. citeturn1search5

Never commit `.env.local`.

## 11. Audit events
Audit:
- login/security events where appropriate
- role changes
- event publication
- cancellation
- ticket changes
- exports
- payment state changes
- check-ins
- admin moderation
- sensitive AI actions

## 12. Privacy
Collect only data required for event operation.

Provide:
- privacy policy
- data retention rules
- deletion/export workflow where applicable
- organizer visibility rules

## 13. Security baseline
Before production:
- dependency audit
- secret scan
- authorization tests
- webhook tests
- OWASP-style API testing
- upload testing
- rate-limit testing
- backup/restore test
