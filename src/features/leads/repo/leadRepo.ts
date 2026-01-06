import prisma from "@/db/prisma";
import { LeadCreateInput, leadCreateInputSchema } from "@/core/leads/leadSchemas";

export async function createLeadAsync(tradieId: string, input: LeadCreateInput) {
  const parsed = leadCreateInputSchema.parse(input);

  return prisma.lead.create({
    data: {
      tradieId,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      customerPhone: parsed.customerPhone,
      siteAddress: parsed.siteAddress,
      suburb: parsed.suburb,
      jobCategory: parsed.jobCategory,
      jobDescription: parsed.jobDescription,
      photos: [],
    },
  });
}

export async function listLeadsAsync(tradieId: string) {
  return prisma.lead.findMany({
    where: { tradieId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeadByIdAsync(tradieId: string, id: string) {
  const trimmed = id?.toString().trim();
  if (!trimmed) return null;

  return prisma.lead.findFirst({
    where: { id: trimmed, tradieId },
  });
}

export async function updateLeadStatusAsync(tradieId: string, id: string, status: string) {
  const trimmed = id?.toString().trim();
  if (!trimmed) throw new Error("Lead id is required");

  const updated = await prisma.lead.updateMany({
    where: { id: trimmed, tradieId },
    data: { status },
  });

  if (updated.count === 0) {
    throw new Error("Lead not found");
  }

  return prisma.lead.findFirst({ where: { id: trimmed, tradieId } });
}
