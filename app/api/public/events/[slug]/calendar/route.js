import { getPublicEvent } from "@/lib/events/server";
import { createCalendarInvite } from "@/lib/events/calendar.mjs";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return Response.json({ error: { code: "EVENT_NOT_FOUND", message: "Event not found." } }, { status: 404 });

  try {
    const calendar = createCalendarInvite(event);
    return new Response(calendar, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    return Response.json({ error: { code: "CALENDAR_UNAVAILABLE", message: error.message } }, { status: 422 });
  }
}
