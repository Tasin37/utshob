export function selectFeaturedEvents(events, now = new Date(), limit = 3) {
  const upcoming = events
    .filter((event) => event.startsAt && new Date(event.startsAt) >= now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  return (upcoming.length ? upcoming : events).slice(0, limit);
}
