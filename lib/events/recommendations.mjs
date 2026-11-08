function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function locationKey(event) {
  if (normalize(event.eventType || event.event_type) === "online") return "online";
  return normalize(event.location).split(",")[0] || "unknown";
}

export function selectRecommendedEvents(events, seedEvents = [], now = new Date(), limit = 3) {
  const seeds = seedEvents.length ? seedEvents : events.slice(0, 1);
  const seedCategories = new Set(seeds.map((event) => normalize(event.category)).filter(Boolean));
  const seedTypes = new Set(seeds.map((event) => normalize(event.eventType || event.event_type)).filter(Boolean));
  const seedLocations = new Set(seeds.map(locationKey).filter((location) => location !== "unknown"));
  const seedSlugs = new Set(seeds.map((event) => event.slug).filter(Boolean));

  return events
    .filter((event) => !seedSlugs.has(event.slug))
    .map((event) => {
      const startsAt = event.startsAt ? new Date(event.startsAt) : null;
      const daysAway = startsAt ? Math.max(0, (startsAt - now) / 86400000) : 365;
      let score = 0;
      if (seedCategories.has(normalize(event.category))) score += 6;
      if (seedTypes.has(normalize(event.eventType || event.event_type))) score += 2;
      if (seedLocations.has(locationKey(event))) score += 2;
      if (startsAt && startsAt >= now) score += Math.max(0, 4 - Math.min(daysAway / 30, 4));
      if (!startsAt) score -= 2;
      return { event, score };
    })
    .sort((a, b) => b.score - a.score || new Date(a.event.startsAt || 0) - new Date(b.event.startsAt || 0))
    .slice(0, limit)
    .map(({ event }) => event);
}
