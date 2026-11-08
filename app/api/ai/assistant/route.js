import { getServerSession } from "@/lib/auth/session";
import { organizerAssistantRequestSchema } from "@/lib/ai/schemas.mjs";
import { answerOrganizerQuestionWithAi } from "@/lib/ai/server.mjs";
import { getEventAnalyticsTool } from "@/lib/ai/tools.mjs";

function errorResponse(message, status, code) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to use the organizer assistant.", 401, "UNAUTHENTICATED");
  let body;
  try { body = await request.json(); } catch { return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY"); }
  const parsed = organizerAssistantRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Ask a specific event question.", 422, "INVALID_AI_REQUEST");

  try {
    const analyticsTool = await getEventAnalyticsTool(parsed.data);
    const result = await answerOrganizerQuestionWithAi({
      ...parsed.data,
      context: JSON.stringify(analyticsTool.data),
      userId: session.user.id,
    });
    return Response.json(result.output);
  } catch (error) {
    if (error.code === "AI_TOOL_FORBIDDEN" || error.code === "EVENT_NOT_FOUND") {
      return errorResponse(error.message, error.status || 403, error.code);
    }
    console.error("Failed to answer organizer question", error.code || error.name);
    if (error.code === "AI_NOT_CONFIGURED") return errorResponse(error.message, 503, error.code);
    if (error.code === "AI_INVALID_RESPONSE") return errorResponse(error.message, 502, error.code);
    return errorResponse("The organizer assistant is temporarily unavailable.", 503, "AI_UNAVAILABLE");
  }
}
