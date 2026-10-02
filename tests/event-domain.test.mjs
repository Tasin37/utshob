import test from "node:test";
import assert from "node:assert/strict";
import { eventDraftSchema, eventLocalToUtc, eventUtcToLocal, slugifyEventTitle, validateEventForPublishing } from "../lib/events/domain.mjs";
import { filterEvents } from "../lib/events/search.mjs";

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