import { getServerSession } from "@/lib/auth/session";
import { publishEvent } from "@/lib/events/server";

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to publish this event." } }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "INVALID_BODY", message: "Request body must be valid JSON." } }, { status: 400 });
  }

  if (typeof body.organizationId !== "string" || !body.organizationId) {
    return Response.json({ error: { code: "ORGANIZATION_REQUIRED", message: "Choose an organization." } }, { status: 400 });
  }

  const { eventId } = await params;
  const result = await publishEvent(eventId, body.organizationId);
  if (result.error) {
    return Response.json({ error: { code: "EVENT_PUBLISH_FAILED", message: result.error, problems: result.problems } }, { status: result.status });
  }
  return Response.json({ event: result.event });
}