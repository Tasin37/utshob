import { z } from "zod";

export const webhookEventNames = [
  "registration.created",
  "order.paid",
  "ticket.checked_in",
];

export const webhookEndpointSchema = z.object({
  url: z.string().trim().url().max(2048),
  events: z.array(z.enum(webhookEventNames)).min(1).max(webhookEventNames.length).default(webhookEventNames),
});
