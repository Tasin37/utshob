import test from "node:test";
import assert from "node:assert/strict";
import { announcementDraftOutputSchema, announcementDraftRequestSchema, descriptionOptimizeOutputSchema, descriptionOptimizeRequestSchema, eventDraftOutputSchema, eventDraftRequestSchema, faqGenerateOutputSchema, faqGenerateRequestSchema, organizerAssistantOutputSchema, organizerAssistantRequestSchema } from "../lib/ai/schemas.mjs";

test("AI event draft request requires a useful organizer brief", () => {
  assert.equal(eventDraftRequestSchema.safeParse({ organizationId: "org_1", brief: "short" }).success, false);
  assert.equal(eventDraftRequestSchema.safeParse({ organizationId: "org_1", brief: "A community workshop for beginner photographers in Dhaka." }).success, true);
});

test("AI event draft output requires structured content", () => {
  const result = eventDraftOutputSchema.safeParse({
    title: "Beginner Photography Walk",
    summary: "A guided photo walk for beginners.",
    description: "Learn composition and practice with other photographers.",
    category: "Arts & culture",
    audience: ["Beginners"],
    agenda: [{ title: "Welcome and briefing", durationMinutes: 30 }],
    faqs: [{ question: "What should I bring?", answer: "Bring a camera or phone and comfortable shoes." }],
  });

  assert.equal(result.success, true);
  assert.equal(eventDraftOutputSchema.safeParse({ title: "Incomplete" }).success, false);
});

test("description optimizer validates bounded input and output", () => {
  assert.equal(descriptionOptimizeRequestSchema.safeParse({ organizationId: "org_1", description: "A useful description for an event with enough detail.", tone: "warm" }).success, true);
  assert.equal(descriptionOptimizeRequestSchema.safeParse({ organizationId: "org_1", description: "too short", tone: "warm" }).success, false);
  assert.equal(descriptionOptimizeOutputSchema.safeParse({ description: "A clearer event description with enough attendee-facing detail." }).success, true);
});

test("FAQ generator validates event context and bounded FAQ output", () => {
  assert.equal(faqGenerateRequestSchema.safeParse({ organizationId: "org_1", context: "A community workshop with practical activities for beginners." }).success, true);
  assert.equal(faqGenerateRequestSchema.safeParse({ organizationId: "org_1", context: "short" }).success, false);
  assert.equal(faqGenerateOutputSchema.safeParse({ faqs: [{ question: "Who is this for?", answer: "Beginners are welcome." }] }).success, true);
});

test("organizer assistant validates scoped questions and structured answers", () => {
  assert.equal(organizerAssistantRequestSchema.safeParse({ organizationId: "org_1", eventId: "event_1", question: "What should I focus on before the event?" }).success, true);
  assert.equal(organizerAssistantRequestSchema.safeParse({ organizationId: "org_1", eventId: "event_1", question: "why?" }).success, false);
  assert.equal(organizerAssistantOutputSchema.safeParse({ answer: "Registrations are growing.", sources: ["registrations by day"], suggestedActions: ["Review capacity."] }).success, true);
});

test("announcement drafts require a scoped goal and bounded output", () => {
  assert.equal(announcementDraftRequestSchema.safeParse({ organizationId: "org_1", eventId: "event_1", goal: "reminder" }).success, true);
  assert.equal(announcementDraftRequestSchema.safeParse({ organizationId: "org_1", eventId: "event_1", goal: "unknown" }).success, false);
  assert.equal(announcementDraftOutputSchema.safeParse({ subject: "See you soon", body: "A useful attendee announcement with enough detail for review.", audienceNote: "For registered attendees." }).success, true);
});
