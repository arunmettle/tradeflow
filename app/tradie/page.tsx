import { upsertDefaultTradieActionAsync } from "@/features/tradie/actions/tradieActions";
import { getDefaultTradieAsync } from "@/features/tradie/repo/tradieRepo";

export default async function TradiePage() {
  const tradie = await getDefaultTradieAsync();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tradie settings</h1>
            <p className="text-sm text-gray-600">
              Single tradie mode for local/dev environments without authentication.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">Current default tradie</h2>
            <dl className="mt-3 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Slug</dt>
                <dd className="font-medium text-gray-900">{tradie.slug}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Business name</dt>
                <dd className="font-medium text-gray-900">{tradie.businessName}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Plan</dt>
                <dd className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                  {tradie.plan}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">Update default tradie</h2>
            <form action={upsertDefaultTradieActionAsync} className="mt-3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  name="slug"
                  defaultValue={tradie.slug ?? "demo"}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Used for URLs; must be unique.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Business name</label>
                <input
                  name="businessName"
                  defaultValue={tradie.businessName ?? "TradeFlow Demo Tradie"}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <select
                  name="plan"
                  defaultValue={tradie.plan ?? "FREE"}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="FREE">FREE</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save tradie
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
