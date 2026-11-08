import { z } from "zod";

export const speakerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().max(160).default(""),
  bio: z.string().trim().max(2000).default(""),
  photoUrl: z.string().trim().url().nullable().default(null),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});
