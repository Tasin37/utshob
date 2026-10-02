import { getServerSession } from "@/lib/auth/session";
import { createEventDraft, listEvents, validateEventDraft } from "@/lib/events/server";

function errorResponse(message, status, code = "EVENT_REQUEST_FAILED") {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(request) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to access organizer events.", 401, "UNAUTHENTICATED");

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");

  try {
    const result = await listEvents(organizationId);
    if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
    return Response.json({ events: result.events });
  } catch (error) {
    console.error("Failed to load organizer events", error.code || error.name);
    return errorResponse("Events are unavailable. Confirm the event database migration has been applied.", 503, "EVENTS_UNAVAILABLE");
  }
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to create an event.", 401, "UNAUTHENTICATED");

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY");
  }

  const parsed = validateEventDraft(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Check the event details.", 422, "INVALID_EVENT");
  const result = await createEventDraft(parsed.data, session);
  if (result.error) return errorResponse(result.error, result.status, result.status === 403 ? "FORBIDDEN" : "EVENT_CREATE_FAILED");
  return Response.json({ event: result.event }, { status: 201 });
}