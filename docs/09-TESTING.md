# Utshob — Testing Strategy

## 1. Test pyramid
- Unit tests: domain rules
- Integration tests: database/services
- API tests: endpoint authorization and validation
- E2E: critical user journeys
- Security tests
- AI evaluations

## 2. Critical E2E flows
### E2E-001
Sign up → verify → login → create organization.

### E2E-002
Create event → configure ticket → publish → open public page.

### E2E-003
Attendee → register → receive ticket.

### E2E-004
Staff → scan ticket → successful check-in.

### E2E-005
Second scan → already checked in.

### E2E-006
Unauthorized member → denied access to restricted event.

### E2E-007
Paid order → webhook → paid order → ticket issued.

### E2E-008
AI event draft → structured response → organizer edits → saves.

## 3. Unit tests
Test:
- slug generation
- event status transitions
- capacity calculation
- promo code rules
- permission matrix
- ticket validation
- check-in rules
- money calculation
- timezone conversion

## 4. Concurrency tests
- two users attempt last ticket
- duplicate webhook
- duplicate check-in
- repeated registration request with same idempotency key

## 5. Security tests
For every protected endpoint:
- unauthenticated
- authenticated wrong organization
- authenticated wrong role
- valid authorized user

## 6. AI tests
### Factual
Assistant answers database questions correctly.

### Authorization
Assistant cannot access another organization.

### Injection
Malicious event content cannot alter tool policy.

### Schema
All structured generation passes validation or returns a controlled error.

## 7. Definition of Done
Feature is complete only when:
- acceptance criteria pass
- validation exists
- authorization exists
- loading/error states exist
- tests exist
- audit behavior is defined if sensitive
- documentation updated
- no secrets committed
