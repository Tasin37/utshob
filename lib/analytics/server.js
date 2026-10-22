import "server-only";

import { getPool } from "@/lib/db/pool";
import { requireOrganizationRole } from "@/lib/auth/session";

export async function getEventAnalytics(eventId, organizationId) {
  const access = await requireOrganizationRole(organizationId, ["owner", "admin", "analyst", "member", "checkin_staff"]);
  if (!access.allowed) return { error: "You do not have access to this organization.", status: access.status };

  const eventResult = await getPool().query(
    `SELECT id, title, slug, status, capacity FROM events WHERE id = $1 AND organization_id = $2 LIMIT 1`,
    [eventId, organizationId],
  );
  const event = eventResult.rows[0];
  if (!event) return { error: "Event not found in this organization.", status: 404 };

  const [registrationResult, ticketResult, checkinResult, dailyResult] = await Promise.all([
    getPool().query(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
       FROM registrations WHERE event_id = $1`,
      [eventId],
    ),
    getPool().query(
      `SELECT COUNT(*)::int AS issued FROM tickets WHERE event_id = $1 AND status = 'issued'`,
      [eventId],
    ),
    getPool().query(
      `SELECT COUNT(*)::int AS count FROM checkins WHERE event_id = $1`,
      [eventId],
    ),
    getPool().query(
      `SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'Mon DD') AS day, COUNT(*)::int AS count
       FROM registrations WHERE event_id = $1 AND status = 'confirmed'
       GROUP BY day, DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 7`,
      [eventId],
    ),
  ]);

  const registrations = registrationResult.rows[0];
  const ticketsIssued = ticketResult.rows[0].issued;
  const checkins = checkinResult.rows[0].count;
  return {
    event,
    metrics: {
      registrations: registrations.confirmed,
      cancelled: registrations.cancelled,
      ticketsIssued,
      checkins,
      checkinRate: ticketsIssued ? Math.round((checkins / ticketsIssued) * 100) : 0,
      capacityRemaining: event.capacity === null ? null : Math.max(event.capacity - registrations.confirmed, 0),
    },
    registrationsByDay: dailyResult.rows.reverse(),
  };
}