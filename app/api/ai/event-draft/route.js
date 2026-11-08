import { getServerSession, requireOrganizationRole } from "@/lib/auth/session";
import { eventDraftRequestSchema } from "@/lib/ai/schemas.mjs";
import { createEventDraftWithAi } from "@/lib/ai/server.mjs";

function errorResponse(message, status, code) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to generate an event draft.", 401, "UNAUTHENTICATED");

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY");
  }

  const parsed = eventDraftRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Describe the event in at least 20 characters.", 422, "INVALID_AI_REQUEST");

  const access = await requireOrganizationRole(parsed.data.organizationId, ["owner", "admin"]);
  if (!access.allowed) return errorResponse("You do not have permission to use AI for this organization.", access.status, "FORBIDDEN");

  try {
    const result = await createEventDraftWithAi({
      ...parsed.data,
      userId: session.user.id,
    });
    return Response.json({ draft: result.output });
  } catch (error) {
    console.error("Failed to generate event draft", error.code || error.name);
    if (error.code === "AI_NOT_CONFIGURED") return errorResponse(error.message, 503, error.code);
    if (error.code === "AI_INVALID_RESPONSE") return errorResponse(error.message, 502, error.code);
    return errorResponse("AI draft generation is temporarily unavailable.", 503, "AI_UNAVAILABLE");
  }
}
