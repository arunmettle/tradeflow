import { notFound } from "next/navigation";
import { createLeadActionAsync } from "@/features/leads/actions/leadActions";
import { getTradieBySlugAsync } from "@/features/tradie/repo/tradieRepo";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function LeadCapturePage({ params }: Props) {
  const { slug } = await params;
  const tradie = await getTradieBySlugAsync(slug);
  if (!tradie) return notFound();

  const action = createLeadActionAsync.bind(null, tradie.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        <header className="space-y-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {tradie.businessName}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">Request a quote</h1>
          <p className="text-sm text-gray-600">
            Tell us about your job and we&apos;ll get back to you shortly.
          </p>
        </header>

        <form action={action} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Name</label>
                <input
                  name="customerName"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Jane Smith"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Suburb</label>
                <input
                  name="suburb"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Richmond"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-800">Site address</label>
              <input
                name="siteAddress"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Street and number"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-800">Job category</label>
              <input
                name="jobCategory"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Electrical, Plumbing"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-800">Job description</label>
              <textarea
                name="jobDescription"
                required
                rows={5}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe the work needed"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
