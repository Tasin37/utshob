import { z } from "zod";

export const receiptSchema = z.object({
  orderId: z.string().min(1),
  eventTitle: z.string().min(1),
  eventSlug: z.string().min(1),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("BDT"),
  status: z.enum(["pending", "paid", "failed", "refunded", "cancelled"]),
  providerReference: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export function generateReceipt(input) {
  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid receipt input.");
  }

  const { orderId, eventTitle, eventSlug, attendeeName, attendeeEmail, amountMinor, currency, status, providerReference, createdAt } = parsed.data;
  const amountMajor = (amountMinor / 100).toFixed(2);

  return {
    receiptId: `rcpt_${orderId}`,
    orderId,
    event: { title: eventTitle, slug: eventSlug },
    attendee: { name: attendeeName, email: attendeeEmail },
    amount: amountMajor,
    currency,
    status,
    providerReference,
    issuedAt: createdAt,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${eventTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 700; }
    .receipt-id { font-size: 14px; color: #6b7280; }
    .details { margin-bottom: 24px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .amount { font-size: 24px; font-weight: 700; margin-top: 16px; }
    .status { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 24px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="title">Utshob Receipt</div>
      <div class="receipt-id">Receipt #${`rcpt_${orderId}`}</div>
    </div>
    <div class="details">
      <div class="detail-row"><span>Event</span><span>${eventTitle}</span></div>
      <div class="detail-row"><span>Attendee</span><span>${attendeeName}</span></div>
      <div class="detail-row"><span>Email</span><span>${attendeeEmail}</span></div>
      <div class="detail-row"><span>Order</span><span>${orderId}</span></div>
      ${providerReference ? `<div class="detail-row"><span>Transaction</span><span>${providerReference}</span></div>` : ""}
    </div>
    <div class="amount">${amountMajor} ${currency}</div>
    <div class="status status-${status}">${status}</div>
    <div class="footer">
      Issued on ${new Date(createdAt).toLocaleString()} by Utshob.
    </div>
  </div>
</body>
</html>
`,
  };
}
