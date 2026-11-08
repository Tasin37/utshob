import { getServerSession } from "@/lib/auth/session";
import { createEventSponsor, listEventSponsors } from "@/lib/events/sponsors-server";
import { sponsorSchema } from "@/lib/events/sponsors.mjs";

function errorResponse(message, status, code = "SPONSOR_REQUEST_FAILED") {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(request, { params }) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to manage sponsors.", 401, "UNAUTHENTICATED");
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const result = await listEventSponsors((await params).eventId, organizationId);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json({ sponsors: result.sponsors });
}

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to manage sponsors.", 401, "UNAUTHENTICATED");
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY");
  }
  const parsed = sponsorSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Check the sponsor details.", 422, "INVALID_SPONSOR");
  if (!body.organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const result = await createEventSponsor((await params).eventId, body.organizationId, parsed.data);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json({ sponsor: result.sponsor }, { status: result.status });
}
