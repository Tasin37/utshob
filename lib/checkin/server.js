import "server-only";

import crypto from "node:crypto";
import { getPool } from "@/lib/db/pool";
import { requireOrganizationRole } from "@/lib/auth/session";

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function checkInTicket({ eventId, organizationId, qrToken, method = "manual" }) {
  const access = await requireOrganizationRole(organizationId, ["owner", "admin", "checkin_staff"]);
  if (!access.allowed) return { error: "You do not have check-in access for this organization.", status: access.status };

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const ticketResult = await client.query(
      `SELECT tickets.id, tickets.ticket_number, tickets.status, registrations.full_name, registrations.email
       FROM tickets JOIN registrations ON registrations.id = tickets.registration_id
       WHERE tickets.event_id = $1 AND (tickets.qr_token_hash = $2 OR tickets.ticket_number = $3)
       FOR UPDATE`,
      [eventId, tokenHash(qrToken), qrToken.trim().toUpperCase()],
    );
    const ticket = ticketResult.rows[0];
    if (!ticket) {
      await client.query("ROLLBACK");
      return { error: "Ticket not found or invalid for this event.", status: 404 };
    }
    if (ticket.status !== "issued") {
      await client.query("ROLLBACK");
      return { error: "This ticket is cancelled or already unavailable.", status: 409 };
    }

    const existing = await client.query("SELECT checked_in_at FROM checkins WHERE ticket_id = $1", [ticket.id]);
    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return { status: "already_checked_in", checkedInAt: existing.rows[0].checked_in_at, attendeeName: ticket.full_name, ticketNumber: ticket.ticket_number };
    }

    const checkin = await client.query(
      `INSERT INTO checkins (event_id, ticket_id, checked_in_by, method)
       VALUES ($1, $2, $3, $4)
       RETURNING checked_in_at`,
      [eventId, ticket.id, access.session.user.id, method === "qr" ? "qr" : "manual"],
    );
    await client.query("COMMIT");
    return { status: "checked_in", checkedInAt: checkin.rows[0].checked_in_at, attendeeName: ticket.full_name, ticketNumber: ticket.ticket_number };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}