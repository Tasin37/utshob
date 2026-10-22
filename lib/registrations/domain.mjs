import crypto from "node:crypto";
import { z } from "zod";

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).default(""),
  acceptedTerms: z.literal(true),
});

export function createTicketCredentials() {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const ticketNumber = `UT-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  return { token, tokenHash, ticketNumber };
}