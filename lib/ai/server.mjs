import "server-only";

import { getPool } from "@/lib/db/pool";
import { answerOrganizerQuestion, draftAnnouncement, generateEventDraft, generateFaqs, optimizeDescription } from "@/lib/ai/provider.mjs";

export async function createEventDraftWithAi({ brief, userId, organizationId }) {
  const startedAt = Date.now();
  try {
    const output = await generateEventDraft({ brief });
    await recordAiAudit({ feature: "event_draft_generator", userId, organizationId, status: "succeeded", latencyMs: Date.now() - startedAt });
    return { output };
  } catch (error) {
    await recordAiAudit({ feature: "event_draft_generator", userId, organizationId, status: "failed", latencyMs: Date.now() - startedAt, errorCode: error.code || "AI_FAILED" });
    throw error;
  }
}

export async function optimizeDescriptionWithAi({ description, tone, userId, organizationId }) {
  const startedAt = Date.now();
  try {
    const output = await optimizeDescription({ description, tone });
    await recordAiAudit({ feature: "description_optimizer", userId, organizationId, status: "succeeded", latencyMs: Date.now() - startedAt });
    return { output };
  } catch (error) {
    await recordAiAudit({ feature: "description_optimizer", userId, organizationId, status: "failed", latencyMs: Date.now() - startedAt, errorCode: error.code || "AI_FAILED" });
    throw error;
  }
}

export async function generateFaqsWithAi({ context, userId, organizationId }) {
  const startedAt = Date.now();
  try {
    const output = await generateFaqs({ context });
    await recordAiAudit({ feature: "faq_generator", userId, organizationId, status: "succeeded", latencyMs: Date.now() - startedAt });
    return { output };
  } catch (error) {
    await recordAiAudit({ feature: "faq_generator", userId, organizationId, status: "failed", latencyMs: Date.now() - startedAt, errorCode: error.code || "AI_FAILED" });
    throw error;
  }
}

export async function answerOrganizerQuestionWithAi({ question, context, userId, organizationId, eventId }) {
  const startedAt = Date.now();
  try {
    const output = await answerOrganizerQuestion({ question, context });
    await recordAiAudit({ feature: "organizer_assistant", userId, organizationId, eventId, status: "succeeded", latencyMs: Date.now() - startedAt });
    return { output };
  } catch (error) {
    await recordAiAudit({ feature: "organizer_assistant", userId, organizationId, eventId, status: "failed", latencyMs: Date.now() - startedAt, errorCode: error.code || "AI_FAILED" });
    throw error;
  }

}

export async function draftAnnouncementWithAi({ context, goal, userId, organizationId, eventId }) {
  const startedAt = Date.now();
  try {
    const output = await draftAnnouncement({ context, goal });
    await recordAiAudit({ feature: "announcement_drafter", userId, organizationId, eventId, status: "succeeded", latencyMs: Date.now() - startedAt });
    return { output };
  } catch (error) {
    await recordAiAudit({ feature: "announcement_drafter", userId, organizationId, eventId, status: "failed", latencyMs: Date.now() - startedAt, errorCode: error.code || "AI_FAILED" });
    throw error;
  }
}

async function recordAiAudit({ feature, userId, organizationId, eventId = null, status, latencyMs, errorCode = null }) {
  await getPool().query(
    `INSERT INTO ai_audit_logs (feature, user_id, organization_id, event_id, status, latency_ms, error_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [feature, userId, organizationId, eventId, status, latencyMs, errorCode],
  );
}
