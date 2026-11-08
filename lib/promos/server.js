import "server-only";

import { getPool } from "@/lib/db/pool";
import { requireOrganizationRole } from "@/lib/auth/session";

const editorRoles = ["owner", "admin"];

function serializePromoCode(promo) {
  return {
    id: promo.id,
    eventId: promo.event_id,
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: promo.discount_value,
    maxUses: promo.max_uses,
    usedCount: promo.used_count,
    startsAt: promo.starts_at,
    endsAt: promo.ends_at,
    active: promo.active,
  };
}

async function authorizeEventEditor(eventId, organizationId) {
  const access = await requireOrganizationRole(organizationId, editorRoles);
  if (!access.allowed) return access;
  const event = await getPool().query(
    "SELECT id FROM events WHERE id = $1 AND organization_id = $2 LIMIT 1",
    [eventId, organizationId],
  );
  return event.rowCount ? access : { allowed: false, status: 404 };
}

export async function listPromoCodes(eventId, organizationId) {
  const access = await authorizeEventEditor(eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage this event.", status: access.status };
  const result = await getPool().query(
    `SELECT id, event_id, code, discount_type, discount_value, max_uses,
      used_count, starts_at, ends_at, active
     FROM promo_codes WHERE event_id = $1 ORDER BY created_at DESC`,
    [eventId],
  );
  return { promoCodes: result.rows.map(serializePromoCode) };
}

export async function createPromoCode(input, organizationId) {
  const access = await authorizeEventEditor(input.eventId, organizationId);
  if (!access.allowed) return { error: "You do not have permission to manage this event.", status: access.status };

  const result = await getPool().query(
    `INSERT INTO promo_codes
      (event_id, code, discount_type, discount_value, max_uses, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, event_id, code, discount_type, discount_value, max_uses,
       used_count, starts_at, ends_at, active`,
    [
      input.eventId,
      input.code.toUpperCase(),
      input.discountType,
      input.discountValue,
      input.maxUses,
      input.startsAt,
      input.endsAt,
    ],
  );
  return { promoCode: serializePromoCode(result.rows[0]), status: 201 };
}
