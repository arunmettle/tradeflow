"use client";

import { useMemo, useState } from "react";
import { calculateLineTotal } from "@/core/quotes/quoteCalculator";
import { QuoteLineInput, quoteLineInputSchema } from "@/core/quotes/quoteSchemas";
import { calculateQuoteTotals } from "@/core/quotes/quoteCalculator";

type QuoteLineEditorProps = {
  lines?: QuoteLineInput[];
  initialLines?: QuoteLineInput[];
  includeGst?: boolean;
  onChange?: (lines: QuoteLineInput[]) => void;
  lineMeta?: Array<{
    suggestedUnitRate?: number | null;
    rateConfidence?: number | null;
    rateSource?: string | null;
    needsReview?: boolean | null;
    autoApplied?: boolean | null;
  }>;
};

const defaultLine = quoteLineInputSchema.parse({
  name: "Line item",
  category: "General",
  qty: 1,
  unit: "unit",
  unitRate: 0,
});

export function QuoteLineEditor({
  lines: controlledLines,
  initialLines,
  includeGst = true,
  onChange,
  lineMeta,
}: QuoteLineEditorProps) {
  const [uncontrolledLines, setUncontrolledLines] = useState<QuoteLineInput[]>(() =>
    initialLines && initialLines.length > 0 ? initialLines : [defaultLine]
  );

  const lines = controlledLines ?? uncontrolledLines;

  const handleChange = <K extends keyof QuoteLineInput>(
    index: number,
    key: K,
    value: QuoteLineInput[K]
  ) => {
    const next = lines.map((line, idx) => (idx === index ? { ...line, [key]: value } : line));
    if (controlledLines) {
      onChange?.(next);
    } else {
      setUncontrolledLines(next);
      onChange?.(next);
    }
  };

  const addLine = () => {
    const next = [...lines, { ...defaultLine, name: `Line ${lines.length + 1}` }];
    if (controlledLines) {
      onChange?.(next);
    } else {
      setUncontrolledLines(next);
      onChange?.(next);
    }
  };

  const removeLine = (index: number) => {
    const next = lines.length === 1 ? lines : lines.filter((_, idx) => idx !== index);
    if (controlledLines) {
      onChange?.(next);
    } else {
      setUncontrolledLines(next);
      onChange?.(next);
    }
  };

  const totals = useMemo(
    () =>
      lines.map((line) => ({
        ...line,
        lineTotal: calculateLineTotal(Number(line.qty), Number(line.unitRate)),
      })),
    [lines]
  );

  const aggregates = useMemo(() => {
    const { subTotal, gstAmount, total } = calculateQuoteTotals(
      totals,
      includeGst ?? true
    );
    return {
      subTotal,
      gstAmount,
      total,
    };
  }, [totals, includeGst]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Line items</h3>
        <button
          type="button"
          onClick={addLine}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add line
        </button>
      </div>

      <div className="space-y-3">
        {totals.map((line, index) => {
          const meta = lineMeta?.[index];
          const suggested =
            meta?.suggestedUnitRate !== undefined && meta?.suggestedUnitRate !== null
              ? Number(meta.suggestedUnitRate)
              : null;
          const confidence =
            meta?.rateConfidence !== undefined && meta?.rateConfidence !== null
              ? Number(meta.rateConfidence)
              : null;
          const autoApplied = meta?.autoApplied ?? false;
          const needsReview = meta?.needsReview ?? false;
          const rateSource = meta?.rateSource ?? null;

          return (
            <div
              key={index}
              className={`space-y-3 rounded-lg border border-gray-200 p-3 ${
                needsReview ? "bg-amber-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {autoApplied && (
                      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                        Auto-priced
                      </span>
                    )}
                    {needsReview && (
                      <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-900">
                        Needs review
                      </span>
                    )}
                    {suggested !== null && line.unitRate === 0 && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        Suggested ${suggested.toFixed(2)}
                        {confidence ? ` (${confidence}%` : ""}
                        {rateSource ? ` • ${rateSource.replace("_", " ")}` : ""}
                        {confidence ? ")" : ""}
                      </span>
                    )}
                  </div>
                  <input
                    name={`lines[${index}][name]`}
                    value={line.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    placeholder="Item name"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    required
                  />
                  <input
                    name={`lines[${index}][category]`}
                    value={line.category}
                    onChange={(e) => handleChange(index, "category", e.target.value)}
                    placeholder="Category"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="text-sm font-medium text-gray-500 hover:text-red-600"
                  disabled={lines.length === 1}
                  aria-label="Remove line"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Qty</label>
                  <input
                    name={`lines[${index}][qty]`}
                    type="number"
                    step="0.001"
                    min="0"
                    value={line.qty}
                    onChange={(e) => handleChange(index, "qty", Number(e.target.value))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Unit</label>
                  <input
                    name={`lines[${index}][unit]`}
                    value={line.unit}
                    onChange={(e) => handleChange(index, "unit", e.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Unit rate</label>
                  <input
                    name={`lines[${index}][unitRate]`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={Number(line.unitRate).toString()}
                    onChange={(e) => handleChange(index, "unitRate", Number(e.target.value))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Line total</label>
                  <div className="flex h-[42px] items-center rounded-md border border-gray-100 bg-gray-50 px-3 text-sm font-semibold text-gray-900">
                    ${line.lineTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <input
        type="hidden"
        name="linesJson"
        value={JSON.stringify(
          lines.map((line) => ({
            name: line.name,
            qty: Number(line.qty),
            unit: line.unit,
            unitRate: Number(line.unitRate),
            category: line.category,
          }))
        )}
      />

      <div className="space-y-1 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-800">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">${aggregates.subTotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>GST (10%)</span>
          <span className="font-semibold">
            {includeGst ? `$${aggregates.gstAmount.toFixed(2)}` : "$0.00"}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">
            $
            {includeGst
              ? aggregates.total.toFixed(2)
              : aggregates.subTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
