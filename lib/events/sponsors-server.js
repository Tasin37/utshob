import "server-only";

import { getPool } from "@/lib/db/pool";
import { requireOrganizationRole } from "@/lib/auth/session";

const editorRoles = ["owner", "admin"];

async function authorizeEventEditor(eventId, organizationId) {
  const access = await requireOrganizationRole(organizationId, editorRoles);
  if (!access.allowed) return access;
  const event = await getPool().query(
    "SELECT id FROM events WHERE id = $1 AND organization_id = $2 LIMIT 1",
    [eventId, organizationId],
  );
  return event.rowCount ? access : { allowed: false, status: 404 };
}

function serializeSponsor(sponsor) {
  return {
    id: sponsor.id,
    eventId: sponsor.event_id,
    name: sponsor.name,
    tagline: sponsor.tagline,
    logoUrl: sponsor.logo_url,
    websiteUrl: sponsor.website_url,
    sortOrder: sponsor.sort_order,
  };
}

export async function listEventSponsors(eventId, organizationId) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage sponsors.", status: access.status };
  const result = await getPool().query(
    `SELECT id, event_id, name, tagline, logo_url, website_url, sort_order
     FROM event_sponsors WHERE event_id = $1 ORDER BY sort_order, created_at`,
    [eventId],
  );
  return { sponsors: result.rows.map(serializeSponsor) };
}

export async function createEventSponsor(eventId, organizationId, sponsor) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage sponsors.", status: access.status };
  const result = await getPool().query(
    `INSERT INTO event_sponsors (event_id, name, tagline, logo_url, website_url, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, event_id, name, tagline, logo_url, website_url, sort_order`,
    [eventId, sponsor.name, sponsor.tagline, sponsor.logoUrl, sponsor.websiteUrl, sponsor.sortOrder],
  );
  return { sponsor: serializeSponsor(result.rows[0]), status: 201 };
}

export async function deleteEventSponsor(eventId, sponsorId, organizationId) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage sponsors.", status: access.status };
  const result = await getPool().query(
    "DELETE FROM event_sponsors WHERE id = $1 AND event_id = $2 RETURNING id",
    [sponsorId, eventId],
  );
  if (!result.rowCount) return { error: "Sponsor not found.", status: 404 };
  return { deleted: true };
}
