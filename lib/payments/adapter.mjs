import { z } from "zod";

export const paymentIntentSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("BDT"),
  idempotencyKey: z.string().min(1).max(255),
  metadata: z.record(z.string()).optional(),
});

export const paymentResultSchema = z.object({
  success: z.boolean(),
  providerReference: z.string().nullable(),
  clientSecret: z.string().nullable(),
  error: z.string().nullable(),
});

export class PaymentAdapterError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "PaymentAdapterError";
    this.code = code;
  }
}

export class PaymentAdapter {
  async createPaymentIntent(input) {
    const parsed = paymentIntentSchema.safeParse(input);
    if (!parsed.success) {
      throw new PaymentAdapterError(
        parsed.error.issues[0]?.message || "Invalid payment input.",
        "INVALID_PAYMENT_INPUT",
      );
    }
    throw new PaymentAdapterError("createPaymentIntent not implemented.", "NOT_IMPLEMENTED");
  }

  async verifyWebhook(payload, signature) {
    throw new PaymentAdapterError("verifyWebhook not implemented.", "NOT_IMPLEMENTED");
  }

  async constructEvent(payload, signature) {
    throw new PaymentAdapterError("constructEvent not implemented.", "NOT_IMPLEMENTED");
  }
}
