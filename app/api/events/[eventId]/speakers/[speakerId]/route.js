import { getServerSession } from "@/lib/auth/session";
import { deleteEventSpeaker } from "@/lib/events/speakers-server";

export async function DELETE(request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to manage speakers." } }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return Response.json({ error: { code: "ORGANIZATION_REQUIRED", message: "Choose an organization." } }, { status: 400 });
  const { eventId, speakerId } = await params;
  const result = await deleteEventSpeaker(eventId, speakerId, organizationId);
  if (result.error) return Response.json({ error: { code: "SPEAKER_DELETE_FAILED", message: result.error } }, { status: result.status });
  return Response.json(result);
}
