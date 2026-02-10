import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuoteByIdAsync } from "@/features/quotes/repo/quoteRepo";
import { DeleteQuoteButton } from "@/features/quotes/components/DeleteQuoteButton";
import { getDefaultTradieAsync } from "@/features/tradie/repo/tradieRepo";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function QuoteDetailPageAsync({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tradie = await getDefaultTradieAsync();
  const quote = await getQuoteByIdAsync(tradie.id, id);

  if (!quote) {
    notFound();
  }

  const terms =
    (quote?.terms as { depositPercent?: number; validityDays?: number; notes?: string } | null) ??
    {};

  const scope = Array.isArray(quote?.scopeBullets)
    ? (quote.scopeBullets as string[])
    : [];
  const exclusions = Array.isArray(quote?.exclusions)
    ? (quote.exclusions as string[])
    : [];

  const totals = {
    subTotal: currency.format(Number(quote?.subTotal ?? 0)),
    gstAmount: currency.format(Number(quote?.gstAmount ?? 0)),
    total: currency.format(Number(quote?.total ?? 0)),
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Quote</p>
            <h1 className="text-2xl font-semibold text-gray-900">
              #{quote?.number} &mdash; {quote?.customerName}
            </h1>
            <p className="text-sm text-gray-600">{quote?.trade} · {quote?.jobType}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/quotes"
              className="text-sm font-semibold text-gray-700 underline-offset-4 hover:underline"
            >
              Back to list
            </Link>
            {quote?.status === "DRAFT" && (
              <Link
                href={`/quotes/${quote.id}/edit`}
                className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
              >
                Edit
              </Link>
            )}
            <DeleteQuoteButton quoteId={quote.id} className="text-sm font-semibold text-red-600 underline-offset-4 hover:underline" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Customer</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              <div className="font-medium">{quote?.customerName}</div>
              {quote?.customerEmail && <div>{quote.customerEmail}</div>}
              {quote?.siteAddress && <div className="text-gray-600">{quote.siteAddress}</div>}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Job</h2>
            <p className="mt-2 text-sm text-gray-700">{quote?.jobDescriptionRaw}</p>
          </div>
        </div>

        {/* Mobile line items */}
        <div className="grid gap-3 sm:hidden">
          {quote?.lines.map((line) => (
            <div key={line.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{line.name}</div>
                  <div className="truncate text-xs text-gray-500">{line.category}</div>
                </div>
                <div className="shrink-0 text-sm font-semibold text-gray-900">
                  {currency.format(Number(line.lineTotal ?? 0))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-gray-500">Qty</div>
                  <div className="mt-0.5 font-medium text-gray-900">{Number(line.qty)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-gray-500">Unit</div>
                  <div className="mt-0.5 font-medium text-gray-900">{line.unit}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-gray-500">Rate</div>
                  <div className="mt-0.5 font-medium text-gray-900">
                    {currency.format(Number(line.unitRate))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop/tablet line items */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white sm:block">
          <div className="grid grid-cols-6 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <div className="col-span-2">Item</div>
            <div>Qty</div>
            <div>Unit</div>
            <div className="text-right">Rate</div>
            <div className="text-right">Total</div>
          </div>
          <div className="divide-y divide-gray-100">
            {quote?.lines.map((line) => (
              <div key={line.id} className="grid grid-cols-6 items-center px-4 py-3 text-sm text-gray-800">
                <div className="col-span-2">
                  <div className="font-medium">{line.name}</div>
                  <div className="text-xs text-gray-500">{line.category}</div>
                </div>
                <div>{Number(line.qty)}</div>
                <div>{line.unit}</div>
                <div className="text-right">{currency.format(Number(line.unitRate))}</div>
                <div className="text-right font-semibold">
                  {currency.format(Number(line.lineTotal ?? 0))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Totals</h3>
            <dl className="mt-2 space-y-1 text-sm text-gray-700">
              <div className="flex items-center justify-between gap-4">
                <dt>Subtotal</dt>
                <dd className="font-medium">{totals.subTotal}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>GST</dt>
                <dd className="font-medium">{totals.gstAmount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-2 text-base">
                <dt className="font-semibold text-gray-900">Total</dt>
                <dd className="font-semibold text-gray-900">{totals.total}</dd>
              </div>
            </dl>
          </div>
          <div className="flex-1 space-y-3">
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Terms</p>
              <p>Deposit: {Number(terms.depositPercent ?? 0)}%</p>
              <p>Validity: {Number(terms.validityDays ?? 0)} days</p>
              {terms.notes && <p className="text-gray-600 whitespace-pre-wrap">{terms.notes}</p>}
            </div>
            {scope.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Scope</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
                  {scope.map((item, idx) => (
                    <li key={`scope-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {exclusions.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Exclusions</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
                  {exclusions.map((item, idx) => (
                    <li key={`excl-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
