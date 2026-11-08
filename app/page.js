import HomePage from "@/components/home-page";
import { selectFeaturedEvents } from "@/lib/events/featured.mjs";
import { selectRecommendedEvents } from "@/lib/events/recommendations.mjs";
import { getPublicEvents } from "@/lib/events/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const events = await getPublicEvents();
  const featuredEvents = selectFeaturedEvents(events);
  const recommendedEvents = selectRecommendedEvents(events, featuredEvents);
  return <HomePage events={events.slice(0, 6)} featuredEvents={featuredEvents} recommendedEvents={recommendedEvents} />;
}
