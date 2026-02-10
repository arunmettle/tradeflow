import React from "react";
import { Prisma } from "@prisma/client";

type NumericLike = Prisma.Decimal | number | string | null | undefined;

type QuoteLine = {
  name: string;
  category: string;
  qty: NumericLike;
  unit: string;
  unitRate: NumericLike;
  lineTotal?: NumericLike;
};

type Tradie = {
  businessName: string;
  plan: string;
  logoUrl?: string | null;
};

type Quote = {
  number: number;
  customerName: string;
  customerEmail?: string | null;
  siteAddress?: string | null;
  jobDescriptionRaw: string;
  trade?: string | null;
  jobType?: string | null;
  scopeBullets?: unknown;
  exclusions?: unknown;
  terms?: unknown;
  includeGst: boolean;
  subTotal: NumericLike;
  gstAmount: NumericLike;
  total: NumericLike;
  lines: QuoteLine[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const toNumber = (value: NumericLike) =>
  value === null || value === undefined ? 0 : Number(value);

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? (value as string[]) : [];

const termsDefaults = (value: unknown) =>
  (value as { depositPercent?: number; validityDays?: number; notes?: string }) ?? {};

type Props = {
  quote: Quote;
  tradie: Tradie;
};

export function QuoteHtml({ quote, tradie }: Props) {
  const scope = toStringArray(quote.scopeBullets);
  const exclusions = toStringArray(quote.exclusions);
  const terms = termsDefaults(quote.terms);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Quote #{quote.number}</p>
            <h1 className="text-2xl font-semibold text-gray-900">{tradie.businessName}</h1>
            <p className="text-sm text-gray-600">
              {quote.trade ?? ""} {quote.jobType ? `· ${quote.jobType}` : ""}
            </p>
          </div>
          {tradie.plan === "PAID" && tradie.logoUrl && (
            <img
              src={tradie.logoUrl}
              alt={`${tradie.businessName} logo`}
              className="h-12 w-auto object-contain"
            />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
            <p className="text-xs font-semibold uppercase text-gray-500">Customer</p>
            <p className="mt-2 font-semibold text-gray-900">{quote.customerName}</p>
            {quote.customerEmail && <p>{quote.customerEmail}</p>}
            {quote.siteAddress && <p className="text-gray-600">{quote.siteAddress}</p>}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
            <p className="text-xs font-semibold uppercase text-gray-500">Job</p>
            <p className="mt-2">{quote.jobDescriptionRaw}</p>
          </div>
        </div>
      </header>

      {scope.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Scope</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {scope.map((item, idx) => (
              <li key={`scope-${idx}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <div className="col-span-2">Item</div>
          <div>Qty</div>
          <div>Unit</div>
          <div className="text-right">Rate</div>
          <div className="text-right">Total</div>
        </div>
        <div className="divide-y divide-gray-100">
          {quote.lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-6 items-center px-4 py-3 text-sm text-gray-800">
              <div className="col-span-2">
                <div className="font-medium text-gray-900">{line.name}</div>
                <div className="text-xs text-gray-500">{line.category}</div>
              </div>
              <div>{Number(line.qty)}</div>
              <div>{line.unit}</div>
              <div className="text-right">{currency.format(toNumber(line.unitRate))}</div>
              <div className="text-right font-semibold">
                {currency.format(toNumber(line.lineTotal))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900">Totals</h3>
          <dl className="mt-2 space-y-1 text-sm text-gray-700">
            <div className="flex items-center justify-between gap-4">
              <dt>Subtotal</dt>
              <dd className="font-medium">{currency.format(toNumber(quote.subTotal))}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>GST</dt>
              <dd className="font-medium">
                {quote.includeGst ? currency.format(toNumber(quote.gstAmount)) : "$0.00"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-2 text-base">
              <dt className="font-semibold text-gray-900">Total</dt>
              <dd className="font-semibold text-gray-900">
                {currency.format(toNumber(quote.total))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <h3 className="text-sm font-semibold text-gray-900">Terms</h3>
          <p>Deposit: {Number(terms.depositPercent ?? 0)}%</p>
          <p>Validity: {Number(terms.validityDays ?? 0)} days</p>
          {terms.notes && <p className="mt-2 whitespace-pre-wrap">{terms.notes}</p>}
        </div>
      </section>

      {exclusions.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Exclusions</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {exclusions.map((item, idx) => (
              <li key={`excl-${idx}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {tradie.plan !== "PAID" && (
        <footer className="text-center text-xs text-gray-500">
          Made with TradeFlow
        </footer>
      )}
    </div>
  );
}
