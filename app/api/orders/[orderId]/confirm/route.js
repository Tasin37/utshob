import { getServerSession } from "@/lib/auth/session";
import { confirmManualPayment, getPaymentOrder } from "@/lib/payments/server";

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to confirm payment." } },
      { status: 401 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_BODY", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  const transactionId = typeof body.transactionId === "string" ? body.transactionId.trim() : "";
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(transactionId)) {
    return Response.json(
      { error: { code: "TRANSACTION_ID_INVALID", message: "Enter a valid bKash transaction ID." } },
      { status: 422 },
    );
  }

  const { orderId } = await params;
  const orderResult = await getPaymentOrder(orderId, session.user.id);
  if (orderResult.error) {
    return Response.json(
      { error: { code: "ORDER_LOOKUP_FAILED", message: orderResult.error } },
      { status: orderResult.status },
    );
  }

  const result = await confirmManualPayment({
    orderId,
    providerReference: `bkash_${transactionId}`,
    amountMinor: orderResult.order.amountMinor,
    currency: orderResult.order.currency,
  });
  if (result.error) {
    return Response.json(
      { error: { code: "PAYMENT_CONFIRMATION_FAILED", message: result.error } },
      { status: result.status },
    );
  }

  return Response.json(result);
}
