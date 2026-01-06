import { notFound } from "next/navigation";
import { getQuoteByIdAsync } from "@/features/quotes/repo/quoteRepo";
import { updateQuoteActionAsync } from "@/features/quotes/actions/quoteActions";
import { QuoteForm } from "@/features/quotes/components/QuoteForm";
import {
  applySuggestedRateToLineActionAsync,
  applySuggestedRatesActionAsync,
} from "@/features/quotes/actions/rateActions";

export default async function EditQuotePageAsync({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteByIdAsync(id);

  if (!quote) {
    notFound();
  }

  const action = updateQuoteActionAsync.bind(null, quote.id);
  const suggestedLines = quote.lines.filter(
    (line) =>
      line.suggestedUnitRate !== null &&
      line.suggestedUnitRate !== undefined &&
      Number(line.unitRate ?? 0) === 0
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Edit Quote #{quote.number}</h1>
            <p className="text-sm text-gray-600">Update details while in draft.</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Rate suggestions</p>
              <p className="text-xs text-gray-600">
                Apply suggestions from your history. High confidence is auto-applied; others can be applied below.
              </p>
            </div>
            <form action={applySuggestedRatesActionAsync.bind(null, quote.id)}>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Re-run suggestions
              </button>
            </form>
          </div>
          {suggestedLines.length === 0 ? (
            <p className="mt-2 text-xs text-gray-600">
              No pending suggestions. Lines with confidence ≥85% are auto-applied.
            </p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {suggestedLines.map((line) => (
                <div
                  key={line.id}
                  className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{line.name}</div>
                    <div className="text-xs text-gray-600">Unit: {line.unit}</div>
                  </div>
                  <div className="text-xs text-gray-700">
                    Suggested ${Number(line.suggestedUnitRate ?? 0).toFixed(2)}{" "}
                    {line.rateConfidence ? `(${line.rateConfidence}% confidence)` : ""}{" "}
                    {line.rateSource ? `• ${line.rateSource}` : ""}
                  </div>
                  <form action={applySuggestedRateToLineActionAsync.bind(null, line.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-100"
                    >
                      Apply suggested rate
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <QuoteForm
          initial={{
            customerName: quote.customerName,
            customerEmail: quote.customerEmail ?? "",
            siteAddress: quote.siteAddress ?? "",
            jobDescriptionRaw: quote.jobDescriptionRaw,
            trade: quote.trade,
            jobType: quote.jobType,
            includeGst: quote.includeGst,
            scopeBullets: (quote.scopeBullets as string[]) ?? [],
            exclusions: (quote.exclusions as string[]) ?? [],
            terms:
              (quote.terms as { depositPercent?: number; validityDays?: number; notes?: string }) ??
              { depositPercent: 50, validityDays: 14, notes: "" },
            lines: quote.lines.map((line) => ({
              name: line.name,
              category: line.category,
              qty: Number(line.qty),
              unit: line.unit,
              unitRate: Number(line.unitRate),
            })),
          }}
          lineMeta={quote.lines.map((line) => {
            const suggested = line.suggestedUnitRate ? Number(line.suggestedUnitRate) : null;
            const unitRate = Number(line.unitRate ?? 0);
            return {
              suggestedUnitRate: suggested,
              rateConfidence: line.rateConfidence ?? null,
              rateSource: line.rateSource ?? null,
              needsReview: line.needsReview ?? false,
              autoApplied: suggested !== null && unitRate > 0 && suggested === unitRate,
            };
          })}
          action={action}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
