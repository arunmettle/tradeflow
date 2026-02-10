import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const tradieTestimonialSchema = z.object({
  name: z.string().trim().min(1, "Testimonial name is required"),
  suburb: optionalTrimmedString,
  text: z.string().trim().min(1, "Testimonial text is required"),
});

export const tradieProjectSchema = z.object({
  title: z.string().trim().min(1, "Project title is required"),
  suburb: optionalTrimmedString,
  summary: z.string().trim().min(1, "Project summary is required"),
});

export const tradieBrandSettingsSchema = z.object({
  primaryColor: optionalTrimmedString,
  footerText: optionalTrimmedString,
});

export const tradieProfileUpdateSchema = z.object({
  slug: z.string().trim().min(1, "Slug is required"),
  businessName: z.string().trim().min(1, "Business name is required"),
  tagline: optionalTrimmedString,
  about: optionalTrimmedString,
  email: optionalTrimmedString,
  phone: optionalTrimmedString,
  logoUrl: optionalTrimmedString,
  website: optionalTrimmedString,
  addressLine1: optionalTrimmedString,
  addressLine2: optionalTrimmedString,
  suburb: optionalTrimmedString,
  state: optionalTrimmedString,
  postcode: optionalTrimmedString,
  services: z.array(z.string().trim().min(1)).default([]),
  serviceAreas: z.array(z.string().trim().min(1)).default([]),
  testimonials: z.array(tradieTestimonialSchema).default([]),
  projects: z.array(tradieProjectSchema).default([]),
  brandSettings: tradieBrandSettingsSchema.default({}),
  plan: z.enum(["FREE", "PAID"]).default("FREE"),
});

export type TradieProfileUpdateInput = z.infer<typeof tradieProfileUpdateSchema>;
export type TradieTestimonial = z.infer<typeof tradieTestimonialSchema>;
export type TradieProject = z.infer<typeof tradieProjectSchema>;
