import prisma from "@/db/prisma";
import { getCurrentAuthUserAsync } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  tradieProfileUpdateSchema,
  TradieProfileUpdateInput,
} from "@/core/tradie/tradieSchemas";
import crypto from "crypto";

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

function slugify(input: string) {
  const trimmed = input.trim().toLowerCase();
  const dashed = trimmed.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return dashed || "tradie";
}

async function createUniqueSlugAsync(base: string) {
  const normalized = slugify(base);

  // Try base slug first, then append a short suffix on conflicts.
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = attempt === 0 ? "" : `-${crypto.randomBytes(2).toString("hex")}`;
    const candidate = `${normalized}${suffix}`;
    const existing = await prisma.tradieProfile.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
  }

  // Extremely unlikely: last resort.
  return `${normalized}-${crypto.randomBytes(4).toString("hex")}`;
}

/**
 * Multi-user mode: return the TradieProfile belonging to the currently signed-in auth user.
 * If no profile exists yet, create one (or "claim" a single legacy profile with no authUserId).
 */
export async function getCurrentTradieAsync() {
  const user = await getCurrentAuthUserAsync();
  if (!user) {
    redirect("/auth/sign-in");
  }

  const byUser = await prisma.tradieProfile.findFirst({
    where: { authUserId: user.id },
  });
  if (byUser) return byUser;

  // Migration path from single-tradie mode: if there's exactly one profile with no owner, claim it.
  const unownedCount = await prisma.tradieProfile.count({ where: { authUserId: null } });
  if (unownedCount === 1) {
    const unowned = await prisma.tradieProfile.findFirst({
      where: { authUserId: null },
      orderBy: { createdAt: "asc" },
    });
    if (unowned) {
      return prisma.tradieProfile.update({
        where: { id: unowned.id },
        data: { authUserId: user.id },
      });
    }
  }

  const baseSlug = user.email?.split("@")[0] || user.name || "tradie";
  const slug = await createUniqueSlugAsync(baseSlug);
  const businessName = user.name?.trim() || (user.email ? `${user.email.split("@")[0]} Trades` : "My Business");

  return prisma.tradieProfile.create({
    data: {
      authUserId: user.id,
      slug,
      businessName,
      services: [],
      serviceAreas: [],
      testimonials: [],
      projects: [],
      brandSettings: {},
      plan: "FREE",
    },
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

export async function upsertCurrentTradieAsync(input: {
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
  projects?: Array<{ title: string; suburb?: string; summary?: string }>;
  brandSettings?: { primaryColor?: string; footerText?: string };
  plan?: Plan;
}) {
  const current = await getCurrentTradieAsync();
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

  try {
    return await prisma.tradieProfile.update({
      where: { id: current.id },
      data: {
        authUserId: current.authUserId,
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
      (current.brandSettings as { primaryColor?: string; footerText?: string; profile?: LegacyProfileFallback } | null) ??
      {};

    return prisma.tradieProfile.update({
      where: { id: current.id },
      data: {
        authUserId: current.authUserId,
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
