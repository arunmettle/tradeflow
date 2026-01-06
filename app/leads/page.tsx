import Link from "next/link";
import { listLeadsAsync } from "@/features/leads/repo/leadRepo";
import { getDefaultTradieAsync } from "@/features/tradie/repo/tradieRepo";

export default async function LeadsPage() {
  const tradie = await getDefaultTradieAsync();
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

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <div className="col-span-2">Customer</div>
            <div>Suburb</div>
            <div>Job category</div>
            <div>Status</div>
            <div>Date</div>
            <div className="text-right">View</div>
          </div>
          <div className="divide-y divide-gray-100">
            {leads.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-600">No leads yet.</div>
            )}
            {leads.map((lead) => (
              <div key={lead.id} className="grid grid-cols-7 items-center px-4 py-3 text-sm">
                <div className="col-span-2">
                  <div className="font-semibold text-gray-900">{lead.customerName}</div>
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
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
