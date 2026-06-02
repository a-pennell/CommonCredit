import { prisma } from "@/lib/db"

async function getStats() {
  const [memberCount, pendingCount, transactionCount, netDebit, netCredit] =
    await Promise.all([
      prisma.member.count({ where: { status: "APPROVED" } }),
      prisma.member.count({ where: { status: "PENDING" } }),
      prisma.transaction.count({ where: { status: "POSTED" } }),
      // Network sum = Σcredit - Σdebit; must always be 0
      prisma.ledgerEntry.aggregate({ _sum: { debit: true } }),
      prisma.ledgerEntry.aggregate({ _sum: { credit: true } }),
    ])

  const debit = Number(netDebit._sum.debit ?? 0)
  const credit = Number(netCredit._sum.credit ?? 0)
  const networkSum = credit - debit

  return { memberCount, pendingCount, transactionCount, networkSum }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          CommonCredit network at a glance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Members"
          value={stats.memberCount}
          description="Approved accounts"
        />
        <StatCard
          label="Pending Applications"
          value={stats.pendingCount}
          description="Awaiting review"
          highlight={stats.pendingCount > 0}
        />
        <StatCard
          label="Transactions Posted"
          value={stats.transactionCount}
          description="All time"
        />
        <StatCard
          label="Network Balance"
          value={`${stats.networkSum >= 0 ? "+" : ""}${stats.networkSum} CC`}
          description={stats.networkSum === 0 ? "Balanced ✓" : "⚠ Drift detected"}
          highlight={stats.networkSum !== 0}
        />
      </div>

      {/* Empty-state next actions */}
      <div className="mt-8 rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-gray-900">
          No member activity yet
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Share the application link with your founding members to get started.
        </p>
        <div className="mt-4 inline-flex rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white">
          /apply{" "}
          <span className="ml-2 font-normal opacity-60">(coming soon)</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string
  value: string | number
  description: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-5 ${
        highlight ? "border-amber-200 bg-amber-50" : "border-gray-200"
      }`}
    >
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-semibold ${
          highlight ? "text-amber-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  )
}
