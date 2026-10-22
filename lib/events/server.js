import "server-only";

import { getPool } from "@/lib/db/pool";
import { requireOrganizationRole } from "@/lib/auth/session";
import { eventDraftSchema, slugifyEventTitle, validateEventForPublishing } from "@/lib/events/domain.mjs";

const editorRoles = ["owner", "admin"];
const readerRoles = ["owner", "admin", "member", "checkin_staff"];

export async function authorizeEventAccess(organizationId, roles) {
  return requireOrganizationRole(organizationId, roles);
}

export function validateEventDraft(input) {
  return eventDraftSchema.safeParse(input);
}

async function replaceTicketAndQuestion(client, eventId, draft) {
  await client.query("DELETE FROM ticket_types WHERE event_id = $1", [eventId]);
  if (draft.registrationMode === "paid") {
    await client.query(
      `INSERT INTO ticket_types (event_id, name, price_minor, currency, quantity)
       VALUES ($1, $2, $3, 'BDT', $4)`,
      [eventId, draft.ticket.name, Math.round(draft.ticket.price * 100), draft.ticket.quantity],
    );
  }

  await client.query("DELETE FROM event_questions WHERE event_id = $1", [eventId]);
  if (draft.attendeeQuestion) {
    await client.query(
      `INSERT INTO event_questions (event_id, label, field_key, field_type, required, sort_order)
       VALUES ($1, $2, 'organizer_question', 'text', false, 0)`,
      [eventId, draft.attendeeQuestion],
    );
  }
}

function eventValues(draft) {
  return [
    draft.title,
    slugifyEventTitle(draft.title) || "event",
    draft.summary,
    draft.description,
    draft.category,
    draft.eventType,
    draft.visibility,
    draft.timezone,
    draft.startsAt,
    draft.endsAt,
    draft.venueName,
    draft.venueAddress,
    draft.onlineUrl,
    draft.capacity,
    draft.coverImageUrl,
    draft.registrationMode,
  ];
}

export async function createEventDraft(draft, session) {
  const access = await authorizeEventAccess(draft.organizationId, editorRoles);
  if (!access.allowed) return { error: "You do not have permission to create events in this organization.", status: access.status };

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO events (
        organization_id, created_by, title, slug, summary, description, category,
        event_type, visibility, timezone, starts_at, ends_at, venue_name,
        venue_address, online_url, capacity, cover_image_url, registration_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, slug, status, created_at, updated_at`,
      [draft.organizationId, session.user.id, ...eventValues(draft)],
    );
    const event = result.rows[0];
    await replaceTicketAndQuestion(client, event.id, draft);
    await client.query("COMMIT");
    return { event };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return { error: "An event with this URL already exists. Adjust the title to create a unique URL.", status: 409 };
    throw error;
  } finally {
    client.release();
  }
}

export async function updateEventDraft(eventId, draft) {
  const access = await authorizeEventAccess(draft.organizationId, editorRoles);
  if (!access.allowed) return { error: "You do not have permission to edit events in this organization.", status: access.status };

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE events SET
        title = $3, slug = $4, summary = $5, description = $6, category = $7,
        event_type = $8, visibility = $9, timezone = $10, starts_at = $11,
        ends_at = $12, venue_name = $13, venue_address = $14, online_url = $15,
        capacity = $16, cover_image_url = $17, registration_mode = $18,
        updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND status = 'draft'
       RETURNING id, slug, status, created_at, updated_at`,
      [eventId, draft.organizationId, ...eventValues(draft)],
    );

    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return { error: "Draft not found or no longer editable.", status: 404 };
    }

    await replaceTicketAndQuestion(client, eventId, draft);
    await client.query("COMMIT");
    return { event: result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return { error: "An event with this URL already exists. Adjust the title to create a unique URL.", status: 409 };
    throw error;
  } finally {
    client.release();
  }
}

export async function listEvents(organizationId) {
  const access = await authorizeEventAccess(organizationId, readerRoles);
  if (!access.allowed) return { error: "You do not have access to this organization.", status: access.status };

  const result = await getPool().query(
    `SELECT id, title, slug, summary, category, status, starts_at, venue_name, registration_mode, created_at
     FROM events WHERE organization_id = $1 ORDER BY starts_at NULLS LAST, created_at DESC`,
    [organizationId],
  );
  return { events: result.rows };
}

