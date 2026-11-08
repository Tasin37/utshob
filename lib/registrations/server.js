import "server-only";

import { getPool } from "@/lib/db/pool";
import { createTicketCredentials, registrationSchema } from "@/lib/registrations/domain.mjs";
import { dispatchWebhookEvent } from "@/lib/integrations/webhooks-server";

export function validateRegistration(input) {
  return registrationSchema.safeParse(input);
}

export async function registerForEvent(slug, input, userId = null) {
  const eventResult = await getPool().query(
    `SELECT id, organization_id
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
      `SELECT id, title, capacity, registration_mode, waitlist_enabled
       FROM events WHERE id = $1 FOR UPDATE`,
      [event.id],
    );
    const lockedEvent = lockedEventResult.rows[0];
    if (!lockedEvent) {
      await client.query("ROLLBACK");
      return { error: "This event is not available for registration.", status: 404 };
    }

    const existing = await client.query(
      `SELECT id FROM registrations WHERE event_id = $1 AND lower(email) = lower($2) AND status = 'confirmed' LIMIT 1`,
      [lockedEvent.id, input.email],
    );
    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return { error: "This email is already registered for the event.", status: 409 };
    }

    if (lockedEvent.registration_mode === "rsvp") {
      if (lockedEvent.capacity !== null) {
        const countResult = await client.query(
          `SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1 AND status = 'confirmed'`,
          [lockedEvent.id],
        );
        if (countResult.rows[0].count >= event.capacity) {
          if (!lockedEvent.waitlist_enabled) {
            await client.query("ROLLBACK");
            return { error: "This event has reached capacity.", status: 409 };
          }
          const waitlisted = await client.query(
            `INSERT INTO registrations (event_id, user_id, email, full_name, phone, status)
             VALUES ($1, $2, $3, $4, NULLIF($5, ''), 'waitlisted')
             RETURNING id, full_name, email, created_at, status`,
            [lockedEvent.id, userId, input.email, input.fullName, input.phone],
          );
          await client.query("COMMIT");
          dispatchWebhookEvent("registration.created", {
            registrationId: waitlisted.rows[0].id,
            eventId: lockedEvent.id,
            status: "waitlisted",
            fullName: input.fullName,
            email: input.email,
          }).catch((error) => console.error("Failed to dispatch registration webhook", error.message));
          return {
            event: { title: lockedEvent.title, slug },
            registration: waitlisted.rows[0],
            waitlisted: true,
          };
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
      dispatchWebhookEvent("registration.created", {
        registrationId: registration.rows[0].id,
        eventId: lockedEvent.id,
        status: "confirmed",
        fullName: input.fullName,
        email: input.email,
        ticketNumber: ticket.rows[0].ticket_number,
      }).catch((error) => console.error("Failed to dispatch registration webhook", error.message));
      return {
        event: { title: lockedEvent.title, slug },
        registration: registration.rows[0],
        ticket: { ...ticket.rows[0], token: credentials.token },
      };
    }

    if (lockedEvent.registration_mode === "paid") {
      const ticketTypeResult = await client.query(
        `SELECT id, price_minor, currency, quantity
         FROM ticket_types WHERE event_id = $1 AND status = 'active' LIMIT 1`,
        [lockedEvent.id],
      );
      const ticketType = ticketTypeResult.rows[0];
      if (!ticketType) {
        await client.query("ROLLBACK");
        return { error: "No ticket type available for this event.", status: 422 };
      }
      if (ticketType.quantity !== null) {
        const soldResult = await client.query(
          `SELECT COALESCE(SUM(oi.quantity), 0)::int AS quantity
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE oi.ticket_type_id = $1 AND o.status IN ('pending', 'paid')`,
          [ticketType.id],
        );
        if (soldResult.rows[0].quantity >= ticketType.quantity) {
          await client.query("ROLLBACK");
          return { error: "This ticket type has reached capacity.", status: 409 };
        }
      }

      const registration = await client.query(
        `INSERT INTO registrations (event_id, user_id, email, full_name, phone, status)
         VALUES ($1, $2, $3, $4, NULLIF($5, ''), 'pending')
         RETURNING id, full_name, email, created_at, status`,
        [lockedEvent.id, userId, input.email, input.fullName, input.phone],
      );

      const idempotencyKey = `reg_${registration.rows[0].id}`;
      const amountMinor = ticketType.price_minor;
      const orderResult = await client.query(
        `INSERT INTO orders (event_id, registration_id, user_id, amount_minor, currency, status, provider, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, 'pending', 'bkash', $6)
         RETURNING id, event_id, registration_id, user_id, amount_minor, currency, status, provider, idempotency_key, created_at`,
        [lockedEvent.id, registration.rows[0].id, userId, amountMinor, ticketType.currency, idempotencyKey],
      );
      await client.query(
        `INSERT INTO order_items (order_id, ticket_type_id, quantity, unit_price_minor, total_minor)
         VALUES ($1, $2, 1, $3, $3)`,
        [orderResult.rows[0].id, ticketType.id, ticketType.price_minor],
      );

      await client.query("COMMIT");
      dispatchWebhookEvent("registration.created", {
        registrationId: registration.rows[0].id,
        eventId: lockedEvent.id,
        status: "pending",
        fullName: input.fullName,
        email: input.email,
        orderId: orderResult.rows[0].id,
      }).catch((error) => console.error("Failed to dispatch registration webhook", error.message));
      return {
        event: { title: lockedEvent.title, slug },
        registration: registration.rows[0],
        order: orderResult.rows[0],
        requiresPayment: true,
      };
    }

    await client.query("ROLLBACK");
    return { error: "This event does not support registration.", status: 422 };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return { error: "This email is already registered for the event.", status: 409 };
    throw error;
  } finally {
    client.release();
  }
}