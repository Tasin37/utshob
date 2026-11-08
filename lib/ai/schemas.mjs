import { z } from "zod";

export const eventDraftOutputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(1).max(280),
  description: z.string().trim().min(1).max(12000),
  category: z.string().trim().min(1).max(80),
  audience: z.array(z.string().trim().min(1).max(100)).max(8),
  agenda: z.array(z.object({
    title: z.string().trim().min(1).max(160),
    durationMinutes: z.number().int().positive().max(1440),
  })).max(20),
  faqs: z.array(z.object({
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(1000),
  })).max(12),
});

export const eventDraftRequestSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  brief: z.string().trim().min(20).max(2000),
});

export const descriptionOptimizeRequestSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  description: z.string().trim().min(20).max(12000),
  tone: z.enum(["warm", "professional", "energetic"]).default("warm"),
});

export const descriptionOptimizeOutputSchema = z.object({
  description: z.string().trim().min(20).max(12000),
});

export const faqGenerateRequestSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  context: z.string().trim().min(20).max(12000),
});

export const faqGenerateOutputSchema = z.object({
  faqs: z.array(z.object({
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(1000),
  })).min(1).max(8),
});

export const organizerAssistantRequestSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  question: z.string().trim().min(5).max(1000),
});

export const organizerAssistantOutputSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
  sources: z.array(z.string().trim().min(1).max(120)).max(8),
  suggestedActions: z.array(z.string().trim().min(1).max(200)).max(5),
});

export const announcementDraftRequestSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  goal: z.enum(["reminder", "last-chance", "thank-you"]).default("reminder"),
});

export const announcementDraftOutputSchema = z.object({
  subject: z.string().trim().min(1).max(160),
  body: z.string().trim().min(20).max(3000),
  audienceNote: z.string().trim().min(1).max(300),
});
