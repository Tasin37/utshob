import { z } from "zod";
import { createTicketCredentials } from "../registrations/domain.mjs";
export const orderSchema = z.object({
  eventId: z.string().min(1),
  ticketTypeId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
  idempotencyKey: z.string().min(1).max(255),
  promoCode: z.string().trim().min(1).max(32).optional(),
  metadata: z.record(z.string()).optional(),
});

export const promoCodeSchema = z.object({
  eventId: z.string().min(1),
  code: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().int().positive(),
  maxUses: z.number().int().positive().nullable().default(null),
  startsAt: z.string().datetime().nullable().default(null),
  endsAt: z.string().datetime().nullable().default(null),
}).superRefine((promo, context) => {
  if (promo.discountType === "percent" && promo.discountValue > 100) {
    context.addIssue({ code: "too_big", maximum: 100, origin: "number", path: ["discountValue"], message: "Percentage discounts cannot exceed 100%." });
  }
  if (promo.startsAt && promo.endsAt && new Date(promo.endsAt) <= new Date(promo.startsAt)) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "The promo code end time must be after its start time." });
  }
});

export function calculatePromoDiscount({ subtotalMinor, discountType, discountValue }) {
  if (discountType === "percent") return Math.min(subtotalMinor, Math.floor(subtotalMinor * discountValue / 100));
  return Math.min(subtotalMinor, discountValue);
}

export function validateOrderInput(input) {
  return orderSchema.safeParse(input);
}

