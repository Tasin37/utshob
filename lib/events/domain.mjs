import { z } from "zod";

export const eventDraftSchema = z.object({
  organizationId: z.string().min(1).max(128),
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().max(280).default(""),
  description: z.string().trim().max(12000).default(""),
  category: z.string().trim().min(1).max(80).default("Community"),
  eventType: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  timezone: z.string().trim().min(1).max(100).default("Asia/Dhaka"),
  startsAt: z.string().datetime().nullable().default(null),
  endsAt: z.string().datetime().nullable().default(null),
  recurrence: z.object({
    frequency: z.enum(["none", "weekly", "monthly"]).default("none"),
    interval: z.number().int().min(1).max(12).default(1),
    until: z.string().datetime().nullable().default(null),
  }).default({ frequency: "none", interval: 1, until: null }),
  venueName: z.string().trim().max(180).default(""),
  venueAddress: z.string().trim().max(500).default(""),
  onlineUrl: z.string().trim().url().nullable().default(null),
  capacity: z.number().int().positive().nullable().default(null),
  coverImageUrl: z.string().trim().url().nullable().default(null),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  registrationMode: z.enum(["rsvp", "paid"]).default("rsvp"),
  ticket: z.object({
    name: z.string().trim().min(1).max(100).default("General admission"),
    price: z.number().min(0).max(1000000).default(0),
    quantity: z.number().int().positive().nullable().default(null),
  }).default({ name: "General admission", price: 0, quantity: null }),
  attendeeQuestion: z.string().trim().max(300).default(""),
  faqs: z.array(z.object({
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(1000),
  })).max(8).default([]),
}).superRefine((event, context) => {
  if (event.recurrence.frequency !== "none" && !event.recurrence.until) {
    context.addIssue({ code: "custom", path: ["recurrence", "until"], message: "Choose an end date for a recurring event." });
  }
  if (event.recurrence.until && event.endsAt && new Date(event.recurrence.until) <= new Date(event.endsAt)) {
    context.addIssue({ code: "custom", path: ["recurrence", "until"], message: "The recurrence end date must be after the event end time." });
  }
});

export function slugifyEventTitle(title) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function eventLocalToUtc(value, timezone) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error("Enter a valid event date and time.");

  const [, year, month, day, hour, minute] = match.map(Number);
  const targetTime = Date.UTC(year, month - 1, day, hour, minute);
  let candidateTime = targetTime;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidateTime));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const observedTime = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    const adjustment = targetTime - observedTime;
    candidateTime += adjustment;
    if (adjustment === 0) break;
  }

  return new Date(candidateTime).toISOString();
}

export function eventUtcToLocal(value, timezone) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function validateEventForPublishing(event) {
  const problems = [];

  if (!event.description.trim()) problems.push("Add an event description.");
  if (!event.startsAt || !event.endsAt) problems.push("Add a start and end date.");
  if (event.startsAt && event.endsAt && new Date(event.endsAt) <= new Date(event.startsAt)) {
    problems.push("The end time must be after the start time.");
  }
  if (["in_person", "hybrid"].includes(event.eventType) && !event.venueName.trim()) {
    problems.push("Add a venue name.");
  }
  if (event.registrationMode === "paid" && event.ticket.price <= 0) {
    problems.push("Set a ticket price greater than zero, or switch to RSVP.");
  }

  return problems;
}