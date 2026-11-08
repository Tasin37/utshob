import test from "node:test";
import assert from "node:assert/strict";
import { eventDraftSchema, eventLocalToUtc, eventUtcToLocal, slugifyEventTitle, validateEventForPublishing } from "../lib/events/domain.mjs";
import { filterEvents } from "../lib/events/search.mjs";
import { selectFeaturedEvents } from "../lib/events/featured.mjs";
import { selectRecommendedEvents } from "../lib/events/recommendations.mjs";
import { createCalendarInvite } from "../lib/events/calendar.mjs";
import { speakerSchema } from "../lib/events/speakers.mjs";
import { sponsorSchema } from "../lib/events/sponsors.mjs";
import { exhibitorSchema } from "../lib/events/exhibitors.mjs";
import { webhookEndpointSchema } from "../lib/integrations/webhooks.mjs";

const validDraft = {
  organizationId: "organization-1",
  title: "Dhaka Design Gathering",
  description: "A day of talks and hands-on workshops.",
  startsAt: "2027-02-10T03:00:00.000Z",
  endsAt: "2027-02-10T10:00:00.000Z",
  venueName: "Bangla Academy",
};

const discoveryEvents = [
  { title: "Dhaka After Dark", category: "Music", date: "Oct 17, 2026", time: "6:30 PM", location: "Gulshan, Dhaka", price: "From ৳850" },
  { title: "Chattogram Makers Market", category: "Arts & culture", date: "Oct 24, 2026", time: "11:00 AM", location: "DC Hill, Chattogram", price: "Free entry" },
];

test("event title becomes a stable URL slug", () => {
  assert.equal(slugifyEventTitle("Dhaka Design Gathering!"), "dhaka-design-gathering");
});

test("event wall-clock values round-trip through the selected timezone", () => {
  const utc = eventLocalToUtc("2027-02-10T09:00", "Asia/Dhaka");
  assert.equal(utc, "2027-02-10T03:00:00.000Z");
  assert.equal(eventUtcToLocal(utc, "Asia/Dhaka"), "2027-02-10T09:00");
});

test("draft schema rejects titles that cannot produce a useful event", () => {
  const result = eventDraftSchema.safeParse({ ...validDraft, title: "Hi" });
  assert.equal(result.success, false);
});

test("valid in-person event can be published", () => {
  assert.deepEqual(validateEventForPublishing(eventDraftSchema.parse(validDraft)), []);
});

test("recurring events require a future end date", () => {
  const result = eventDraftSchema.safeParse({
    ...validDraft,
    recurrence: { frequency: "weekly", interval: 1, until: "2027-03-10T10:00:00.000Z" },
  });
  assert.equal(result.success, true);

  const missingEnd = eventDraftSchema.safeParse({
    ...validDraft,
    recurrence: { frequency: "weekly", interval: 1, until: null },
  });
  assert.equal(missingEnd.success, false);
});

test("online and hybrid events can be published without an online link", () => {
  for (const eventType of ["online", "hybrid"]) {
    const event = eventDraftSchema.parse({ ...validDraft, eventType, venueName: eventType === "hybrid" ? "Community hall" : "" });
    assert.deepEqual(validateEventForPublishing(event), []);
  }
});

test("publishing rejects missing venue and reversed dates", () => {
  const event = eventDraftSchema.parse({
    ...validDraft,
    eventType: "in_person",
    venueName: "",
    startsAt: "2027-02-11T10:00:00.000Z",
    endsAt: "2027-02-10T10:00:00.000Z",
  });
  assert.deepEqual(validateEventForPublishing(event), [
    "The end time must be after the start time.",
    "Add a venue name.",
  ]);
});

test("paid events require a positive ticket price", () => {
  const event = eventDraftSchema.parse({ ...validDraft, registrationMode: "paid" });
  assert.deepEqual(validateEventForPublishing(event), [
    "Set a ticket price greater than zero, or switch to RSVP.",
  ]);
});

test("discovery search includes displayed date, full month, price, and venue", () => {
  assert.deepEqual(filterEvents(discoveryEvents, "Oct 24"), [discoveryEvents[1]]);
  assert.deepEqual(filterEvents(discoveryEvents, "October 24"), [discoveryEvents[1]]);
  assert.deepEqual(filterEvents(discoveryEvents, "free chattogram"), [discoveryEvents[1]]);
});

test("multi-term discovery search is order independent and combines with category", () => {
  assert.deepEqual(filterEvents(discoveryEvents, "music dhaka", "Music"), [discoveryEvents[0]]);
  assert.deepEqual(filterEvents(discoveryEvents, "dhaka music", "Music"), [discoveryEvents[0]]);
  assert.deepEqual(filterEvents(discoveryEvents, "music chattogram", "Music"), []);
});

