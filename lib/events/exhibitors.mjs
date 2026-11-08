import { z } from "zod";

export const exhibitorSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).default(""),
  logoUrl: z.string().trim().url().nullable().default(null),
  websiteUrl: z.string().trim().url().nullable().default(null),
  boothLabel: z.string().trim().max(80).default(""),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});
