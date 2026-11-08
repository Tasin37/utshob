import { z } from "zod";

export const sponsorSchema = z.object({
  name: z.string().trim().min(2).max(160),
  tagline: z.string().trim().max(240).default(""),
  logoUrl: z.string().trim().url().nullable().default(null),
  websiteUrl: z.string().trim().url().nullable().default(null),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});
