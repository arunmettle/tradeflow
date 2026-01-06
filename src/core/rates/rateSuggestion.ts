import prisma from "@/db/prisma";
import { normalizeLineName } from "./textNormalize";
import { tokenJaccardSimilarity } from "./similarity";

type SuggestionInput = {
  tradieId: string;
  lineName: string;
  unit: string;
  category?: string | null;
};

type SuggestionResult = {
  suggestedUnitRate: number;
  rateSource: "history_exact" | "history_similar";
  rateConfidence: number;
  needsReview: boolean;
};

export async function suggestRateAsync(
  input: SuggestionInput
): Promise<SuggestionResult | null> {
  const normalizedName = normalizeLineName(input.lineName);
  if (!normalizedName || !input.unit) return null;

  const candidates = await prisma.rateMemory.findMany({
    where: { tradieId: input.tradieId, unit: input.unit },
  });

  if (candidates.length === 0) return null;

  const exact = candidates.find((c) => c.normalizedName === normalizedName);
  if (exact) {
    const sampleCount = exact.sampleCount ?? 0;
    const confidence = Math.min(95, 70 + sampleCount * 5);
    const rate =
      Number(exact.medianRate ?? 0) > 0
        ? Number(exact.medianRate)
        : Number(exact.lastRate ?? 0);
    if (rate <= 0) return null;
    return {
      suggestedUnitRate: rate,
      rateSource: "history_exact",
      rateConfidence: confidence,
      needsReview: confidence < 75,
    };
  }

  let best = null as { similarity: number; candidate: (typeof candidates)[number] } | null;
  for (const candidate of candidates) {
    const similarity = tokenJaccardSimilarity(normalizedName, candidate.normalizedName);
    if (!best || similarity > best.similarity) {
      best = { similarity, candidate };
    }
  }

  if (!best) return null;

  const sampleCount = best.candidate.sampleCount ?? 0;
  if (best.similarity < 0.55 || sampleCount < 2) return null;

  const rate =
    Number(best.candidate.medianRate ?? 0) > 0
      ? Number(best.candidate.medianRate)
      : Number(best.candidate.lastRate ?? 0);
  if (rate <= 0) return null;

  const confidence = Math.min(90, Math.round(best.similarity * 100));
  return {
    suggestedUnitRate: rate,
    rateSource: "history_similar",
    rateConfidence: confidence,
    needsReview: confidence < 75,
  };
}
