"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QuoteCreateInput, quoteLineInputSchema } from "@/core/quotes/quoteSchemas";
import { mapQuoteUpdateFormDataToInput } from "@/core/quotes/formMapping";
import {
  createPublicLinkAsync,
  createQuoteAsync,
  updateQuoteAsync,
} from "../repo/quoteRepo";
import { upsertRateMemoryFromQuoteAsync } from "@/features/rates/repo/rateMemoryRepo";
import { revalidateQuotePaths } from "@/features/quotes/actions/revalidateQuote";
import { getCurrentTradieAsync } from "@/features/tradie/repo/tradieRepo";
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
  const tradie = await getCurrentTradieAsync();
  const quote = await createQuoteAsync(tradie.id, input);
  await upsertRateMemoryFromQuoteAsync(quote.tradieId, quote.id);
  await revalidateQuotePaths(quote.id);
  redirect(`/quotes/${quote.id}?created=1`);
}

export async function updateQuoteActionAsync(id: string, formData: FormData) {
  const tradie = await getCurrentTradieAsync();
  const input = mapQuoteUpdateFormDataToInput(formData);
  const quote = await updateQuoteAsync(tradie.id, id, input);
  await upsertRateMemoryFromQuoteAsync(quote.tradieId, quote.id);
  revalidatePath(`/quotes/${quote.id}/edit`);
  redirect(`/quotes/${quote.id}/edit?saved=1`);
}

export async function deleteQuoteActionAsync(id: string) {
  const tradie = await getCurrentTradieAsync();
  const quote = await prisma.quote.findFirst({ where: { id, tradieId: tradie.id } });
  if (!quote) {
    throw new Error("Quote not found");
  }
  await prisma.quote.delete({ where: { id: quote.id } });
  await revalidateQuotePaths(id);
  redirect("/quotes?deleted=1");
}

export async function deleteDraftQuoteActionAsync(formData: FormData) {
  const tradie = await getCurrentTradieAsync();
  const quoteId = formData.get("quoteId")?.toString().trim();
  const returnToRaw = formData.get("returnTo")?.toString().trim();
  const returnTo = returnToRaw && returnToRaw.startsWith("/") ? returnToRaw : "/quotes";

  if (!quoteId) {
    redirect(`${returnTo}?error=${encodeURIComponent("Missing quote id")}`);
  }

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tradieId: tradie.id },
    select: { id: true, status: true },
  });

  if (!quote) {
    redirect(`${returnTo}?error=${encodeURIComponent("Quote not found")}`);
  }

  if (quote.status !== "DRAFT") {
    redirect(`${returnTo}?error=${encodeURIComponent("Only draft quotes can be deleted")}`);
  }

  await prisma.quote.delete({ where: { id: quote.id } });
  await revalidateQuotePaths(quote.id);
  redirect(`${returnTo}?deleted=1`);
}

export async function createPublicLinkActionAsync(quoteId: string) {
  const tradie = await getCurrentTradieAsync();
  const token = await createPublicLinkAsync(tradie.id, quoteId);
  revalidatePath(`/quotes/${quoteId}/edit`);
  redirect(`/quotes/${quoteId}/edit?token=${encodeURIComponent(token)}&toast=quote_link_ready`);
}
