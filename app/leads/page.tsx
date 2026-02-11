import Link from "next/link";
import { listLeadsAsync } from "@/features/leads/repo/leadRepo";
import { getCurrentTradieAsync } from "@/features/tradie/repo/tradieRepo";
import { LeadDraftActions } from "@/features/leads/components/LeadDraftActions";
import { DeleteLeadButton } from "@/features/leads/components/DeleteLeadButton";

export default async function LeadsPage() {
  const tradie = await getCurrentTradieAsync();
  const leads = await listLeadsAsync(tradie.id);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-600">
              Showing leads for {tradie.businessName} ({tradie.slug})
            </p>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
            No leads yet.
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="grid gap-3 sm:hidden">
              {leads.map((lead) => {
                const latestQuote = lead.quotes[0];
                const hasDraftQuote = latestQuote?.status === "DRAFT";
                const unread = !lead.viewedAt;

                return (
                  <div
                    key={lead.id}
                    className={`rounded-xl border p-4 shadow-sm ${
                      unread ? "border-blue-200 bg-blue-50/40" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-gray-900">
                          {lead.customerName}
                        </div>
                        <div className="truncate text-xs text-gray-600">{lead.customerEmail}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-800">
                        {lead.status}
                      </span>
                    </div>
                    {unread && (
                      <p className="mt-2 text-xs font-semibold text-blue-700">Unread</p>
                    )}

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-gray-50 p-2">
                        <dt className="text-gray-500">Suburb</dt>
                        <dd className="mt-0.5 font-medium text-gray-900">
                          {lead.suburb ?? "—"}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <dt className="text-gray-500">Category</dt>
                        <dd className="mt-0.5 font-medium text-gray-900">
                          {lead.jobCategory ?? "—"}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2 col-span-2">
                        <dt className="text-gray-500">Date</dt>
                        <dd className="mt-0.5 font-medium text-gray-900">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <LeadDraftActions leadId={lead.id} hasDraftQuote={hasDraftQuote} />
                      <div className="flex items-center gap-3">
                        <DeleteLeadButton leadId={lead.id} />
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop/tablet table */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
              <div className="grid grid-cols-9 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <div className="col-span-2">Customer</div>
                <div>Suburb</div>
                <div>Job category</div>
                <div>Status</div>
                <div>Date</div>
                <div className="text-right">Draft quote</div>
                <div className="text-right">Delete</div>
                <div className="text-right">View</div>
              </div>
              <div className="divide-y divide-gray-100">
                {leads.map((lead) => {
                  const latestQuote = lead.quotes[0];
                  const hasDraftQuote = latestQuote?.status === "DRAFT";
                  const unread = !lead.viewedAt;

                  return (
                    <div
                      key={lead.id}
                      className={`grid grid-cols-9 items-center px-4 py-3 text-sm ${
                        unread ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          <span>{lead.customerName}</span>
                          {unread && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              Unread
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{lead.customerEmail}</div>
                      </div>
                      <div className="text-gray-800">{lead.suburb ?? "—"}</div>
                      <div className="text-gray-800">{lead.jobCategory ?? "—"}</div>
                      <div>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-gray-700">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-right">
                        <LeadDraftActions leadId={lead.id} hasDraftQuote={hasDraftQuote} />
                      </div>
                      <div className="text-right">
                        <DeleteLeadButton leadId={lead.id} />
                      </div>
                      <div className="text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
