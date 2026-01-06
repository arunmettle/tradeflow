import prisma from "@/db/prisma";

const DEFAULT_TRADIE = {
  slug: "demo",
  businessName: "TradeFlow Demo Tradie",
  plan: "FREE",
} as const;

type Plan = "FREE" | "PAID";

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
  plan?: Plan;
}) {
  const slug = input.slug?.trim();
  const businessName = input.businessName?.trim();
  const plan = (input.plan ?? DEFAULT_TRADIE.plan) as Plan;

  if (!slug || !businessName) {
    throw new Error("Slug and business name are required");
  }

  const existing = await prisma.tradieProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return prisma.tradieProfile.update({
      where: { id: existing.id },
      data: {
        slug,
        businessName,
        plan,
      },
    });
  }

  return prisma.tradieProfile.create({
    data: {
      slug,
      businessName,
      plan,
    },
  });
}
