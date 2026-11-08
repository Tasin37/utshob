import { getServerSession } from "@/lib/auth/session";
import { deleteWebhookEndpoint } from "@/lib/integrations/webhooks-server";

export async function DELETE(request, { params }) {
  if (!await getServerSession()) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to manage integrations." } }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return Response.json({ error: { code: "ORGANIZATION_REQUIRED", message: "Choose an organization." } }, { status: 400 });
  const result = await deleteWebhookEndpoint((await params).endpointId, organizationId);
  if (result.error) return Response.json({ error: { code: "WEBHOOK_DELETE_FAILED", message: result.error } }, { status: result.status });
  return Response.json(result);
}
