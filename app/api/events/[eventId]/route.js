import { getServerSession } from "@/lib/auth/session";
import { getEventDraft, updateEventDraft, validateEventDraft } from "@/lib/events/server";

export async function GET(_request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to access this draft." } }, { status: 401 });

  const { eventId } = await params;
  const result = await getEventDraft(eventId);
  if (result.error) return Response.json({ error: { code: "EVENT_READ_FAILED", message: result.error } }, { status: result.status });
  return Response.json({ event: result.event });
}

export async function PATCH(request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to edit this event." } }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "INVALID_BODY", message: "Request body must be valid JSON." } }, { status: 400 });
  }

  const parsed = validateEventDraft(body);
  if (!parsed.success) return Response.json({ error: { code: "INVALID_EVENT", message: parsed.error.issues[0]?.message || "Check the event details." } }, { status: 422 });

  const { eventId } = await params;
  const result = await updateEventDraft(eventId, parsed.data);
  if (result.error) return Response.json({ error: { code: "EVENT_UPDATE_FAILED", message: result.error } }, { status: result.status });
  return Response.json({ event: result.event });
}