export async function getEventDraft(eventId) {
  const result = await getPool().query(
    `SELECT * FROM events WHERE id = $1 LIMIT 1`,
    [eventId],
  );
  const event = result.rows[0];
  if (!event) return { error: "Draft not found.", status: 404 };

  const access = await authorizeEventAccess(event.organization_id, readerRoles);
  if (!access.allowed) return { error: "You do not have access to this event.", status: access.status };
  if (!["draft", "published"].includes(event.status)) {
    return { error: "This event can no longer be edited.", status: 409 };
  }

  const [ticketResult, questionResult] = await Promise.all([
    getPool().query("SELECT name, price_minor, quantity FROM ticket_types WHERE event_id = $1 AND status = 'active' LIMIT 1", [eventId]),
    getPool().query("SELECT label FROM event_questions WHERE event_id = $1 ORDER BY sort_order LIMIT 1", [eventId]),
  ]);
  const ticket = ticketResult.rows[0];

  return {
    event: {
      id: event.id,
      slug: event.slug,
      status: event.status,
      organizationId: event.organization_id,
      title: event.title,
      summary: event.summary,
      description: event.description,
      category: event.category,
      eventType: event.event_type,
      visibility: event.visibility,
      timezone: event.timezone,
      startsAt: event.starts_at?.toISOString() || null,
      endsAt: event.ends_at?.toISOString() || null,
      venueName: event.venue_name,
      venueAddress: event.venue_address,
      onlineUrl: event.online_url,
      capacity: event.capacity,
      coverImageUrl: event.cover_image_url,
      registrationMode: event.registration_mode,
      ticket: ticket ? { name: ticket.name, price: ticket.price_minor / 100, quantity: ticket.quantity } : { name: "General admission", price: 0, quantity: null },
      attendeeQuestion: questionResult.rows[0]?.label || "",
    },
  };
}

export async function publishEvent(eventId, organizationId) {
  const access = await authorizeEventAccess(organizationId, editorRoles);
  if (!access.allowed) return { error: "You do not have permission to publish events in this organization.", status: access.status };

  const result = await getPool().query(
    `SELECT events.*, COALESCE(ticket_types.price_minor, 0) AS ticket_price_minor
     FROM events LEFT JOIN ticket_types ON ticket_types.event_id = events.id AND ticket_types.status = 'active'
     WHERE events.id = $1 AND events.organization_id = $2
     LIMIT 1`,
    [eventId, organizationId],
  );
  const event = result.rows[0];
  if (!event) return { error: "Event not found in this organization.", status: 404 };
  if (event.status === "published") {
    return { event: { id: event.id, title: event.title, slug: event.slug, status: event.status, published_at: event.published_at } };
  }
  if (event.status !== "draft") return { error: "This event cannot be published from its current status.", status: 409 };

  const problems = validateEventForPublishing({
    description: event.description,
    startsAt: event.starts_at?.toISOString() || null,
    endsAt: event.ends_at?.toISOString() || null,
    eventType: event.event_type,
    venueName: event.venue_name,
    onlineUrl: event.online_url,
    registrationMode: event.registration_mode,
    ticket: { price: event.ticket_price_minor / 100 },
  });
  if (problems.length) return { error: problems.join(" "), status: 422, problems };

  const published = await getPool().query(
    `UPDATE events SET status = 'published', published_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND status = 'draft'
     RETURNING id, title, slug, status, published_at`,
    [eventId, organizationId],
  );
  if (!published.rowCount) return { error: "This event has already changed.", status: 409 };
  return { event: published.rows[0] };
}

export async function getPublicEvent(slug) {
  const result = await getPool().query(
    `SELECT events.id, events.title, events.slug, events.summary, events.description,
      events.category, events.event_type, events.visibility, events.timezone,
      events.starts_at, events.ends_at, events.venue_name, events.venue_address,
      events.online_url, events.cover_image_url, events.registration_mode,
      organization.name AS organizer_name
     FROM events
     JOIN organization ON organization.id = events.organization_id
     WHERE events.slug = $1 AND events.status = 'published'
       AND events.visibility IN ('public', 'unlisted')
     LIMIT 1`,
    [slug],
  );

  const event = result.rows[0];
  if (!event) return null;

  const tickets = await getPool().query(
    `SELECT name, price_minor, currency FROM ticket_types
     WHERE event_id = $1 AND status = 'active' ORDER BY price_minor`,
    [event.id],
  );

  return { ...event, tickets: tickets.rows };
}