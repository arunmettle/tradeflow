"use server";

import { revalidatePath } from "next/cache";
import { applyRateSuggestionsToQuoteLinesAsync } from "@/features/rates/repo/rateMemoryRepo";
import prisma from "@/db/prisma";

export async function applySuggestedRatesActionAsync(quoteId: string) {
  if (!quoteId) throw new Error("Quote id is required");
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Quote not found");

  await applyRateSuggestionsToQuoteLinesAsync(quote.tradieId, quote.id);
  revalidatePath(`/quotes/${quoteId}/edit`);
  revalidatePath("/leads");
  revalidatePath("/quotes");
}

export async function applySuggestedRateToLineActionAsync(lineId: string) {
  if (!lineId) throw new Error("Line id is required");
  const line = await prisma.quoteLine.findUnique({
    where: { id: lineId },
    include: { quote: true },
  });
  if (!line || !line.quote) {
    throw new Error("Line not found");
  }

  if (!line.suggestedUnitRate) {
    throw new Error("No suggestion available");
  }

  await prisma.quoteLine.update({
    where: { id: line.id },
    data: {
      unitRate: line.suggestedUnitRate,
      needsReview: false,
    },
  });

  revalidatePath(`/quotes/${line.quote.id}/edit`);
  revalidatePath("/quotes");
}
