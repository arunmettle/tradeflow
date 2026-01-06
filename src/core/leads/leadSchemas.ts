import { z } from "zod";

const nonEmptyTrimmedString = z.string().trim().min(1, "Required");

export const leadCreateInputSchema = z.object({
  customerName: nonEmptyTrimmedString,
  customerEmail: z.string().trim().email("Valid email is required"),
  customerPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  siteAddress: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  suburb: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  jobCategory: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  jobDescription: nonEmptyTrimmedString,
});

export type LeadCreateInput = z.infer<typeof leadCreateInputSchema>;