function serializeOrder(order) {
  return {
    id: order.id,
    eventId: order.event_id,
    registrationId: order.registration_id,
    userId: order.user_id,
    amountMinor: order.amount_minor,
    currency: order.currency,
    status: order.status,
    provider: order.provider,
    providerReference: order.provider_reference,
    promoCodeId: order.promo_code_id || null,
    discountMinor: order.discount_minor || 0,
    idempotencyKey: order.idempotency_key,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export async function createOrder(input, userId = null) {
  const parsed = validateOrderInput(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid order input.", status: 422 };
  }

  const { eventId, ticketTypeId, quantity, idempotencyKey, promoCode } = parsed.data;
  const pool = (await import("@/lib/db/pool.js")).getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ticketResult = await client.query(
      `SELECT id, event_id, name, price_minor, currency, quantity
       FROM ticket_types WHERE id = $1 AND status = 'active' FOR UPDATE`,
      [ticketTypeId],
    );
    const ticketType = ticketResult.rows[0];
    if (!ticketType) {
      await client.query("ROLLBACK");
      return { error: "Ticket type not found or not available.", status: 404 };
    }
    if (ticketType.event_id !== eventId) {
      await client.query("ROLLBACK");
      return { error: "Ticket type does not belong to this event.", status: 422 };
    }

    const eventResult = await client.query(
      `SELECT id, registration_mode FROM events WHERE id = $1 FOR UPDATE`,
      [eventId],
    );
    const event = eventResult.rows[0];
    if (!event) {
      await client.query("ROLLBACK");
      return { error: "Event not found.", status: 404 };
    }
    if (event.registration_mode !== "paid") {
      await client.query("ROLLBACK");
      return { error: "This event does not accept paid registrations.", status: 422 };
    }

    const existingOrder = await client.query(
      `SELECT * FROM orders WHERE idempotency_key = $1 LIMIT 1`,
      [idempotencyKey],
    );
    if (existingOrder.rowCount) {
      await client.query("ROLLBACK");
      if (existingOrder.rows[0].user_id !== userId) {
        return { error: "This idempotency key is already in use.", status: 409 };
      }
      return { order: serializeOrder(existingOrder.rows[0]), status: 200 };
    }

    let promo = null;
    if (promoCode) {
      const promoResult = await client.query(
        `SELECT id, code, discount_type, discount_value, max_uses, used_count, starts_at, ends_at
         FROM promo_codes
         WHERE event_id = $1 AND upper(code) = upper($2) AND active = true
         FOR UPDATE`,
        [eventId, promoCode],
      );
      promo = promoResult.rows[0];
      const now = Date.now();
      if (!promo
        || (promo.starts_at && new Date(promo.starts_at).getTime() > now)
        || (promo.ends_at && new Date(promo.ends_at).getTime() <= now)
        || (promo.max_uses !== null && promo.used_count >= promo.max_uses)) {
        await client.query("ROLLBACK");
        return { error: "This promo code is invalid, expired, or no longer available.", status: 422 };
      }
    }

    if (ticketType.quantity !== null) {
      const reservedResult = await client.query(
        `SELECT COALESCE(SUM(oi.quantity), 0)::int AS quantity
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.ticket_type_id = $1 AND o.status IN ('pending', 'paid')`,
        [ticketTypeId],
      );
      if (reservedResult.rows[0].quantity + quantity > ticketType.quantity) {
        await client.query("ROLLBACK");
        return { error: "This ticket type has reached capacity.", status: 409 };
      }
    }

    const unitPriceMinor = ticketType.price_minor;
    const subtotalMinor = unitPriceMinor * quantity;
    const discountMinor = promo
      ? calculatePromoDiscount({
        subtotalMinor,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
      })
      : 0;
    const totalMinor = subtotalMinor - discountMinor;

    const userResult = await client.query(
      `SELECT id, name, email FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const user = userResult.rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      return { error: "Account details could not be found.", status: 401 };
    }

    const existingRegistration = await client.query(
      `SELECT id FROM registrations
       WHERE event_id = $1 AND lower(email) = lower($2) AND status <> 'cancelled'
       LIMIT 1`,
      [eventId, user.email],
    );
    if (existingRegistration.rowCount) {
      await client.query("ROLLBACK");
      return { error: "This email is already registered for the event.", status: 409 };
    }

    const registrationResult = await client.query(
      `INSERT INTO registrations (event_id, user_id, email, full_name, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [eventId, user.id, user.email, user.name || user.email],
    );
    const registrationId = registrationResult.rows[0].id;

    const orderResult = await client.query(
      `INSERT INTO orders (event_id, registration_id, user_id, amount_minor, currency, status, provider, idempotency_key, promo_code_id, discount_minor)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'bkash', $6, $7, $8)
       RETURNING id, event_id, registration_id, user_id, amount_minor, currency, status, provider, idempotency_key, promo_code_id, discount_minor, created_at`,
      [eventId, registrationId, userId, totalMinor, ticketType.currency, idempotencyKey, promo?.id || null, discountMinor],
    );
    const order = orderResult.rows[0];

    if (promo) {
      await client.query("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1", [promo.id]);
    }

    await client.query(
      `INSERT INTO order_items (order_id, ticket_type_id, quantity, unit_price_minor, total_minor)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.id, ticketTypeId, quantity, unitPriceMinor, totalMinor],
    );

    await client.query("COMMIT");
    return { order: serializeOrder(order), status: 201 };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      const existing = await pool.query(
        `SELECT * FROM orders WHERE idempotency_key = $1 LIMIT 1`,
        [idempotencyKey],
      );
      if (existing.rowCount) {
        if (existing.rows[0].user_id !== userId) {
          return { error: "This idempotency key is already in use.", status: 409 };
        }
        return { order: serializeOrder(existing.rows[0]), status: 200 };
      }
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrder(orderId, userId = null) {
  const pool = (await import("@/lib/db/pool.js")).getPool();
  const orderResult = await pool.query(
    `SELECT o.*, r.status AS registration_status, r.full_name AS registration_full_name,
      r.email AS registration_email
     FROM orders o
     LEFT JOIN registrations r ON r.id = o.registration_id
     WHERE o.id = $1`,
    [orderId],
  );
  const order = orderResult.rows[0];
  if (!order) return { error: "Order not found.", status: 404 };

  if (userId && order.user_id !== userId) {
    return { error: "You do not have access to this order.", status: 403 };
  }

  const [itemsResult, ticketsResult] = await Promise.all([
    pool.query(
      `SELECT ticket_type_id, quantity, unit_price_minor, total_minor
       FROM order_items WHERE order_id = $1 ORDER BY id`,
      [orderId],
    ),
    pool.query(
      `SELECT ticket_number, status, issued_at
       FROM tickets WHERE registration_id = $1 ORDER BY issued_at`,
      [order.registration_id],
    ),
  ]);

  return {
    order: {
      ...serializeOrder(order),
      registration: order.registration_id ? {
        id: order.registration_id,
        status: order.registration_status,
        fullName: order.registration_full_name,
        email: order.registration_email,
      } : null,
      items: itemsResult.rows.map((item) => ({
        ticketTypeId: item.ticket_type_id,
        quantity: item.quantity,
        unitPriceMinor: item.unit_price_minor,
        totalMinor: item.total_minor,
      })),
      tickets: ticketsResult.rows,
    },
  };
}

export async function updateOrderStatus(orderId, status, providerReference = null) {
  const validStatuses = ["pending", "paid", "failed", "refunded", "cancelled"];
  if (!validStatuses.includes(status)) {
    return { error: "Invalid order status.", status: 422 };
  }

  const pool = (await import("@/lib/db/pool.js")).getPool();
  const result = await pool.query(
    `UPDATE orders
     SET status = $1, updated_at = NOW(), provider_reference = COALESCE($2, provider_reference)
     WHERE id = $3
     RETURNING id, status, provider_reference, updated_at`,
    [status, providerReference, orderId],
  );
  if (!result.rowCount) return { error: "Order not found.", status: 404 };
  return { order: result.rows[0] };
}

export async function completeSuccessfulPayment({ orderId, providerReference, amountMinor, currency }) {
  const pool = (await import("@/lib/db/pool.js")).getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      `SELECT o.*, r.status AS registration_status
       FROM orders o
       LEFT JOIN registrations r ON r.id = o.registration_id
       WHERE o.id = $1
       FOR UPDATE`,
      [orderId],
    );
    const order = orderResult.rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return { error: "Order not found.", status: 404 };
    }

    if (order.amount_minor !== amountMinor || order.currency.toLowerCase() !== currency.toLowerCase()) {
      await client.query("ROLLBACK");
      return { error: "Payment amount does not match the order.", status: 422 };
    }

    if (order.status === "paid") {
      await client.query("ROLLBACK");
      return { order: serializeOrder(order), status: 200, alreadyCompleted: true };
    }
    if (order.status !== "pending") {
      await client.query("ROLLBACK");
      return { error: "Order is not awaiting payment.", status: 409 };
    }

    const itemResult = await client.query(
      `SELECT ticket_type_id, quantity
       FROM order_items
       WHERE order_id = $1
       ORDER BY id`,
      [orderId],
    );
    if (!itemResult.rowCount) {
      await client.query("ROLLBACK");
      return { error: "Order has no ticket items.", status: 422 };
    }

    const updatedOrderResult = await client.query(
      `UPDATE orders
       SET status = 'paid', provider_reference = COALESCE($1, provider_reference), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [providerReference, orderId],
    );

    if (order.registration_id) {
      await client.query(
        `UPDATE registrations
         SET status = 'confirmed', updated_at = NOW()
         WHERE id = $1 AND status = 'pending'`,
        [order.registration_id],
      );

      const existingTickets = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM tickets
         WHERE registration_id = $1`,
        [order.registration_id],
      );
      if (existingTickets.rows[0].count === 0) {
        for (const item of itemResult.rows) {
          for (let index = 0; index < item.quantity; index += 1) {
            const credentials = createTicketCredentials();
            await client.query(
              `INSERT INTO tickets (event_id, registration_id, ticket_type_id, ticket_number, qr_token_hash)
               SELECT $1, $2, $3, $4, $5`,
              [order.event_id, order.registration_id, item.ticket_type_id, credentials.ticketNumber, credentials.tokenHash],
            );
          }
        }
      }
    }

    await client.query("COMMIT");
    const { dispatchWebhookEvent } = await import("@/lib/integrations/webhooks-server");
    dispatchWebhookEvent("order.paid", {
      orderId: updatedOrderResult.rows[0].id,
      eventId: updatedOrderResult.rows[0].event_id,
      registrationId: updatedOrderResult.rows[0].registration_id,
      amountMinor: updatedOrderResult.rows[0].amount_minor,
      currency: updatedOrderResult.rows[0].currency,
      providerReference: updatedOrderResult.rows[0].provider_reference,
    }).catch((error) => console.error("Failed to dispatch payment webhook", error.message));
    return { order: serializeOrder(updatedOrderResult.rows[0]), status: 200 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function failPayment(orderId, providerReference = null) {
  const pool = (await import("@/lib/db/pool.js")).getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE orders
       SET status = CASE WHEN status = 'pending' THEN 'failed' ELSE status END,
           provider_reference = COALESCE($1, provider_reference),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [providerReference, orderId],
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return { error: "Order not found.", status: 404 };
    }

    await client.query(
      `UPDATE registrations
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = (SELECT registration_id FROM orders WHERE id = $1)
         AND status = 'pending'`,
      [orderId],
    );
    await client.query("COMMIT");
    return { order: serializeOrder(result.rows[0]), status: 200 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOrdersByEvent(eventId, organizationId) {
  const pool = (await import("@/lib/db/pool.js")).getPool();
  const eventResult = await pool.query(
    `SELECT id FROM events WHERE id = $1 AND organization_id = $2 LIMIT 1`,
    [eventId, organizationId],
  );
  if (!eventResult.rowCount) return { error: "Event not found in this organization.", status: 404 };

  const result = await pool.query(
    `SELECT o.id, o.amount_minor, o.currency, o.status, o.provider, o.provider_reference,
      o.idempotency_key, o.created_at, o.updated_at,
      r.email AS registration_email, r.full_name AS registration_full_name
     FROM orders o
     LEFT JOIN registrations r ON r.id = o.registration_id
     WHERE o.event_id = $1
     ORDER BY o.created_at DESC`,
    [eventId],
  );
  return { orders: result.rows };
}
