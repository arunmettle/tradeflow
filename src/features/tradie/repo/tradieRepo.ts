import prisma from "@/db/prisma";
import {
  tradieProfileUpdateSchema,
  TradieProfileUpdateInput,
} from "@/core/tradie/tradieSchemas";

const DEFAULT_TRADIE = {
  slug: "demo",
  businessName: "TradeFlow Demo Tradie",
  services: [],
  serviceAreas: [],
  testimonials: [],
  projects: [],
  brandSettings: {},
  plan: "FREE",
} as const;

type Plan = "FREE" | "PAID";

type LegacyProfileFallback = {
  tagline?: string;
  about?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  services?: string[];
  serviceAreas?: string[];
  testimonials?: Array<{ name: string; suburb?: string; text: string }>;
  projects?: Array<{ title: string; suburb?: string; summary: string }>;
};

const isUnknownArgumentError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Unknown argument");
};

export async function getTradieBySlugAsync(slug: string) {
  const trimmed = slug?.trim();
  if (!trimmed) return null;

  return prisma.tradieProfile.findUnique({
    where: { slug: trimmed },
  });
}

export async function getDefaultTradieAsync() {
  const existing = await prisma.tradieProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.tradieProfile.create({
    data: { ...DEFAULT_TRADIE },
  });
}

export async function upsertDefaultTradieAsync(input: {
  slug: string;
  businessName: string;
  tagline?: string;
  about?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  services?: string[];
  serviceAreas?: string[];
  testimonials?: Array<{ name: string; suburb?: string; text: string }>;
  projects?: Array<{ title: string; suburb?: string; summary: string }>;
  brandSettings?: { primaryColor?: string; footerText?: string };
  plan?: Plan;
}) {
  const parsed = tradieProfileUpdateSchema.parse(input) as TradieProfileUpdateInput;
  const profileFallback: LegacyProfileFallback = {
    tagline: parsed.tagline,
    about: parsed.about,
    website: parsed.website,
    addressLine1: parsed.addressLine1,
    addressLine2: parsed.addressLine2,
    suburb: parsed.suburb,
    state: parsed.state,
    postcode: parsed.postcode,
    services: parsed.services,
    serviceAreas: parsed.serviceAreas,
    testimonials: parsed.testimonials,
    projects: parsed.projects,
  };

  const existing = await prisma.tradieProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    try {
      return await prisma.tradieProfile.update({
        where: { id: existing.id },
        data: {
          slug: parsed.slug,
          businessName: parsed.businessName,
          tagline: parsed.tagline,
          about: parsed.about,
          email: parsed.email,
          phone: parsed.phone,
          logoUrl: parsed.logoUrl,
          website: parsed.website,
          addressLine1: parsed.addressLine1,
          addressLine2: parsed.addressLine2,
          suburb: parsed.suburb,
          state: parsed.state,
          postcode: parsed.postcode,
          services: parsed.services,
          serviceAreas: parsed.serviceAreas,
          testimonials: parsed.testimonials,
          projects: parsed.projects,
          brandSettings: parsed.brandSettings,
          plan: parsed.plan,
        },
      });
    } catch (error) {
      if (!isUnknownArgumentError(error)) throw error;

      const existingBrand =
        (existing.brandSettings as { primaryColor?: string; footerText?: string; profile?: LegacyProfileFallback } | null) ??
        {};

      return prisma.tradieProfile.update({
        where: { id: existing.id },
        data: {
          slug: parsed.slug,
          businessName: parsed.businessName,
          email: parsed.email,
          phone: parsed.phone,
          logoUrl: parsed.logoUrl,
          brandSettings: {
            ...existingBrand,
            ...parsed.brandSettings,
            profile: profileFallback,
          },
          plan: parsed.plan,
        },
      });
    }
  }

  try {
    return await prisma.tradieProfile.create({
      data: {
        slug: parsed.slug,
        businessName: parsed.businessName,
        tagline: parsed.tagline,
        about: parsed.about,
        email: parsed.email,
        phone: parsed.phone,
        logoUrl: parsed.logoUrl,
        website: parsed.website,
        addressLine1: parsed.addressLine1,
        addressLine2: parsed.addressLine2,
        suburb: parsed.suburb,
        state: parsed.state,
        postcode: parsed.postcode,
        services: parsed.services,
        serviceAreas: parsed.serviceAreas,
        testimonials: parsed.testimonials,
        projects: parsed.projects,
        brandSettings: parsed.brandSettings,
        plan: parsed.plan,
      },
    });
  } catch (error) {
    if (!isUnknownArgumentError(error)) throw error;
    return prisma.tradieProfile.create({
      data: {
        slug: parsed.slug,
        businessName: parsed.businessName,
        email: parsed.email,
        phone: parsed.phone,
        logoUrl: parsed.logoUrl,
        brandSettings: {
          ...parsed.brandSettings,
          profile: profileFallback,
        },
        plan: parsed.plan,
      },
    });
  }
}
