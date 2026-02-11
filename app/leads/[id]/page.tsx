import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadByIdAsync, markLeadViewedAsync } from "@/features/leads/repo/leadRepo";
import { generateDraftQuoteActionAsync } from "@/features/leads/actions/quoteDraftActions";
import { getCurrentTradieAsync } from "@/features/tradie/repo/tradieRepo";
import { DeleteLeadButton } from "@/features/leads/components/DeleteLeadButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const tradie = await getCurrentTradieAsync();
  const existingLead = await getLeadByIdAsync(tradie.id, id);
  if (!existingLead) return notFound();

  const lead = (await markLeadViewedAsync(tradie.id, id)) ?? existingLead;
  if (!lead) return notFound();

  const infoRow = (label: string, value?: string | null) => (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="break-words font-semibold text-gray-900 sm:text-right">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {tradie.businessName}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">Lead details</h1>
            <p className="text-sm text-gray-600">Submitted on {new Date(lead.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <form action={generateDraftQuoteActionAsync.bind(null, lead.id)}>
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Generate draft quote
              </button>
            </form>
            <DeleteLeadButton
              leadId={lead.id}
              triggerClassName="w-full rounded-md border border-red-200 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-700 hover:bg-red-100 sm:w-auto"
            />
            <Link
              href="/leads"
              className="rounded-md border border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Back to leads
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            {infoRow("Customer", lead.customerName)}
            {infoRow("Email", lead.customerEmail)}
            {infoRow("Phone", lead.customerPhone)}
            {infoRow("Suburb", lead.suburb)}
            {infoRow("Site address", lead.siteAddress)}
            {infoRow("Job category", lead.jobCategory)}
            {infoRow("Status", lead.status)}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">Job description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{lead.jobDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
