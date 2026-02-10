import prisma from "@/db/prisma";
import { Prisma } from "@prisma/client";
import { revisionCreateSchema } from "@/core/messages/messageSchemas";

export async function createRevisionAsync(
  quoteId: string,
  summary: string | null,
  snapshot: unknown,
  revisionNumber: number
) {
  const parsed = revisionCreateSchema.parse({ summary: summary ?? undefined, snapshot });
  return prisma.quoteRevision.create({
    data: {
      quoteId,
      revisionNumber,
      summary: parsed.summary ?? null,
      snapshot: parsed.snapshot as Prisma.InputJsonValue,
    },
  });
}

export async function listRevisionsAsync(quoteId: string) {
  return prisma.quoteRevision.findMany({
    where: { quoteId },
    orderBy: { revisionNumber: "desc" },
  });
}
