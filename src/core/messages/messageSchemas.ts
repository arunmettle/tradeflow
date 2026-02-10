import { z } from "zod";

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1, "Message is required").max(1200, "Message is too long"),
});

export const revisionCreateSchema = z.object({
  summary: z.string().trim().max(200, "Summary is too long").optional(),
  snapshot: z.unknown(),
});

export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type RevisionCreateInput = z.infer<typeof revisionCreateSchema>;
