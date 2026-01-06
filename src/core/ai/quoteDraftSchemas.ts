import { z } from "zod";

export const quoteDraftSchema = z.object({
  trade: z.string().trim().optional(),
  jobType: z.string().trim().optional(),
  scopeBullets: z.array(z.string().trim()).default([]),
  exclusions: z.array(z.string().trim()).default([]),
  lineItems: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Line item name is required"),
        qty: z.number().min(0),
        unit: z.string().trim().min(1, "Unit is required"),
      })
    )
    .default([]),
  missingInfoQuestions: z.array(z.string().trim()).default([]),
});

export type QuoteDraft = z.infer<typeof quoteDraftSchema>;
