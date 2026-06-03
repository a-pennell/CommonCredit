/**
 * Shown in the content area while any admin page is loading.
 * Sidebar remains visible — this only replaces {children}.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse p-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-5 w-36 rounded-md bg-gray-200" />
          <div className="mt-2 h-3.5 w-44 rounded-md bg-gray-100" />
        </div>
        <div className="h-7 w-24 rounded-md bg-gray-100" />
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-100 p-5">
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="mt-2.5 h-7 w-16 rounded-md bg-gray-200" />
            <div className="mt-1.5 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-100">
        {/* Header row */}
        <div className="flex gap-4 bg-gray-50 px-4 py-3">
          {[28, 40, 24, 32, 16].map((w, i) => (
            <div key={i} className={`h-3 w-${w} rounded bg-gray-200`} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-t border-gray-100 px-4 py-3"
          >
            <div className="h-3 w-28 rounded bg-gray-100" />
            <div className="h-3 w-40 rounded bg-gray-100" />
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-3 w-32 rounded bg-gray-100" />
            <div className="ml-auto h-5 w-14 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
