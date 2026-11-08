import { getServerSession } from "@/lib/auth/session";
import { deleteEventExhibitor } from "@/lib/events/exhibitors-server";

export async function DELETE(request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to manage exhibitors." } }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return Response.json({ error: { code: "ORGANIZATION_REQUIRED", message: "Choose an organization." } }, { status: 400 });
  const { eventId, exhibitorId } = await params;
  const result = await deleteEventExhibitor(eventId, exhibitorId, organizationId);
  if (result.error) return Response.json({ error: { code: "EXHIBITOR_DELETE_FAILED", message: result.error } }, { status: result.status });
  return Response.json(result);
}
