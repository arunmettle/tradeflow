export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"
            aria-hidden="true"
          />
          <div className="text-sm font-medium text-slate-700">Loading...</div>
        </div>
      </div>
    </div>
  );
}
