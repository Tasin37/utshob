import { getServerSession } from "@/lib/auth/session";
import { createEventSpeaker, listEventSpeakers } from "@/lib/events/speakers-server";
import { speakerSchema } from "@/lib/events/speakers.mjs";

function errorResponse(message, status, code = "SPEAKER_REQUEST_FAILED") {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(request, { params }) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to manage speakers.", 401, "UNAUTHENTICATED");
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const { eventId } = await params;
  const result = await listEventSpeakers(eventId, organizationId);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json({ speakers: result.speakers });
}

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to manage speakers.", 401, "UNAUTHENTICATED");
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY");
  }
  const parsed = speakerSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Check the speaker details.", 422, "INVALID_SPEAKER");
  const organizationId = body.organizationId;
  if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const { eventId } = await params;
  const result = await createEventSpeaker(eventId, organizationId, parsed.data);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json({ speaker: result.speaker }, { status: result.status });
}
