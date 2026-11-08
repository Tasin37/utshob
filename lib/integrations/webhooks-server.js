import "server-only";

import crypto from "node:crypto";
import { getPool } from "@/lib/db/pool";
import { requireOrganizationRole } from "@/lib/auth/session";

const editorRoles = ["owner", "admin"];
const encryptionAlgorithm = "aes-256-gcm";

function getEncryptionKey() {
  const value = process.env.WEBHOOK_ENCRYPTION_KEY;
  if (!value) throw new Error("WEBHOOK_ENCRYPTION_KEY is required for webhook delivery.");
  return crypto.createHash("sha256").update(value).digest();
}

function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(encryptionAlgorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptSecret(value) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  const decipher = crypto.createDecipheriv(encryptionAlgorithm, getEncryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}

function generateSecret() {
  return `whsec_${crypto.randomBytes(24).toString("base64url")}`;
}

function serializeEndpoint(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    url: row.url,
    events: row.events,
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function listWebhookEndpoints(organizationId) {
  const access = await requireOrganizationRole(organizationId, editorRoles);
  if (!access.allowed) return { error: "You do not have permission to manage integrations.", status: access.status };
  const result = await getPool().query(
    "SELECT id, organization_id, url, events, active, created_at FROM webhook_endpoints WHERE organization_id = $1 ORDER BY created_at DESC",
    [organizationId],
  );
  return { endpoints: result.rows.map(serializeEndpoint) };
}

export async function createWebhookEndpoint(organizationId, input) {
  const access = await requireOrganizationRole(organizationId, editorRoles);
  if (!access.allowed) return { error: "You do not have permission to manage integrations.", status: access.status };
  const secret = generateSecret();
  const result = await getPool().query(
    `INSERT INTO webhook_endpoints (organization_id, url, secret_encrypted, events)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, organization_id, url, events, active, created_at`,
    [organizationId, input.url, encryptSecret(secret), JSON.stringify(input.events)],
  );
  return { endpoint: serializeEndpoint(result.rows[0]), secret, status: 201 };
}

export async function deleteWebhookEndpoint(endpointId, organizationId) {
  const access = await requireOrganizationRole(organizationId, editorRoles);
  if (!access.allowed) return { error: "You do not have permission to manage integrations.", status: access.status };
  const result = await getPool().query(
    "DELETE FROM webhook_endpoints WHERE id = $1 AND organization_id = $2 RETURNING id",
    [endpointId, organizationId],
  );
  if (!result.rowCount) return { error: "Webhook endpoint not found.", status: 404 };
  return { deleted: true };
}

export async function dispatchWebhookEvent(eventName, payload) {
  const endpoints = await getPool().query(
    `SELECT id, url, secret_encrypted
     FROM webhook_endpoints
     WHERE active = true AND (events @> $1::jsonb OR events @> '["*"]'::jsonb)`,
    [JSON.stringify([eventName])],
  );

  await Promise.all(endpoints.rows.map(async (endpoint) => {
    const body = JSON.stringify({ id: crypto.randomUUID(), event: eventName, createdAt: new Date().toISOString(), data: payload });
    const signature = crypto.createHmac("sha256", decryptSecret(endpoint.secret_encrypted)).update(body).digest("hex");
    const delivery = await getPool().query(
      `INSERT INTO webhook_deliveries (endpoint_id, event_name, payload, attempts)
       VALUES ($1, $2, $3::jsonb, 1) RETURNING id`,
      [endpoint.id, eventName, body],
    );
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-utshob-event": eventName, "x-utshob-signature": `sha256=${signature}` },
        body,
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`Endpoint returned HTTP ${response.status}.`);
      await getPool().query("UPDATE webhook_deliveries SET status = 'delivered', response_status = $2, delivered_at = NOW() WHERE id = $1", [delivery.rows[0].id, response.status]);
    } catch (error) {
      await getPool().query("UPDATE webhook_deliveries SET status = 'failed', response_status = $2, last_error = $3 WHERE id = $1", [delivery.rows[0].id, error.status || null, error.message.slice(0, 500)]);
    }
  }));
}
