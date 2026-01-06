import { QuoteLineInput } from "./quoteSchemas";

const roundCurrency = (value: number) => Number(value.toFixed(2));

export const calculateLineTotal = (qty: number, unitRate: number) => {
  const total = qty * unitRate;
  return roundCurrency(total);
};

export const calculateQuoteTotals = (
  lines: QuoteLineInput[],
  includeGst: boolean,
  gstRate = 10
) => {
  const normalizedLines = lines.map((line) => {
    const lineTotal = calculateLineTotal(line.qty, line.unitRate);
    return { ...line, lineTotal };
  });

  const subTotal = roundCurrency(
    normalizedLines.reduce((sum, line) => sum + line.lineTotal, 0)
  );
  const gstAmount = includeGst ? roundCurrency((subTotal * gstRate) / 100) : 0;
  const total = includeGst ? roundCurrency(subTotal + gstAmount) : subTotal;

  return {
    subTotal,
    gstAmount,
    total,
    normalizedLines,
  };
};
