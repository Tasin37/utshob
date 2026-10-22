import { getEventAnalytics } from "@/lib/analytics/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET(request, { params }) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to view analytics." } }, { status: 401 });

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return Response.json({ error: { code: "ORGANIZATION_REQUIRED", message: "Choose an organization." } }, { status: 400 });

  const { eventId } = await params;
  try {
    const result = await getEventAnalytics(eventId, organizationId);
    if (result.error) return Response.json({ error: { code: "ANALYTICS_FAILED", message: result.error } }, { status: result.status });
    return Response.json(result);
  } catch (error) {
    console.error("Analytics query failed", error.code || error.name);
    return Response.json({ error: { code: "ANALYTICS_UNAVAILABLE", message: "Analytics are temporarily unavailable." } }, { status: 503 });
  }
}