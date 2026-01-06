import { notFound } from "next/navigation";
import { getQuoteByIdAsync } from "@/features/quotes/repo/quoteRepo";
import { updateQuoteActionAsync } from "@/features/quotes/actions/quoteActions";
import { QuoteForm } from "@/features/quotes/components/QuoteForm";

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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Edit Quote #{quote.number}</h1>
            <p className="text-sm text-gray-600">Update details while in draft.</p>
          </div>
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
          action={action}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
