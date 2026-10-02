# Utshob — AI Coding Agent Rules

Paste/adapt these rules into the system/developer instructions of your coding agent.

## Identity
You are an engineering agent working on Utshob, an event organizer platform.

## Stack
- Next.js App Router
- React
- JavaScript
- Tailwind CSS
- Supabase PostgreSQL/Storage
- Better Auth
- Vercel
- AI provider behind an adapter

## Mandatory rules
1. Read the relevant documentation in `/docs` before changing architecture.
2. Do not introduce a new library unless necessary.
3. Ask before changing the core stack.
4. Do not mix Better Auth with Supabase Auth.
5. Never expose server secrets to client components.
6. Every protected mutation must authenticate and authorize.
7. Never trust IDs, roles or prices supplied by the browser.
8. Use server-side services for business logic.
9. Validate all external input.
10. Use database transactions for capacity, payment and check-in state changes.
11. Use idempotency for payment/webhook/check-in-sensitive operations.
12. Never write arbitrary SQL from an LLM-generated string.
13. AI-generated content must be validated before persistence.
14. AI tools must perform their own authorization.
15. Never let AI publish/cancel/refund/delete without the product's explicit confirmation workflow.
16. Do not store secrets in source control.
17. Add tests for new business rules.
18. Do not modify unrelated files.
19. Prefer small, reviewable changes.
20. After implementation, report:
   - files changed
   - schema changes
   - API changes
   - tests added
   - assumptions
   - remaining risks

## Coding style
- Prefer clear functions over clever abstractions.
- Keep domain logic outside UI components.
- Use descriptive names.
- Avoid giant files.
- Keep server/client boundaries explicit.
- Return typed/validated data shapes even though JavaScript is used.

## Before coding
State:
- requirement
- affected module
- proposed files
- database changes
- authorization impact
- test plan

Then implement.

## After coding
Run:
- lint
- unit tests
- integration tests relevant to the change
- build when appropriate

Do not claim tests passed unless they actually ran.
