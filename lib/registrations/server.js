import "server-only";

import { getPool } from "@/lib/db/pool";
import { createTicketCredentials, registrationSchema } from "@/lib/registrations/domain.mjs";

export function validateRegistration(input) {
  return registrationSchema.safeParse(input);
}

export async function registerForEvent(slug, input, userId = null) {
  const eventResult = await getPool().query(
    `SELECT id
     FROM events WHERE slug = $1 AND status = 'published' AND visibility IN ('public', 'unlisted')
     LIMIT 1`,
    [slug],
  );
  const event = eventResult.rows[0];
  if (!event) return { error: "This event is not available for registration.", status: 404 };
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const lockedEventResult = await client.query(
      `SELECT id, title, capacity, registration_mode
       FROM events WHERE id = $1 FOR UPDATE`,
      [event.id],
    );
    const lockedEvent = lockedEventResult.rows[0];
    if (!lockedEvent || lockedEvent.registration_mode !== "rsvp") {
      await client.query("ROLLBACK");
      return { error: "Paid registration is not connected yet.", status: 422 };
    }

    const existing = await client.query(
      `SELECT id FROM registrations WHERE event_id = $1 AND lower(email) = lower($2) AND status = 'confirmed' LIMIT 1`,
      [lockedEvent.id, input.email],
    );
    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return { error: "This email is already registered for the event.", status: 409 };
    }

    if (event.capacity !== null) {
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1 AND status = 'confirmed'`,
        [lockedEvent.id],
      );
      if (countResult.rows[0].count >= event.capacity) {
        await client.query("ROLLBACK");
        return { error: "This event has reached capacity.", status: 409 };
      }
    }

    const registration = await client.query(
      `INSERT INTO registrations (event_id, user_id, email, full_name, phone)
       VALUES ($1, $2, $3, $4, NULLIF($5, ''))
       RETURNING id, full_name, email, created_at`,
      [lockedEvent.id, userId, input.email, input.fullName, input.phone],
    );
    const credentials = createTicketCredentials();
    const ticket = await client.query(
      `INSERT INTO tickets (event_id, registration_id, ticket_number, qr_token_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, ticket_number, issued_at`,
      [lockedEvent.id, registration.rows[0].id, credentials.ticketNumber, credentials.tokenHash],
    );
    await client.query("COMMIT");
    return {
      event: { title: lockedEvent.title, slug },
      registration: registration.rows[0],
      ticket: { ...ticket.rows[0], token: credentials.token },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return { error: "This email is already registered for the event.", status: 409 };
    throw error;
  } finally {
    client.release();
  }
}