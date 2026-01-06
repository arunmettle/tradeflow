import { QuoteForm } from "@/features/quotes/components/QuoteForm";
import { createQuoteActionAsync } from "@/features/quotes/actions/quoteActions";

export default function NewQuotePageAsync() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">New Quote</h1>
            <p className="text-sm text-gray-600">Enter quote details manually.</p>
          </div>
        </div>
        <QuoteForm action={createQuoteActionAsync} submitLabel="Create quote" />
      </div>
    </div>
  );
}
