import { getServerSession } from "@/lib/auth/session";
import { createWebhookEndpoint, listWebhookEndpoints } from "@/lib/integrations/webhooks-server";
import { webhookEndpointSchema } from "@/lib/integrations/webhooks.mjs";

function errorResponse(message, status, code = "WEBHOOK_REQUEST_FAILED") {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(request) {
  if (!await getServerSession()) return errorResponse("Sign in to manage integrations.", 401, "UNAUTHENTICATED");
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const result = await listWebhookEndpoints(organizationId);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json({ endpoints: result.endpoints });
}

export async function POST(request) {
  if (!await getServerSession()) return errorResponse("Sign in to manage integrations.", 401, "UNAUTHENTICATED");
  let body;
  try { body = await request.json(); } catch { return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY"); }
  const organizationId = body.organizationId;
  if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const parsed = webhookEndpointSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Check the webhook details.", 422, "INVALID_WEBHOOK");
  const result = await createWebhookEndpoint(organizationId, parsed.data);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json(result, { status: result.status });
}
