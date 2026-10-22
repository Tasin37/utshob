import { attendeesToCsv, listAttendees } from "@/lib/attendees/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET(request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to view attendees." } }, { status: 401 });

  const query = new URL(request.url).searchParams;
  const organizationId = query.get("organizationId");
  if (!organizationId) return Response.json({ error: { code: "ORGANIZATION_REQUIRED", message: "Choose an organization." } }, { status: 400 });

  const { eventId } = await params;
  try {
    const result = await listAttendees(eventId, organizationId);
    if (result.error) return Response.json({ error: { code: "ATTENDEES_FAILED", message: result.error } }, { status: result.status });
    if (query.get("format") === "csv") {
      return new Response(attendeesToCsv(result.attendees), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=utshob-attendees.csv",
        },
      });
    }
    return Response.json({ attendees: result.attendees });
  } catch (error) {
    console.error("Attendee query failed", error.code || error.name);
    return Response.json({ error: { code: "ATTENDEES_UNAVAILABLE", message: "Attendee data is temporarily unavailable." } }, { status: 503 });
  }
}