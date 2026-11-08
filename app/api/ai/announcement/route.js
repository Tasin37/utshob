import { getServerSession, requireOrganizationRole } from "@/lib/auth/session";
import { announcementDraftRequestSchema } from "@/lib/ai/schemas.mjs";
import { draftAnnouncementWithAi } from "@/lib/ai/server.mjs";
import { getEventAnalyticsTool } from "@/lib/ai/tools.mjs";

function errorResponse(message, status, code) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to draft an announcement.", 401, "UNAUTHENTICATED");
  let body;
  try { body = await request.json(); } catch { return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY"); }
  const parsed = announcementDraftRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Choose an announcement goal.", 422, "INVALID_AI_REQUEST");
  const access = await requireOrganizationRole(parsed.data.organizationId, ["owner", "admin"]);
  if (!access.allowed) return errorResponse("You do not have permission to use AI for this organization.", access.status, "FORBIDDEN");
  try {
    const analyticsTool = await getEventAnalyticsTool(parsed.data);
    const result = await draftAnnouncementWithAi({
      ...parsed.data,
      context: JSON.stringify(analyticsTool.data),
      userId: session.user.id,
    });
    return Response.json(result.output);
  } catch (error) {
    if (error.code === "EVENT_NOT_FOUND" || error.code === "AI_TOOL_FORBIDDEN") return errorResponse(error.message, error.status || 403, error.code);
    console.error("Failed to draft announcement", error.code || error.name);
    if (error.code === "AI_NOT_CONFIGURED") return errorResponse(error.message, 503, error.code);
    if (error.code === "AI_INVALID_RESPONSE") return errorResponse(error.message, 502, error.code);
    return errorResponse("AI announcement drafting is temporarily unavailable.", 503, "AI_UNAVAILABLE");
  }
}
