import { prisma } from "@/lib/db"

async function getTransactions(status?: string) {
  return prisma.transaction.findMany({
    where: status ? { status: status as "POSTED" | "PENDING" | "DRAFT" | "REVERSED" } : {},
    include: {
      payerAccount: { include: { member: { select: { name: true } } } },
      payeeAccount: { include: { member: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
}

async function getNetworkSummary() {
  const [posted, pending, volume] = await Promise.all([
    prisma.transaction.count({ where: { status: "POSTED" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.transaction.aggregate({
      where: { status: "POSTED" },
      _sum: { creditAmount: true, taxableValueUsd: true },
    }),
  ])
  return {
    posted,
    pending,
    totalVolume: Number(volume._sum.creditAmount ?? 0),
    totalTaxable: Number(volume._sum.taxableValueUsd ?? 0),
  }
}

const STATUS_STYLES: Record<string, string> = {
  POSTED: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  DRAFT: "bg-gray-100 text-gray-500",
  REVERSED: "bg-red-50 text-red-500",
  DISPUTED: "bg-orange-50 text-orange-700",
}

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const [transactions, summary] = await Promise.all([
    getTransactions(params.status),
    getNetworkSummary(),
  ])

  const statuses = ["", "POSTED", "PENDING", "REVERSED"]

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-gray-500">Full network ledger</p>
        </div>
        <a
          href="/api/export/transactions"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          Export CSV ↓
        </a>
      </div>

      {/* Summary row */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          { label: "Posted", value: summary.posted },
          { label: "Pending", value: summary.pending },
          {
            label: "Total volume",
            value: `${summary.totalVolume.toFixed(0)} CC`,
          },
          {
            label: "Taxable value",
            value: `$${summary.totalTaxable.toFixed(0)}`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-gray-200 bg-white p-3"
          >
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="mb-4 flex gap-2">
        {statuses.map((s) => (
          <a
            key={s}
            href={s ? `/admin/transactions?status=${s}` : "/admin/transactions"}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (params.status ?? "") === s
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s || "All"}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">CC</th>
              <th className="px-4 py-3 text-right">Taxable ($)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="text-sm hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-400">
                  {new Date(tx.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-2.5 text-gray-700">
                  {tx.payerAccount.member.name}
                </td>
                <td className="px-4 py-2.5 text-gray-700">
                  {tx.payeeAccount.member.name}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-gray-600">
                  {tx.description}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-900">
                  {Number(tx.creditAmount).toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-500">
                  ${Number(tx.taxableValueUsd).toFixed(2)}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[tx.status] ?? "bg-gray-100 text-gray-500"}`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400">
                  {tx.referenceType ?? "DIRECT"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            No transactions found.
          </p>
        )}
      </div>
    </div>
  )
}
