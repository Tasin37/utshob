import { getServerSession } from "@/lib/auth/session";
import { createPaymentOrder } from "@/lib/payments/server";

function errorResponse(message, status, code = "ORDER_REQUEST_FAILED") {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) return errorResponse("Sign in to create an order.", 401, "UNAUTHENTICATED");
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Request body must be valid JSON.", 400, "INVALID_BODY");
    }

    const { eventId, ticketTypeId, quantity, idempotencyKey, promoCode } = body;
    if (!eventId || !ticketTypeId || !quantity || !idempotencyKey) {
      return errorResponse("Event, ticket type, quantity, and idempotency key are required.", 422, "ORDER_INPUT_REQUIRED");
    }

    const result = await createPaymentOrder(
      { eventId, ticketTypeId, quantity: Number(quantity), idempotencyKey, promoCode },
      session.user.id,
    );
    if (result.error) return errorResponse(result.error, result.status, "ORDER_CREATE_FAILED");

    return Response.json(
      {
        order: result.order,
        paymentMethod: "bkash_manual",
        bkashNumber: process.env.BKASH_MERCHANT_NUMBER || "01319059266",
      },
      { status: result.status },
    );
  } catch (error) {
    console.error("Order creation failed", error instanceof Error ? error.message : error);
    if (error?.code === "42P01" || error?.code === "42703") {
      return errorResponse("Payment database migrations are not applied. Apply migrations 002_payments.sql, 003_payment_completion.sql, and 007_promo_codes.sql, then retry.", 503, "PAYMENT_MIGRATION_REQUIRED");
    }
    return errorResponse("Payment service is temporarily unavailable.", 503, "ORDER_SERVICE_UNAVAILABLE");
  }
}
