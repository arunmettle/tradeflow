export default function QuotesLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          <p className="text-sm font-medium text-gray-700">Loading quote view...</p>
        </div>
      </div>
    </div>
  );
}
