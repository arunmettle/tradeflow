import { Prisma } from "@prisma/client";
import prisma from "@/db/prisma";
import {
  QuoteCreateInput,
  quoteCreateInputSchema,
  quoteLineInputSchema,
} from "@/core/quotes/quoteSchemas";
import { calculateQuoteTotals } from "@/core/quotes/quoteCalculator";
import { getDefaultTradieAsync } from "@/features/tradie/repo/tradieRepo";
import { QuoteDraft } from "@/core/ai/quoteDraftSchemas";
import { applyRateSuggestionsToQuoteLinesAsync } from "@/features/rates/repo/rateMemoryRepo";
const toDecimal = (value: number) => new Prisma.Decimal(value);

export async function createQuoteAsync(input: QuoteCreateInput) {
  const parsedInput = quoteCreateInputSchema.parse(input);
  let scopeBullets = parsedInput.scopeBullets;
  let exclusions = parsedInput.exclusions;
  let linesInput = parsedInput.lines;
  let trade = parsedInput.trade;
  let jobType = parsedInput.jobType;

  const tradie = await getDefaultTradieAsync();

  const { normalizedLines, subTotal, gstAmount, total } = calculateQuoteTotals(
    linesInput.map((line) => quoteLineInputSchema.parse(line)),
    parsedInput.includeGst
  );

  const createdQuote = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        tradieId: tradie.id,
        customerName: parsedInput.customerName,
        customerEmail: parsedInput.customerEmail,
        siteAddress: parsedInput.siteAddress,
        jobDescriptionRaw: parsedInput.jobDescriptionRaw,
        trade: trade ?? parsedInput.trade ?? null,
        jobType: jobType ?? parsedInput.jobType ?? null,
        scopeBullets,
        exclusions,
        terms: parsedInput.terms,
        includeGst: parsedInput.includeGst,
        subTotal: toDecimal(subTotal),
        gstAmount: toDecimal(gstAmount),
        total: toDecimal(total),
        lines: {
          createMany: {
            data: normalizedLines.map((line) => ({
              name: line.name,
              category: line.category,
              qty: toDecimal(line.qty),
              unit: line.unit,
              unitRate: toDecimal(line.unitRate),
              lineTotal: toDecimal(line.lineTotal),
              suggestedUnitRate: null,
              rateSource: null,
              rateConfidence: null,
              needsReview: false,
            })),
          },
        },
      },
      include: {
        lines: true,
      },
    });

    return quote;
  });

  return createdQuote;
}

