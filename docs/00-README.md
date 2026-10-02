# Utshob — Product Documentation Pack

Utshob is a full-stack event organizer and event discovery platform.

## Canonical stack
- Next.js App Router + React + JavaScript
- Tailwind CSS
- Supabase PostgreSQL + Storage
- Better Auth
- Vercel
- AI provider abstraction; OpenAI-compatible implementation recommended
- Optional payment/email/SMS/map providers behind adapters

## Documentation map
1. `01-PRD.md` — product requirements and scope
2. `02-TRD.md` — technical requirements and engineering standards
3. `03-ARCHITECTURE.md` — system architecture and request flows
4. `04-DATABASE.md` — database entities, relationships, indexes and rules
5. `05-API-SPEC.md` — API/resource contracts
6. `06-AI-SPEC.md` — AI features, tools, prompts, safety and evaluation
7. `07-UX-SPEC.md` — screens, navigation and UX requirements
8. `08-SECURITY.md` — threat model and security requirements
9. `09-TESTING.md` — test strategy and acceptance criteria
10. `10-ROADMAP.md` — implementation phases and backlog
11. `11-AI-CODING-RULES.md` — rules for using coding agents
12. `12-ENVIRONMENT.md` — environment variables and deployment checklist

## Product principle
Build the MVP around one complete loop:

Create event → publish event → attendee discovers/registers → organizer sees registration → attendee receives confirmation → organizer checks in attendee → organizer sees analytics.

Do not build advanced marketplace, social graph, complex seating, or sophisticated AI agents until this loop is stable.
