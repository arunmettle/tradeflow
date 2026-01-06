import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadByIdAsync } from "@/features/leads/repo/leadRepo";
import { generateDraftQuoteActionAsync } from "@/features/leads/actions/quoteDraftActions";
import { getDefaultTradieAsync } from "@/features/tradie/repo/tradieRepo";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const tradie = await getDefaultTradieAsync();
  const lead = await getLeadByIdAsync(tradie.id, id);
  if (!lead) return notFound();

  const infoRow = (label: string, value?: string | null) => (
    <div className="flex justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {tradie.businessName}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">Lead details</h1>
            <p className="text-sm text-gray-600">Submitted on {new Date(lead.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <form action={generateDraftQuoteActionAsync.bind(null, lead.id)}>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Generate draft quote
              </button>
            </form>
            <Link href="/leads" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
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