export async function listQuotesAsync() {
  const tradie = await getDefaultTradieAsync();
  return prisma.quote.findMany({
    where: { tradieId: tradie.id },
    select: {
      id: true,
      number: true,
      status: true,
      customerName: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuoteByIdAsync(id: string) {
  const trimmedId = id?.toString().trim();
  if (!trimmedId) {
    return null;
  }

  const isNumeric = /^[0-9]+$/.test(trimmedId);
  const asNumber = isNumeric ? Number(trimmedId) : null;
  const tradie = await getDefaultTradieAsync();
  const quote = await prisma.quote.findFirst({
    where: {
      tradieId: tradie.id,
      OR: [
        { id: trimmedId },
        ...(isNumeric && asNumber !== null ? [{ number: asNumber }] : []),
      ],
    },
    include: {
      lines: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return quote;
}

export async function updateQuoteAsync(id: string, input: QuoteCreateInput) {
  const trimmedId = id?.toString().trim();
  if (!trimmedId) {
    throw new Error("Quote id is required");
  }

  const parsedInput = quoteCreateInputSchema.parse(input);

  let scopeBullets = parsedInput.scopeBullets;
  let exclusions = parsedInput.exclusions;
  let linesInput = parsedInput.lines;
  let trade = parsedInput.trade;
  let jobType = parsedInput.jobType;

  const tradie = await getDefaultTradieAsync();

  const { normalizedLines, subTotal, gstAmount, total } = calculateQuoteTotals(
    linesInput.map((line) => quoteLineInputSchema.parse(line)),
    parsedInput.includeGst
  );

  const updated = await prisma.$transaction(async (tx) => {
    // Replace lines
    await tx.quoteLine.deleteMany({ where: { quoteId: trimmedId } });

    const quote = await tx.quote.update({
      where: { id: trimmedId },
      data: {
        tradieId: tradie.id,
        customerName: parsedInput.customerName,
        customerEmail: parsedInput.customerEmail,
        siteAddress: parsedInput.siteAddress,
        jobDescriptionRaw: parsedInput.jobDescriptionRaw,
        trade: trade ?? parsedInput.trade ?? null,
        jobType: jobType ?? parsedInput.jobType ?? null,
        scopeBullets,
        exclusions,
        terms: parsedInput.terms,
        includeGst: parsedInput.includeGst,
        subTotal: toDecimal(subTotal),
        gstAmount: toDecimal(gstAmount),
        total: toDecimal(total),
        lines: {
          createMany: {
            data: normalizedLines.map((line) => ({
              name: line.name,
              category: line.category,
              qty: toDecimal(line.qty),
              unit: line.unit,
              unitRate: toDecimal(line.unitRate),
              lineTotal: toDecimal(line.lineTotal),
              suggestedUnitRate: null,
              rateSource: null,
              rateConfidence: null,
              needsReview: false,
            })),
          },
        },
      },
      include: { lines: true },
    });

    return quote;
  });

  return updated;
}

export async function createDraftQuoteFromLeadAsync(
  tradieId: string,
  leadId: string,
  draft: QuoteDraft
) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, tradieId },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  const lineItems = draft.lineItems?.length
    ? draft.lineItems
    : [{ name: "Scope to be confirmed", qty: 1, unit: "job" }];

  const quote = await prisma.$transaction(async (tx) => {
    const existingQuotes = await tx.quote.findMany({
      where: { tradieId, leadId },
      orderBy: { createdAt: "desc" },
    });

    const quoteToKeep = existingQuotes[0] ?? null;
    const quotesToDelete = existingQuotes.slice(1);

    if (quotesToDelete.length > 0) {
      const deleteIds = quotesToDelete.map((q) => q.id);
      await tx.quoteLine.deleteMany({ where: { quoteId: { in: deleteIds } } });
      await tx.quote.deleteMany({ where: { id: { in: deleteIds } } });
    }

    if (quoteToKeep) {
      // reset lines and update content on existing quote
      await tx.quoteLine.deleteMany({ where: { quoteId: quoteToKeep.id } });
      const updated = await tx.quote.update({
        where: { id: quoteToKeep.id },
        data: {
          status: "DRAFT",
          customerName: lead.customerName,
          customerEmail: lead.customerEmail,
          siteAddress: lead.siteAddress,
          jobDescriptionRaw: lead.jobDescription,
          trade: draft.trade ?? lead.jobCategory ?? null,
          jobType: draft.jobType ?? null,
          scopeBullets: draft.scopeBullets,
          exclusions: draft.exclusions,
          terms: {
            depositPercent: 50,
            validityDays: 14,
            notes: (draft.missingInfoQuestions ?? [])
              .map((q) => `- ${q}`)
              .join("\n"),
          },
          includeGst: true,
          subTotal: toDecimal(0),
          gstAmount: toDecimal(0),
          total: toDecimal(0),
          lines: {
            createMany: {
              data: lineItems.map((line) => ({
                name: line.name,
                category: lead.jobCategory ?? "General",
                qty: toDecimal(line.qty ?? 0),
                unit: line.unit,
                unitRate: toDecimal(0),
                suggestedUnitRate: null,
                rateSource: null,
                rateConfidence: null,
                needsReview: false,
                lineTotal: toDecimal(0),
              })),
            },
          },
        },
        include: { lines: true },
      });
      return updated;
    }

    const createdQuote = await tx.quote.create({
      data: {
        tradieId,
        leadId,
        status: "DRAFT",
        customerName: lead.customerName,
        customerEmail: lead.customerEmail,
        siteAddress: lead.siteAddress,
        jobDescriptionRaw: lead.jobDescription,
        trade: draft.trade ?? lead.jobCategory ?? null,
        jobType: draft.jobType ?? null,
        scopeBullets: draft.scopeBullets,
        exclusions: draft.exclusions,
        terms: {
          depositPercent: 50,
          validityDays: 14,
          notes: (draft.missingInfoQuestions ?? [])
            .map((q) => `- ${q}`)
            .join("\n"),
        },
        includeGst: true,
        subTotal: toDecimal(0),
        gstAmount: toDecimal(0),
        total: toDecimal(0),
        lines: {
          createMany: {
            data: lineItems.map((line) => ({
              name: line.name,
              category: lead.jobCategory ?? "General",
              qty: toDecimal(line.qty ?? 0),
              unit: line.unit,
              unitRate: toDecimal(0),
              suggestedUnitRate: null,
              rateSource: null,
              rateConfidence: null,
              needsReview: false,
              lineTotal: toDecimal(0),
            })),
          },
        },
      },
      include: { lines: true },
    });

    return createdQuote;
  });

  await applyRateSuggestionsToQuoteLinesAsync(tradieId, quote.id);

  return prisma.quote.findUnique({
    where: { id: quote.id },
    include: { lines: true },
  });
}
