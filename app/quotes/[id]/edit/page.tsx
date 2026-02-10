import { notFound } from "next/navigation";
import { getDefaultTradieAsync } from "@/features/tradie/repo/tradieRepo";
import { getQuoteByIdAsync, getPublicLinkForQuoteAsync } from "@/features/quotes/repo/quoteRepo";
import { createPublicLinkActionAsync, updateQuoteActionAsync } from "@/features/quotes/actions/quoteActions";
import { QuoteLineEditor } from "@/features/quotes/components/QuoteLineEditor";
import { QuoteShareLink } from "@/features/quotes/components/QuoteShareLink";
import {
  listMessagesAsync,
  markConversationSeenByTradieAsync,
} from "@/features/messages/repo/messageRepo";
import { sendTradieMessageActionAsync } from "@/features/quotes/actions/quoteMessageActions";
import { countUnreadByAuthor } from "@/core/messages/conversationNotifications";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function EditQuotePageAsync({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const tokenParam = (await searchParams)?.token;
  const tradie = await getDefaultTradieAsync();
  const quote = await getQuoteByIdAsync(tradie.id, id);
  const existingLink = await getPublicLinkForQuoteAsync(tradie.id, id);
  const token = tokenParam ?? existingLink?.token ?? null;
  const messages = quote ? await listMessagesAsync(quote.id) : [];

  if (!quote) {
    notFound();
  }

  const terms =
    (quote.terms as { depositPercent?: number; validityDays?: number; notes?: string }) ?? {};

  const scopeRaw = Array.isArray(quote.scopeBullets)
    ? (quote.scopeBullets as string[]).join("\n")
    : "";
  const exclusionsRaw = Array.isArray(quote.exclusions)
    ? (quote.exclusions as string[]).join("\n")
    : "";

  const totals = {
    subTotal: currency.format(Number(quote.subTotal ?? 0)),
    gstAmount: currency.format(Number(quote.gstAmount ?? 0)),
    total: currency.format(Number(quote.total ?? 0)),
  };
  let unreadCustomerCount = countUnreadByAuthor(
    messages,
    "CUSTOMER",
    quote.lastTradieMessageAt
  );
  if (unreadCustomerCount > 0) {
    await markConversationSeenByTradieAsync(quote.id, tradie.id);
    unreadCustomerCount = 0;
  }
  const unreadFromCustomer = unreadCustomerCount > 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <AutoRefresh intervalMs={5000} enabled={!quote.isConversationLocked} />
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Edit Quote #{quote.number}</h1>
              <p className="text-sm text-gray-600">Update details while in draft.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
              {quote.status}
            </span>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Share link</p>
              <p className="text-xs text-gray-600">
                Generate a customer link to view this quote.
              </p>
              {unreadFromCustomer && (
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  {unreadCustomerCount} new customer message
                  {unreadCustomerCount === 1 ? "" : "s"} in conversation.
                </p>
              )}
            </div>
            <form action={createPublicLinkActionAsync.bind(null, quote.id)}>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {token ? "Re-use link" : "Create share link"}
              </button>
            </form>
          </div>
          {token && (
            <div className="mt-3">
              <QuoteShareLink
                url={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/q/${token}`}
              />
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Conversation</h2>
            <div className="flex items-center gap-2">
              {unreadFromCustomer && (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-900">
                  New customer message ({unreadCustomerCount})
                </span>
              )}
              <span className="text-xs text-gray-500">
                {quote.isConversationLocked ? "Locked after acceptance" : "Active"}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-gray-600">No messages yet.</div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold">{message.authorType}</span>
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
              </div>
            ))}
          </div>
          {quote.isConversationLocked ? (
            <p className="mt-4 text-sm text-gray-600">Conversation is locked after acceptance.</p>
          ) : (
            <form
              action={sendTradieMessageActionAsync.bind(null, quote.id)}
              className="mt-4 space-y-2"
            >
              <label className="text-sm font-medium text-gray-800">Reply to customer</label>
              <textarea
                name="body"
                rows={4}
                placeholder="Type your reply"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                required
                maxLength={1200}
              />
              <PendingSubmitButton
                label="Send reply"
                pendingLabel="Sending..."
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70"
              />
            </form>
          )}
        </div>

        <form action={updateQuoteActionAsync.bind(null, quote.id)} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Customer name</label>
              <input
                name="customerName"
                defaultValue={quote.customerName}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Customer email</label>
                <input
                  name="customerEmail"
                  type="email"
                  defaultValue={quote.customerEmail ?? ""}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Site address</label>
                <input
                  name="siteAddress"
                  defaultValue={quote.siteAddress ?? ""}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Job description</label>
              <textarea
                name="jobDescriptionRaw"
                defaultValue={quote.jobDescriptionRaw}
                required
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Trade</label>
                <input
                  name="trade"
                  defaultValue={quote.trade ?? ""}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Job type</label>
                <input
                  name="jobType"
                  defaultValue={quote.jobType ?? ""}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="includeGst"
                defaultChecked={quote.includeGst}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label className="text-sm font-medium text-gray-800">Include GST (10%)</label>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800">Deposit %</label>
                <input
                  type="number"
                  name="depositPercent"
                  min="0"
                  max="100"
                  defaultValue={Number(terms.depositPercent ?? 0)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800">Validity (days)</label>
                <input
                  type="number"
                  name="validityDays"
                  min="1"
                  defaultValue={Number(terms.validityDays ?? 14)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-800">Terms notes</label>
                <input
                  name="termsNotes"
                  defaultValue={terms.notes ?? ""}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Scope</label>
              <textarea
                name="scopeBulletsRaw"
                rows={6}
                defaultValue={scopeRaw}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="- One bullet per line"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Exclusions</label>
              <textarea
                name="exclusionsRaw"
                rows={6}
                defaultValue={exclusionsRaw}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="- One bullet per line"
              />
            </div>
          </div>

          <QuoteLineEditor
            initialLines={quote.lines.map((line) => ({
              name: line.name,
              category: line.category,
              qty: Number(line.qty),
              unit: line.unit,
              unitRate: Number(line.unitRate),
            }))}
            includeGst={quote.includeGst}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-4">
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

          <div>
            <button
              type="submit"
              className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
