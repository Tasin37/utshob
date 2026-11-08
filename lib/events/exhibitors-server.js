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

function serializeExhibitor(exhibitor) {
  return {
    id: exhibitor.id,
    eventId: exhibitor.event_id,
    name: exhibitor.name,
    description: exhibitor.description,
    logoUrl: exhibitor.logo_url,
    websiteUrl: exhibitor.website_url,
    boothLabel: exhibitor.booth_label,
    sortOrder: exhibitor.sort_order,
  };
}

export async function listEventExhibitors(eventId, organizationId) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage exhibitors.", status: access.status };
  const result = await getPool().query(
    `SELECT id, event_id, name, description, logo_url, website_url, booth_label, sort_order
     FROM event_exhibitors WHERE event_id = $1 ORDER BY sort_order, created_at`,
    [eventId],
  );
  return { exhibitors: result.rows.map(serializeExhibitor) };
}

export async function createEventExhibitor(eventId, organizationId, exhibitor) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage exhibitors.", status: access.status };
  const result = await getPool().query(
    `INSERT INTO event_exhibitors
       (event_id, name, description, logo_url, website_url, booth_label, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, event_id, name, description, logo_url, website_url, booth_label, sort_order`,
    [eventId, exhibitor.name, exhibitor.description, exhibitor.logoUrl, exhibitor.websiteUrl, exhibitor.boothLabel, exhibitor.sortOrder],
  );
  return { exhibitor: serializeExhibitor(result.rows[0]), status: 201 };
}

export async function deleteEventExhibitor(eventId, exhibitorId, organizationId) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage exhibitors.", status: access.status };
  const result = await getPool().query(
    "DELETE FROM event_exhibitors WHERE id = $1 AND event_id = $2 RETURNING id",
    [exhibitorId, eventId],
  );
  if (!result.rowCount) return { error: "Exhibitor not found.", status: 404 };
  return { deleted: true };
}
