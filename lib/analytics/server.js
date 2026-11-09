import "server-only";

import { getPool } from "@/lib/db/pool";
import { requireOrganizationRole } from "@/lib/auth/session";

export async function getEventAnalytics(eventId, organizationId) {
  const access = await requireOrganizationRole(organizationId, ["owner", "admin", "analyst", "member", "checkin_staff"]);
  if (!access.allowed) return { error: "You do not have access to this organization.", status: access.status };

  const pool = getPool();
  const eventResult = await pool.query(
    `SELECT id, title, slug, status, capacity FROM events WHERE id = $1 AND organization_id = $2 LIMIT 1`,
    [eventId, organizationId],
  );
  const event = eventResult.rows[0];
  if (!event) return { error: "Event not found in this organization.", status: 404 };

  const schemaResult = await pool.query(
    `SELECT to_regclass('public.orders') IS NOT NULL AS has_orders,
      to_regclass('public.order_items') IS NOT NULL AS has_order_items`,
  );
  const hasPaymentTables = schemaResult.rows[0].has_orders && schemaResult.rows[0].has_order_items;

  const [registrationResult, ticketResult, checkinResult, dailyResult, revenueResult, paymentResult, ticketTypeResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
       FROM registrations WHERE event_id = $1`,
      [eventId],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS issued FROM tickets WHERE event_id = $1 AND status = 'issued'`,
      [eventId],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM checkins WHERE event_id = $1`,
      [eventId],
    ),
    pool.query(
      `SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'Mon DD') AS day, COUNT(*)::int AS count
       FROM registrations WHERE event_id = $1 AND status = 'confirmed'
       GROUP BY day, DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 7`,
      [eventId],
    ),
    hasPaymentTables ? pool.query(
      `SELECT COALESCE(SUM(amount_minor) FILTER (WHERE status = 'paid'), 0)::int AS revenue,
        COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_orders,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
        COUNT(*) FILTER (WHERE status IN ('failed', 'cancelled'))::int AS failed_orders
       FROM orders WHERE event_id = $1`,
      [eventId],
    ) : Promise.resolve({ rows: [{ revenue: 0, paid_orders: 0, pending_orders: 0, failed_orders: 0 }] }),
    pool.query(
      `SELECT TO_CHAR(checked_in_at AT TIME ZONE 'UTC', 'Mon DD') AS day, COUNT(*)::int AS count
       FROM checkins WHERE event_id = $1
       GROUP BY day, DATE(checked_in_at) ORDER BY DATE(checked_in_at) DESC LIMIT 7`,
      [eventId],
    ),
    hasPaymentTables ? pool.query(
      `SELECT tt.name, tt.quantity,
        COALESCE(SUM(oi.quantity) FILTER (WHERE o.status = 'paid'), 0)::int AS sold
       FROM ticket_types tt
       LEFT JOIN order_items oi ON oi.ticket_type_id = tt.id
       LEFT JOIN orders o ON o.id = oi.order_id
       WHERE tt.event_id = $1
       GROUP BY tt.id, tt.name
       ORDER BY sold DESC, tt.name`,
      [eventId],
    ) : pool.query(
      `SELECT name, quantity, 0::int AS sold
       FROM ticket_types WHERE event_id = $1 ORDER BY name`,
      [eventId],
    ),
  ]);

  const registrations = registrationResult.rows[0];
  const ticketsIssued = ticketResult.rows[0].issued;
  const checkins = checkinResult.rows[0].count;
  const revenue = revenueResult.rows[0];
  const totalTicketCapacity = ticketTypeResult.rows.reduce(
    (total, ticket) => total + (ticket.quantity || 0),
    0,
  );
  const soldTickets = ticketTypeResult.rows.reduce((total, ticket) => total + ticket.sold, 0);
  return {
    event,
    metrics: {
      registrations: registrations.confirmed,
      cancelled: registrations.cancelled,
      ticketsIssued,
      checkins,
      checkinRate: ticketsIssued ? Math.round((checkins / ticketsIssued) * 100) : 0,
      capacityRemaining: event.capacity === null ? null : Math.max(event.capacity - registrations.confirmed, 0),
      revenueMinor: revenue.revenue,
      paidOrders: revenue.paid_orders,
      pendingOrders: revenue.pending_orders,
      failedOrders: revenue.failed_orders,
      averageOrderValueMinor: revenue.paid_orders ? Math.round(revenue.revenue / revenue.paid_orders) : 0,
      sellThroughRate: totalTicketCapacity ? Math.round((soldTickets / totalTicketCapacity) * 100) : null,
      attendanceRate: ticketsIssued ? Math.round((checkins / ticketsIssued) * 100) : 0,
    },
    registrationsByDay: dailyResult.rows.reverse(),
    checkinsByDay: paymentResult.rows.reverse(),
    ticketsByType: ticketTypeResult.rows,
  };
}