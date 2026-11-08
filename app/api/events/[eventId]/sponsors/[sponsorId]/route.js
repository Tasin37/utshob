import { getServerSession } from "@/lib/auth/session";
import { deleteEventSponsor } from "@/lib/events/sponsors-server";

export async function DELETE(request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to manage sponsors." } }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return Response.json({ error: { code: "ORGANIZATION_REQUIRED", message: "Choose an organization." } }, { status: 400 });
  const { eventId, sponsorId } = await params;
  const result = await deleteEventSponsor(eventId, sponsorId, organizationId);
  if (result.error) return Response.json({ error: { code: "SPONSOR_DELETE_FAILED", message: result.error } }, { status: result.status });
  return Response.json(result);
}
