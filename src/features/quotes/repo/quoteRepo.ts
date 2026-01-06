import { Prisma } from "@prisma/client";
import prisma from "@/db/prisma";
import {
  QuoteCreateInput,
  quoteCreateInputSchema,
  quoteLineInputSchema,
} from "@/core/quotes/quoteSchemas";
import { calculateQuoteTotals } from "@/core/quotes/quoteCalculator";
const toDecimal = (value: number) => new Prisma.Decimal(value);

export async function createQuoteAsync(input: QuoteCreateInput) {
  const parsedInput = quoteCreateInputSchema.parse(input);
  let scopeBullets = parsedInput.scopeBullets;
  let exclusions = parsedInput.exclusions;
  let linesInput = parsedInput.lines;
  let trade = parsedInput.trade;
  let jobType = parsedInput.jobType;

  const { normalizedLines, subTotal, gstAmount, total } = calculateQuoteTotals(
    linesInput.map((line) => quoteLineInputSchema.parse(line)),
    parsedInput.includeGst
  );

  const createdQuote = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
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
  return prisma.quote.findMany({
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
  const quote = await prisma.quote.findFirst({
    where: {
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
