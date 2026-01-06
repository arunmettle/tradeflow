import { Prisma } from "@prisma/client";
import prisma from "@/db/prisma";
import { normalizeLineName } from "@/core/rates/textNormalize";
import { suggestRateAsync } from "@/core/rates/rateSuggestion";

const toDecimal = (val: number) => new Prisma.Decimal(val);

type Tx = Prisma.TransactionClient | typeof prisma;

async function computeStatsAsync(db: Tx, tradieId: string, normalizedName: string, unit: string) {
  const samples = await db.rateSample.findMany({
    where: { tradieId, normalizedName, unit },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (samples.length === 0) {
    return { sampleCount: 0, median: 0, min: 0, max: 0 };
  }

  const rates = samples.map((s) => Number(s.rate)).sort((a, b) => a - b);
  const mid = Math.floor(rates.length / 2);
  const median = rates.length % 2 === 0 ? (rates[mid - 1] + rates[mid]) / 2 : rates[mid];
  const min = rates[0];
  const max = rates[rates.length - 1];

  return { sampleCount: rates.length, median, min, max };
}

export async function upsertRateMemoryFromQuoteAsync(tradieId: string, quoteId: string) {
  const lines = await prisma.quoteLine.findMany({
    where: { quoteId, unitRate: { gt: 0 } },
  });

  if (lines.length === 0) return;

  for (const line of lines) {
    const normalizedName = normalizeLineName(line.name);
    if (!normalizedName) continue;
    const unit = line.unit;
    const rate = Number(line.unitRate);
    if (!unit || rate <= 0) continue;

    await prisma.$transaction(async (tx) => {
      await tx.rateSample.create({
        data: {
          tradieId,
          normalizedName,
          unit,
          rate: line.unitRate,
        },
      });

      const stats = await computeStatsAsync(tx, tradieId, normalizedName, unit);

      await tx.rateMemory.upsert({
        where: {
          tradieId_normalizedName_unit: { tradieId, normalizedName, unit },
        },
        update: {
          lastRate: line.unitRate,
          sampleCount: stats.sampleCount,
          medianRate: toDecimal(stats.median),
          minRate: toDecimal(stats.min),
          maxRate: toDecimal(stats.max),
        },
        create: {
          tradieId,
          normalizedName,
          unit,
          category: line.category,
          lastRate: line.unitRate,
          sampleCount: stats.sampleCount,
          medianRate: toDecimal(stats.median),
          minRate: toDecimal(stats.min),
          maxRate: toDecimal(stats.max),
        },
      });
    });
  }
}

export async function applyRateSuggestionsToQuoteLinesAsync(tradieId: string, quoteId: string) {
  const lines = await prisma.quoteLine.findMany({
    where: { quoteId },
    orderBy: { createdAt: "asc" },
  });

  for (const line of lines) {
    const hasRate = Number(line.unitRate) > 0;
    if (hasRate) continue;

    const suggestion = await suggestRateAsync({
      tradieId,
      lineName: line.name,
      unit: line.unit,
      category: line.category,
    });

    if (!suggestion) continue;

    const autoApply = suggestion.rateConfidence >= 85;
    await prisma.quoteLine.update({
      where: { id: line.id },
      data: {
        suggestedUnitRate: suggestion.suggestedUnitRate,
        rateSource: suggestion.rateSource,
        rateConfidence: suggestion.rateConfidence,
        needsReview: suggestion.needsReview,
        unitRate: autoApply ? new Prisma.Decimal(suggestion.suggestedUnitRate) : line.unitRate,
      },
    });
  }
}
