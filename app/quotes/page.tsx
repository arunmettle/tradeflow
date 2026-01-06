import Link from "next/link";
import { listQuotesAsync } from "@/features/quotes/repo/quoteRepo";
import { DeleteQuoteButton } from "@/features/quotes/components/DeleteQuoteButton";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
};

export default async function QuotesPageAsync() {
  const quotes = await listQuotesAsync();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
            <p className="text-sm text-gray-600">Create and track customer quotes.</p>
          </div>
          <Link
            href="/quotes/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            New Quote
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/quotes/${quote.id}`}
                  className="text-sm font-semibold text-gray-900 hover:underline"
                >
                  Quote #{quote.number}
                </Link>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[quote.status] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {quote.status}
                </span>
              </div>
              <div className="text-base font-medium text-gray-900">{quote.customerName}</div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>{currency.format(Number(quote.total ?? 0))}</div>
                <div>{formatDate(new Date(quote.createdAt))}</div>
              </div>
              <div className="flex items-center justify-end gap-3 text-sm">
                <Link
                  href={`/quotes/${quote.id}/edit`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Edit
                </Link>
                <DeleteQuoteButton quoteId={quote.id} />
              </div>
            </div>
          ))}
        </div>

        {quotes.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
            No quotes yet. Create your first quote to get started.
          </div>
        )}
      </div>
    </div>
  );
}
