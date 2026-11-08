import { getServerSession } from "@/lib/auth/session";
import { createEventExhibitor, listEventExhibitors } from "@/lib/events/exhibitors-server";
import { exhibitorSchema } from "@/lib/events/exhibitors.mjs";

function errorResponse(message, status, code = "EXHIBITOR_REQUEST_FAILED") {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(request, { params }) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to manage exhibitors.", 401, "UNAUTHENTICATED");
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const result = await listEventExhibitors((await params).eventId, organizationId);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json({ exhibitors: result.exhibitors });
}

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to manage exhibitors.", 401, "UNAUTHENTICATED");
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY");
  }
  const parsed = exhibitorSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Check the exhibitor details.", 422, "INVALID_EXHIBITOR");
  if (!body.organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const result = await createEventExhibitor((await params).eventId, body.organizationId, parsed.data);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json({ exhibitor: result.exhibitor }, { status: result.status });
}
