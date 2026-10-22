import { getServerSession } from "@/lib/auth/session";
import { checkInTicket } from "@/lib/checkin/server";

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to check in attendees." } }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "INVALID_BODY", message: "Request body must be valid JSON." } }, { status: 400 });
  }
  if (!body.organizationId || !body.qrToken) {
    return Response.json({ error: { code: "CHECKIN_INPUT_REQUIRED", message: "Choose an organization and enter a ticket code." } }, { status: 422 });
  }

  let qrToken = body.qrToken.trim();
  try {
    const encoded = JSON.parse(qrToken);
    if (encoded?.ticket) qrToken = encoded.ticket;
  } catch {
    // Manual input can be the opaque token itself.
  }

  const { eventId } = await params;
  try {
    const result = await checkInTicket({ eventId, organizationId: body.organizationId, qrToken, method: body.method });
    if (result.error) return Response.json({ error: { code: "CHECKIN_FAILED", message: result.error } }, { status: result.status });
    return Response.json(result);
  } catch (error) {
    console.error("Check-in failed", error.code || error.name);
    return Response.json({ error: { code: "CHECKIN_UNAVAILABLE", message: "Check-in is temporarily unavailable." } }, { status: 503 });
  }
}