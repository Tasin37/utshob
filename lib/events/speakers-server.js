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

function serializeSpeaker(speaker) {
  return {
    id: speaker.id,
    eventId: speaker.event_id,
    name: speaker.name,
    role: speaker.role,
    bio: speaker.bio,
    photoUrl: speaker.photo_url,
    sortOrder: speaker.sort_order,
  };
}

export async function listEventSpeakers(eventId, organizationId) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage speakers.", status: access.status };
  const result = await getPool().query(
    `SELECT id, event_id, name, role, bio, photo_url, sort_order
     FROM event_speakers WHERE event_id = $1 ORDER BY sort_order, created_at`,
    [eventId],
  );
  return { speakers: result.rows.map(serializeSpeaker) };
}

export async function createEventSpeaker(eventId, organizationId, speaker) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage speakers.", status: access.status };
  const result = await getPool().query(
    `INSERT INTO event_speakers (event_id, name, role, bio, photo_url, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, event_id, name, role, bio, photo_url, sort_order`,
    [eventId, speaker.name, speaker.role, speaker.bio, speaker.photoUrl, speaker.sortOrder],
  );
  return { speaker: serializeSpeaker(result.rows[0]), status: 201 };
}

export async function deleteEventSpeaker(eventId, speakerId, organizationId) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage speakers.", status: access.status };
  const result = await getPool().query(
    "DELETE FROM event_speakers WHERE id = $1 AND event_id = $2 RETURNING id",
    [speakerId, eventId],
  );
  if (!result.rowCount) return { error: "Speaker not found.", status: 404 };
  return { deleted: true };
}