test("discovery search is case and diacritic insensitive", () => {
  assert.deepEqual(filterEvents(discoveryEvents, "ARTS CULTURE"), [discoveryEvents[1]]);
});

test("featured events prioritize the nearest upcoming events", () => {
  const now = new Date("2027-01-01T00:00:00.000Z");
  const events = [
    { title: "Later", startsAt: "2027-03-01T00:00:00.000Z" },
    { title: "Past", startsAt: "2026-12-01T00:00:00.000Z" },
    { title: "Soon", startsAt: "2027-01-10T00:00:00.000Z" },
  ];

  assert.deepEqual(selectFeaturedEvents(events, now).map((event) => event.title), ["Soon", "Later"]);
});

test("featured events fall back to available events when all dates have passed", () => {
  const now = new Date("2027-01-01T00:00:00.000Z");
  const events = [
    { title: "First", startsAt: "2026-12-01T00:00:00.000Z" },
    { title: "Second", startsAt: "2026-12-02T00:00:00.000Z" },
  ];

  assert.deepEqual(selectFeaturedEvents(events, now).map((event) => event.title), ["First", "Second"]);
});

test("recommendations prioritize related upcoming events and exclude seeds", () => {
  const now = new Date("2027-01-01T00:00:00.000Z");
  const events = [
    { slug: "seed", category: "Music", eventType: "in_person", location: "Dhaka", startsAt: "2027-01-05T00:00:00.000Z" },
    { slug: "related", category: "Music", eventType: "in_person", location: "Dhaka", startsAt: "2027-01-10T00:00:00.000Z" },
    { slug: "unrelated", category: "Technology", eventType: "online", location: "Online event", startsAt: "2027-01-02T00:00:00.000Z" },
  ];

  assert.deepEqual(selectRecommendedEvents(events, [events[0]], now).map((event) => event.slug), ["related", "unrelated"]);
});

test("calendar invites include UTC times and escaped event details", () => {
  const calendar = createCalendarInvite({
    id: "event-1",
    title: "Meetup, Dhaka",
    summary: "Bring a notebook.",
    description: "Talks; workshops",
    starts_at: "2027-02-10T03:00:00.000Z",
    ends_at: "2027-02-10T05:00:00.000Z",
    event_type: "in_person",
    venue_name: "Hall, A",
    venue_address: "Line 1",
  });

  assert.match(calendar, /DTSTART:20270210T030000Z/);
  assert.match(calendar, /SUMMARY:Meetup\\, Dhaka/);
  assert.ok(calendar.includes("DESCRIPTION:Bring a notebook.\\n\\nTalks\\; workshops"));
});

test("hybrid calendar invites include venue and online access", () => {
  const calendar = createCalendarInvite({
    id: "event-hybrid",
    title: "Hybrid workshop",
    starts_at: "2027-02-10T03:00:00.000Z",
    ends_at: "2027-02-10T05:00:00.000Z",
    event_type: "hybrid",
    venue_name: "Community hall",
    venue_address: "Dhaka",
    online_url: "https://example.com/join",
  });

  assert.match(calendar, /LOCATION:Community hall\\, Dhaka \| Online: https:\/\/example.com\/join/);
});

test("speaker profiles validate bounded public details", () => {
  assert.equal(speakerSchema.safeParse({
    name: "Ayesha Rahman",
    role: "Design researcher",
    bio: "A short introduction.",
    photoUrl: null,
    sortOrder: 0,
  }).success, true);
  assert.equal(speakerSchema.safeParse({ name: "A" }).success, false);
});

test("sponsor profiles validate links and bounded details", () => {
  assert.equal(sponsorSchema.safeParse({
    name: "North Star Labs",
    tagline: "Building better tools.",
    logoUrl: null,
    websiteUrl: "https://example.com",
    sortOrder: 0,
  }).success, true);
  assert.equal(sponsorSchema.safeParse({ name: "A", websiteUrl: "bad" }).success, false);
});

test("exhibitor profiles validate links, booth labels, and bounded details", () => {
  assert.equal(exhibitorSchema.safeParse({
    name: "Makers Collective",
    description: "Local makers and creative tools.",
    logoUrl: null,
    websiteUrl: "https://example.com",
    boothLabel: "B-12",
    sortOrder: 1,
  }).success, true);
  assert.equal(exhibitorSchema.safeParse({ name: "A", boothLabel: "B".repeat(81) }).success, false);
});

test("webhook endpoints validate URLs and supported event filters", () => {
  assert.equal(webhookEndpointSchema.safeParse({
    url: "https://example.com/hooks/utshob",
    events: ["registration.created", "order.paid"],
  }).success, true);
  assert.equal(webhookEndpointSchema.safeParse({
    url: "not-a-url",
    events: ["unknown.event"],
  }).success, false);
});