import "server-only";

import { getPool } from "@/lib/db/pool";
import { requireOrganizationRole } from "@/lib/auth/session";

const attendeeRoles = ["owner", "admin", "analyst", "member"];

export async function listAttendees(eventId, organizationId) {
  const access = await requireOrganizationRole(organizationId, attendeeRoles);
  if (!access.allowed) return { error: "You do not have access to attendee data.", status: access.status };

  const result = await getPool().query(
    `SELECT registrations.id, registrations.full_name, registrations.email, registrations.phone,
      registrations.status, registrations.created_at, tickets.ticket_number,
      checkins.checked_in_at
     FROM registrations
     JOIN events ON events.id = registrations.event_id
     LEFT JOIN tickets ON tickets.registration_id = registrations.id
     LEFT JOIN checkins ON checkins.ticket_id = tickets.id
     WHERE registrations.event_id = $1 AND events.organization_id = $2
     ORDER BY registrations.created_at DESC`,
    [eventId, organizationId],
  );
  return { attendees: result.rows };
}

export function attendeesToCsv(attendees) {
  const headers = ["name", "email", "phone", "status", "ticket_number", "checked_in_at", "registered_at"];
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    headers.join(","),
    ...attendees.map((attendee) => [
      attendee.full_name,
      attendee.email,
      attendee.phone,
      attendee.status,
      attendee.ticket_number,
      attendee.checked_in_at,
      attendee.created_at,
    ].map(escape).join(",")),
  ].join("\r\n");
}