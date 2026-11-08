import { getServerSession } from "@/lib/auth/session";
import { createPromoCode, listPromoCodes } from "@/lib/promos/server";
import { promoCodeSchema } from "@/lib/payments/domain.mjs";

function errorResponse(message, status, code = "PROMO_CODE_REQUEST_FAILED") {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(request, { params }) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to manage promo codes.", 401, "UNAUTHENTICATED");
  const { eventId } = await params;
  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
  const result = await listPromoCodes(eventId, organizationId);
  if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
  return Response.json({ promoCodes: result.promoCodes });
}

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) return errorResponse("Sign in to manage promo codes.", 401, "UNAUTHENTICATED");
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY");
  }

  const { eventId } = await params;
  const parsed = promoCodeSchema.safeParse({ ...body, eventId });
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || "Check the promo code details.", 422, "INVALID_PROMO_CODE");
  try {
    const organizationId = body.organizationId;
    if (!organizationId) return errorResponse("Choose an organization.", 400, "ORGANIZATION_REQUIRED");
    const result = await createPromoCode(parsed.data, organizationId);
    if (result.error) return errorResponse(result.error, result.status, "FORBIDDEN");
    return Response.json({ promoCode: result.promoCode }, { status: result.status });
  } catch (error) {
    if (error?.code === "23505") return errorResponse("That promo code already exists for this event.", 409, "PROMO_CODE_EXISTS");
    console.error("Promo code creation failed", error instanceof Error ? error.message : error);
    return errorResponse("Promo code service is temporarily unavailable.", 503, "PROMO_CODE_UNAVAILABLE");
  }
}
