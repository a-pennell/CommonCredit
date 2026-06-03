/**
 * Shown in the content area (right of sidebar) while any member page
 * is loading. Sidebar remains visible — this only replaces {children}.
 */
export default function MemberLoading() {
  return (
    <div className="animate-pulse p-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="h-5 w-36 rounded-md bg-gray-200" />
        <div className="mt-2 h-3.5 w-52 rounded-md bg-gray-100" />
      </div>

      {/* Primary card */}
      <div className="mb-5 h-28 rounded-lg bg-gray-100" />

      {/* Secondary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="h-20 rounded-lg bg-gray-100" />
        <div className="h-20 rounded-lg bg-gray-100" />
        <div className="h-20 rounded-lg bg-gray-100" />
      </div>

      {/* Table-like block */}
      <div className="mt-5 overflow-hidden rounded-lg border border-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-0"
          >
            <div className="h-3 w-32 rounded bg-gray-100" />
            <div className="h-3 w-48 rounded bg-gray-100" />
            <div className="ml-auto h-3 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
