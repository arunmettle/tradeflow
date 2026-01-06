import { z } from "zod";

const nonEmptyTrimmedString = z.string().trim().min(1, "Required");

const trimmedStringWithDefault = (defaultValue: string) =>
  z
    .string()
    .transform((val) => {
      const trimmed = (val ?? "").toString().trim();
      return trimmed.length > 0 ? trimmed : defaultValue;
    });

const coerceNumber = (fallback: number) =>
  z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) {
        return fallback;
      }
      const num = Number(val);
      return Number.isFinite(num) ? num : val;
    }, z.any())
    .pipe(z.number({ required_error: "Required" }));

const coerceBoolean = (defaultValue: boolean) =>
  z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") {
        return defaultValue;
      }
      if (typeof val === "string") {
        return val === "true" || val === "on" || val === "1";
      }
      return Boolean(val);
    },
    z.boolean()
  );

export const quoteLineInputSchema = z.object({
  name: nonEmptyTrimmedString,
  category: trimmedStringWithDefault("General"),
  qty: coerceNumber(1).transform((val) => Math.max(0, val)).default(1),
  unit: trimmedStringWithDefault("unit"),
  unitRate: coerceNumber(0).transform((val) => Math.max(0, val)).default(0),
});

const defaultLine = quoteLineInputSchema.parse({
  name: "Line item",
  category: "General",
  qty: 1,
  unit: "unit",
  unitRate: 0,
});

export const quoteCreateInputSchema = z.object({
  customerName: nonEmptyTrimmedString,
  customerEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  siteAddress: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  jobDescriptionRaw: nonEmptyTrimmedString,
  trade: z.string().trim().optional(),
  jobType: z.string().trim().optional(),
  includeGst: coerceBoolean(true).default(true),
  terms: z
    .object({
      depositPercent: coerceNumber(50)
        .transform((val) => Math.min(Math.max(0, val), 100))
        .default(50),
      validityDays: coerceNumber(14)
        .transform((val) => (val <= 0 ? 1 : Math.floor(val)))
        .default(14),
      notes: z.string().trim().default(""),
    })
    .default({}),
  scopeBullets: z.array(z.string().trim()).default([]),
  exclusions: z.array(z.string().trim()).default([]),
  lines: z.array(quoteLineInputSchema).min(1).default([defaultLine]),
});

export type QuoteLineInput = z.infer<typeof quoteLineInputSchema>;
export type QuoteCreateInput = z.infer<typeof quoteCreateInputSchema>;
