import EventDirectory from "@/components/events/event-directory";
import { getPublicEvents } from "@/lib/events/server";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getPublicEvents();
  return <EventDirectory events={events} />;
}
