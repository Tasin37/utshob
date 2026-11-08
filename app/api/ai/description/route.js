import { getServerSession, requireOrganizationRole } from "@/lib/auth/session";
import { descriptionOptimizeRequestSchema } from "@/lib/ai/schemas.mjs";
import { optimizeDescriptionWithAi } from "@/lib/ai/server.mjs";

function errorResponse(message, status, code) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to optimize an event description.", 401, "UNAUTHENTICATED");

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY");
  }

  const parsed = descriptionOptimizeRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Add an event description first.", 422, "INVALID_AI_REQUEST");

  const access = await requireOrganizationRole(parsed.data.organizationId, ["owner", "admin"]);
  if (!access.allowed) return errorResponse("You do not have permission to use AI for this organization.", access.status, "FORBIDDEN");

  try {
    const result = await optimizeDescriptionWithAi({ ...parsed.data, userId: session.user.id });
    return Response.json({ description: result.output.description });
  } catch (error) {
    console.error("Failed to optimize event description", error.code || error.name);
    if (error.code === "AI_NOT_CONFIGURED") return errorResponse(error.message, 503, error.code);
    if (error.code === "AI_INVALID_RESPONSE") return errorResponse(error.message, 502, error.code);
    return errorResponse("AI description optimization is temporarily unavailable.", 503, "AI_UNAVAILABLE");
  }
}
