import test from "node:test";
import assert from "node:assert/strict";
import { calculatePromoDiscount, promoCodeSchema, validateOrderInput, orderSchema } from "../lib/payments/domain.mjs";
import { generateReceipt, receiptSchema } from "../lib/payments/receipt.mjs";
import { PaymentAdapterError } from "../lib/payments/adapter.mjs";

test("order schema accepts valid order input", () => {
  const result = orderSchema.safeParse({
    eventId: "event-1",
    ticketTypeId: "ticket-1",
    quantity: 2,
    idempotencyKey: "key-123",
  });
  assert.equal(result.success, true);
});

test("order schema rejects missing required fields", () => {
  const result = orderSchema.safeParse({ eventId: "", ticketTypeId: "", quantity: 0, idempotencyKey: "" });
  assert.equal(result.success, false);
});

test("order schema rejects quantity over 100", () => {
  const result = orderSchema.safeParse({
    eventId: "event-1",
    ticketTypeId: "ticket-1",
    quantity: 101,
    idempotencyKey: "key-123",
  });
  assert.equal(result.success, false);
});

test("validateOrderInput returns parsed result", () => {
  const result = validateOrderInput({
    eventId: "event-1",
    ticketTypeId: "ticket-1",
    quantity: 1,
    idempotencyKey: "key-123",
  });

  test("promo codes validate percentage and fixed discount rules", () => {
    assert.equal(promoCodeSchema.safeParse({
      eventId: "event-1",
      code: "earlybird",
      discountType: "percent",
      discountValue: 20,
    }).success, true);
    assert.equal(promoCodeSchema.safeParse({
      eventId: "event-1",
      code: "too-big",
      discountType: "percent",
      discountValue: 101,
    }).success, false);
    assert.equal(calculatePromoDiscount({ subtotalMinor: 10000, discountType: "percent", discountValue: 20 }), 2000);
    assert.equal(calculatePromoDiscount({ subtotalMinor: 10000, discountType: "fixed", discountValue: 12000 }), 10000);
  });
  assert.equal(result.success, true);
  assert.equal(result.data.quantity, 1);
});

test("generateReceipt creates a valid receipt", () => {
  const receipt = generateReceipt({
    orderId: "order-1",
    eventTitle: "Dhaka Tech Conference",
    eventSlug: "dhaka-tech-conference",
    attendeeName: "Tasin Islam",
    attendeeEmail: "tasin@example.com",
    amountMinor: 15000,
    currency: "BDT",
    status: "paid",
    providerReference: "pi_1234567890",
    createdAt: "2027-02-10T09:00:00.000Z",
  });

  assert.equal(receipt.orderId, "order-1");
  assert.equal(receipt.amount, "150.00");
  assert.equal(receipt.currency, "BDT");
  assert.equal(receipt.status, "paid");
  assert.equal(receipt.providerReference, "pi_1234567890");
  assert.match(receipt.receiptId, /^rcpt_order-1$/);
  assert.ok(receipt.html.includes("Dhaka Tech Conference"));
  assert.ok(receipt.html.includes("Tasin Islam"));
  assert.ok(receipt.html.includes("150.00"));
});

test("generateReceipt rejects invalid input", () => {
  assert.throws(() => {
    generateReceipt({
      orderId: "",
      eventTitle: "",
      eventSlug: "",
      attendeeName: "",
      attendeeEmail: "bad-email",
      amountMinor: -1,
      currency: "BDT",
      status: "invalid",
      providerReference: null,
      createdAt: "not-a-date",
    });
  });
});

test("PaymentAdapterError has name and code", () => {
  const error = new PaymentAdapterError("Something failed", "PAYMENT_FAILED");
  assert.equal(error.name, "PaymentAdapterError");
  assert.equal(error.code, "PAYMENT_FAILED");
  assert.equal(error.message, "Something failed");
});
