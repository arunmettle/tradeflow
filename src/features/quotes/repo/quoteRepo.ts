import { Prisma } from "@prisma/client";
import prisma from "@/db/prisma";
import {
  QuoteCreateInput,
  QuoteUpdateInput,
  quoteCreateInputSchema,
  quoteLineInputSchema,
  quoteUpdateInputSchema,
} from "@/core/quotes/quoteSchemas";
import { calculateQuoteTotals } from "@/core/quotes/quoteCalculator";
import { QuoteDraft } from "@/core/ai/quoteDraftSchemas";
import { applyRateSuggestionsToQuoteLinesAsync } from "@/features/rates/repo/rateMemoryRepo";
import crypto from "crypto";
const toDecimal = (value: number) => new Prisma.Decimal(value);

export async function createQuoteAsync(tradieId: string, input: QuoteCreateInput) {
  const parsedInput = quoteCreateInputSchema.parse(input);
  const scopeBullets = parsedInput.scopeBullets;
  const exclusions = parsedInput.exclusions;
  const linesInput = parsedInput.lines;
  const trade = parsedInput.trade;
  const jobType = parsedInput.jobType;

  const { normalizedLines, subTotal, gstAmount, total } = calculateQuoteTotals(
    linesInput.map((line) => quoteLineInputSchema.parse(line)),
    parsedInput.includeGst
  );

  const createdQuote = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        tradieId,
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

export async function listQuotesAsync(tradieId: string) {
  const tradie = { id: tradieId };
  return prisma.quote.findMany({
    where: { tradieId: tradie.id },
    select: {
      id: true,
      number: true,
      status: true,
      customerName: true,
      total: true,
      createdAt: true,
      lastCustomerMessageAt: true,
      lastTradieMessageAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuoteByIdAsync(tradieId: string, quoteId: string) {
  const trimmedId = quoteId?.toString().trim();
  if (!trimmedId) {
    return null;
  }

  const quote = await prisma.quote.findFirst({
    where: {
      tradieId,
      id: trimmedId,
    },
    include: {
      lines: {
        orderBy: { createdAt: "asc" },
      },
      tradie: true,
    },
  });

  return quote;
}

export async function updateQuoteAsync(
  tradieId: string,
  quoteId: string,
  input: QuoteUpdateInput
) {
  const trimmedId = quoteId?.toString().trim();
  if (!trimmedId) {
    throw new Error("Quote id is required");
  }

  const parsedInput = quoteUpdateInputSchema.parse(input);
  const { normalizedLines, subTotal, gstAmount, total } = calculateQuoteTotals(
    parsedInput.lines.map((line) => quoteLineInputSchema.parse(line)),
    parsedInput.includeGst
  );

  const existing = await prisma.quote.findFirst({
    where: { id: trimmedId, tradieId },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  if (!existing) {
    throw new Error("Quote not found");
  }

  const existingLines = existing.lines.map((line) => ({
    name: line.name,
    qty: Number(line.qty),
    unit: line.unit,
    unitRate: Number(line.unitRate),
    category: line.category,
  }));

  const nextLines = normalizedLines.map((line) => ({
    name: line.name,
    qty: Number(line.qty),
    unit: line.unit,
    unitRate: Number(line.unitRate),
    category: line.category,
  }));

  const totalsChanged =
    Number(existing.subTotal) !== subTotal ||
    Number(existing.gstAmount) !== gstAmount ||
    Number(existing.total) !== total;
  const detailsChanged =
    existing.customerName !== parsedInput.customerName ||
    (existing.customerEmail ?? "") !== (parsedInput.customerEmail ?? "") ||
    (existing.siteAddress ?? "") !== (parsedInput.siteAddress ?? "") ||
    existing.jobDescriptionRaw !== parsedInput.jobDescriptionRaw ||
    (existing.trade ?? "") !== (parsedInput.trade ?? "") ||
    (existing.jobType ?? "") !== (parsedInput.jobType ?? "") ||
    JSON.stringify(existing.scopeBullets ?? []) !== JSON.stringify(parsedInput.scopeBullets) ||
    JSON.stringify(existing.exclusions ?? []) !== JSON.stringify(parsedInput.exclusions) ||
    JSON.stringify(existing.terms ?? {}) !== JSON.stringify(parsedInput.terms);
  const linesChanged = JSON.stringify(existingLines) !== JSON.stringify(nextLines);

  let summary: string | null = null;
  if (linesChanged) summary = "Updated line items";
  else if (detailsChanged) summary = "Updated quote details";
  else if (totalsChanged) summary = "Updated pricing";

  const updated = await prisma.$transaction(async (tx) => {
    await tx.quoteLine.deleteMany({ where: { quoteId: trimmedId } });

    const quote = await tx.quote.update({
      where: { id: trimmedId },
      data: {
        customerName: parsedInput.customerName,
        customerEmail: parsedInput.customerEmail,
        siteAddress: parsedInput.siteAddress,
        jobDescriptionRaw: parsedInput.jobDescriptionRaw,
        trade: parsedInput.trade ?? null,
        jobType: parsedInput.jobType ?? null,
        scopeBullets: parsedInput.scopeBullets,
        exclusions: parsedInput.exclusions,
        terms: parsedInput.terms,
        includeGst: parsedInput.includeGst,
        subTotal: toDecimal(subTotal),
        gstAmount: toDecimal(gstAmount),
        total: toDecimal(total),
        currentRevision: summary ? (existing.currentRevision ?? 1) + 1 : existing.currentRevision ?? 1,
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
        lines: { orderBy: { createdAt: "asc" } },
        tradie: true,
      },
    });

    if (summary) {
      const nextRevision = (existing.currentRevision ?? 1) + 1;
      const snapshot = {
        customerName: parsedInput.customerName,
        customerEmail: parsedInput.customerEmail ?? null,
        siteAddress: parsedInput.siteAddress ?? null,
        jobDescriptionRaw: parsedInput.jobDescriptionRaw,
        scopeBullets: parsedInput.scopeBullets,
        exclusions: parsedInput.exclusions,
        terms: parsedInput.terms,
        includeGst: parsedInput.includeGst,
        trade: parsedInput.trade ?? null,
        jobType: parsedInput.jobType ?? null,
        totals: { subTotal, gstAmount, total },
        lines: normalizedLines.map((line) => ({
          name: line.name,
          category: line.category,
          qty: line.qty,
          unit: line.unit,
          unitRate: line.unitRate,
          lineTotal: line.lineTotal,
        })),
      };
      await tx.quoteRevision.create({
        data: {
          quoteId: trimmedId,
          revisionNumber: nextRevision,
          summary,
          snapshot,
        },
      });
      await tx.quoteMessage.create({
        data: {
          quoteId: trimmedId,
          authorType: "SYSTEM",
          body: `Quote updated to revision #${nextRevision}.`,
        },
      });
    }

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
    const existingDraftQuotes = await tx.quote.findMany({
      where: { tradieId, leadId, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
    });

    const quoteToKeep = existingDraftQuotes[0] ?? null;
    const quotesToDelete = existingDraftQuotes.slice(1);

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
            notes: "",
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
          notes: "",
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

  const savedQuote = await prisma.quote.findUnique({
    where: { id: quote.id },
    include: { lines: true },
  });
  if (!savedQuote) {
    throw new Error("Quote was created but could not be reloaded");
  }
  return savedQuote;
}

export async function deleteDraftQuoteForLeadAsync(tradieId: string, leadId: string) {
  const existingDraft = await prisma.quote.findFirst({
    where: {
      tradieId,
      leadId,
      status: "DRAFT",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existingDraft) {
    return null;
  }

  await prisma.quote.delete({
    where: { id: existingDraft.id },
  });

  return existingDraft.id;
}

function generateToken() {
  return crypto.randomBytes(18).toString("base64url");
}

export async function createPublicLinkAsync(tradieId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tradieId },
  });
  if (!quote) {
    throw new Error("Quote not found");
  }

  const existing = await prisma.quotePublicLink.findFirst({
    where: { quoteId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return existing.token;
  }

  const token = generateToken();
  const link = await prisma.quotePublicLink.create({
    data: {
      quoteId,
      token,
    },
  });
  return link.token;
}

export async function getPublicLinkForQuoteAsync(tradieId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tradieId },
  });
  if (!quote) return null;

  return prisma.quotePublicLink.findFirst({
    where: { quoteId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuoteByTokenAsync(token: string) {
  return prisma.quotePublicLink.findUnique({
    where: { token },
    include: {
      quote: {
        include: { lines: true, tradie: true, lead: true, messages: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
}

export async function acceptQuoteByTokenAsync(token: string) {
  const link = await prisma.quotePublicLink.findUnique({
    where: { token },
    include: { quote: true },
  });
  if (!link || !link.quote) throw new Error("Quote link not found");

  const updated = await prisma.quote.update({
    where: { id: link.quoteId },
    data: {
      status: "ACCEPTED",
      publicLinks: {
        update: {
          where: { id: link.id },
          data: { acceptedAt: new Date(), declinedAt: null, declineReason: null },
        },
      },
    },
  });
  return updated;
}

export async function declineQuoteByTokenAsync(token: string, reason?: string) {
  const link = await prisma.quotePublicLink.findUnique({
    where: { token },
    include: { quote: true },
  });
  if (!link || !link.quote) throw new Error("Quote link not found");

  const updated = await prisma.quote.update({
    where: { id: link.quoteId },
    data: {
      status: "DECLINED",
      publicLinks: {
        update: {
          where: { id: link.id },
          data: { declinedAt: new Date(), declineReason: reason ?? null, acceptedAt: null },
        },
      },
    },
  });
  return updated;
}
