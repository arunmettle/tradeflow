import { notFound } from "next/navigation";
import { getQuoteByTokenAsync } from "@/features/quotes/repo/quoteRepo";
import { QuoteHtml } from "@/features/quotes/render/quoteHtml";
import {
  acceptQuoteActionAsync,
  declineQuoteActionAsync,
} from "@/features/public/actions/publicQuoteActions";
import { sendCustomerMessageActionAsync } from "@/features/public/actions/publicMessageActions";
import {
  countUnreadByAuthor,
} from "@/core/messages/conversationNotifications";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";

export default async function PublicQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const statusParam = (await searchParams)?.status;
  const link = await getQuoteByTokenAsync(token);

  if (!link || !link.quote) {
    notFound();
  }

  const { quote } = link;
  const tradie = quote.tradie;
  const accepted = Boolean(link.acceptedAt) || quote.status === "ACCEPTED";
  const declined = Boolean(link.declinedAt) || quote.status === "DECLINED";
  const done = accepted || declined;
  const locked = quote.isConversationLocked;
  const messages = quote.messages ?? [];
  const unreadTradieCount = countUnreadByAuthor(
    messages,
    "TRADIE",
    quote.lastCustomerMessageAt
  );
  const unreadFromTradie = unreadTradieCount > 0;
  const banner =
    statusParam === "accepted"
      ? "Thanks, your acceptance has been recorded."
      : statusParam === "declined"
        ? "Your response has been recorded."
        : statusParam === "locked"
          ? "This conversation is locked."
          : statusParam === "rate_limited"
            ? "Please wait a few seconds before sending another message."
        : null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <AutoRefresh intervalMs={5000} enabled={!locked} />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {banner && (
          <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
            {banner}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <div>
              Revision #{quote.currentRevision} · Updated{" "}
              {new Date(quote.updatedAt).toLocaleString()}
            </div>
            <a
              href={`/q/${token}`}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </a>
          </div>
        </div>

        <QuoteHtml quote={quote} tradie={tradie} />

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Conversation</h2>
            <div className="flex items-center gap-2">
              {unreadFromTradie && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-900">
                  New reply from {tradie.businessName} ({unreadTradieCount})
                </span>
              )}
              <span className="text-xs text-gray-500">
                {locked ? "Locked after acceptance" : "Replies visible to both parties"}
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

          {locked ? (
            <p className="mt-4 text-sm text-gray-600">
              Conversation is locked after acceptance.
            </p>
          ) : (
            <form
              action={sendCustomerMessageActionAsync.bind(null, token)}
              className="mt-4 space-y-2"
            >
              <label className="text-sm font-medium text-gray-800">Ask a question</label>
              <textarea
                name="body"
                rows={4}
                placeholder="Type your message"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                required
                maxLength={1200}
              />
              <PendingSubmitButton
                label="Send message"
                pendingLabel="Sending..."
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70"
              />
            </form>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Accept or decline</h2>
          <p className="mt-1 text-sm text-gray-600">
            Let {tradie.businessName} know if you&apos;d like to proceed.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <form action={acceptQuoteActionAsync.bind(null, token)}>
              <button
                type="submit"
                className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={done}
              >
                {accepted ? "Accepted" : "Accept quote"}
              </button>
            </form>
            <form action={declineQuoteActionAsync.bind(null, token)} className="flex-1">
              <div className="flex flex-col gap-2">
                <textarea
                  name="declineReason"
                  rows={3}
                  placeholder="Reason for declining (optional)"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  disabled={done}
                />
                <button
                  type="submit"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={done}
                >
                  {declined ? "Declined" : "Decline quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
