import { getServerSession } from "@/lib/auth/session";
import { getPaymentOrder } from "@/lib/payments/server";

export async function GET(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to view this order." } },
      { status: 401 },
    );
  }

  const { orderId } = await params;
  const result = await getPaymentOrder(orderId, session.user.id);
  if (result.error) {
    return Response.json(
      { error: { code: "ORDER_LOOKUP_FAILED", message: result.error } },
      { status: result.status },
    );
  }

  return Response.json(result);
}
