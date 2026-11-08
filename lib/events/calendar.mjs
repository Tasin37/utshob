function escapeCalendarText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

function formatUtc(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function createCalendarInvite(event) {
  if (!event.starts_at || !event.ends_at) {
    throw new Error("An event needs start and end times before a calendar reminder can be created.");
  }

  const venue = [event.venue_name, event.venue_address].filter(Boolean).join(", ");
  const location = event.event_type === "online"
    ? event.online_url || "Online event"
    : event.event_type === "hybrid"
      ? [venue || "In-person venue to be announced", event.online_url ? `Online: ${event.online_url}` : "Online access details to be announced"].join(" | ")
      : venue || "Venue to be announced";
  const description = [event.summary, event.description].filter(Boolean).join("\n\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Utshob//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeCalendarText(event.id)}@utshob`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(event.starts_at)}`,
    `DTEND:${formatUtc(event.ends_at)}`,
    `SUMMARY:${escapeCalendarText(event.title)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
