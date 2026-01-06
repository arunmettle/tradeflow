"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QuoteCreateInput, quoteLineInputSchema } from "@/core/quotes/quoteSchemas";
import { createQuoteAsync, updateQuoteAsync } from "../repo/quoteRepo";
import { upsertRateMemoryFromQuoteAsync } from "@/features/rates/repo/rateMemoryRepo";
import { revalidateQuotePaths } from "@/features/quotes/actions/revalidateQuote";
import prisma from "@/db/prisma";

type LineField = "name" | "category" | "qty" | "unit" | "unitRate";

const parseNumber = (value: FormDataEntryValue | null, fallback = 0) => {
  if (value === null) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const parseLinesFromFormData = (formData: FormData) => {
  const linesMap = new Map<number, Partial<Record<LineField, string | number>>>();

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^lines\[(\d+)\]\[(name|category|qty|unit|unitRate)\]$/);
    if (!match) continue;
    const index = Number(match[1]);
    const field = match[2] as LineField;

    const existing = linesMap.get(index) ?? {};
    if (field === "qty" || field === "unitRate") {
      existing[field] = parseNumber(value);
    } else {
      existing[field] = value.toString();
    }
    linesMap.set(index, existing);
  }

  return Array.from(linesMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, value]) => ({
      name: (value.name ?? "").toString(),
      category: (value.category ?? "General").toString(),
      qty: typeof value.qty === "number" ? value.qty : parseNumber(null, 1),
      unit: (value.unit ?? "unit").toString(),
      unitRate: typeof value.unitRate === "number" ? value.unitRate : parseNumber(null, 0),
    }));
};

const buildQuoteInputFromFormData = (formData: FormData): QuoteCreateInput => {
  const parseJsonField = <T>(key: string, fallback: T): T => {
    const raw = formData.get(key)?.toString();
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const includeGst = formData.get("includeGst") === "on";
  const rawTerms: QuoteCreateInput["terms"] = {
    depositPercent: parseNumber(formData.get("depositPercent"), 50),
    validityDays: parseNumber(formData.get("validityDays"), 14),
    notes: formData.get("termsNotes")?.toString().trim() ?? "",
  };

  const lines = parseLinesFromFormData(formData);
  const safeLines =
    lines.length > 0
      ? lines
      : [
          quoteLineInputSchema.parse({
            name: "Line item",
            category: "General",
            qty: 1,
            unit: "unit",
            unitRate: 0,
          }),
        ];

  return {
    customerName: formData.get("customerName")?.toString().trim() ?? "",
    customerEmail: formData.get("customerEmail")?.toString().trim() ?? undefined,
    siteAddress: formData.get("siteAddress")?.toString().trim() ?? undefined,
  jobDescriptionRaw: formData.get("jobDescriptionRaw")?.toString().trim() ?? "",
  trade: formData.get("trade")?.toString().trim() ?? undefined,
  jobType: formData.get("jobType")?.toString().trim() ?? undefined,
  includeGst,
  scopeBullets: parseJsonField<string[]>("scopeBullets", []),
  exclusions: parseJsonField<string[]>("exclusions", []),
  terms: rawTerms,
  lines: safeLines,
  };
};

export async function createQuoteActionAsync(formData: FormData) {
  const input = buildQuoteInputFromFormData(formData);
  const quote = await createQuoteAsync(input);
  await upsertRateMemoryFromQuoteAsync(quote.tradieId, quote.id);
  await revalidateQuotePaths(quote.id);
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteActionAsync(id: string, formData: FormData) {
  const input = buildQuoteInputFromFormData(formData);
  const quote = await updateQuoteAsync(id, input);
  await upsertRateMemoryFromQuoteAsync(quote.tradieId, quote.id);
  await revalidateQuotePaths(quote.id);
  redirect(`/quotes/${quote.id}`);
}

export async function deleteQuoteActionAsync(id: string) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) {
    throw new Error("Quote not found");
  }
  await prisma.quote.delete({ where: { id } });
  await revalidateQuotePaths(id);
  redirect("/quotes");
}
