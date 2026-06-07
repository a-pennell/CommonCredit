import { prisma } from "@/lib/db"

async function getHealthData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  const [
    totalMembers,
    activeMembers30d,
    totalPosted,
    posted30d,
    posted60to30d,
    volumeResult,
    volume30d,
    accounts,
    offersPublished,
    needsPublished,
  ] = await Promise.all([
    prisma.member.count({ where: { status: "APPROVED" } }),

    // Active = made or received a posted transaction in last 30 days
    prisma.account.count({
      where: {
        OR: [
          {
            payerTransactions: {
              some: { status: "POSTED", createdAt: { gte: thirtyDaysAgo } },
            },
          },
          {
            payeeTransactions: {
              some: { status: "POSTED", createdAt: { gte: thirtyDaysAgo } },
            },
          },
        ],
      },
    }),

    prisma.transaction.count({ where: { status: "POSTED" } }),
    prisma.transaction.count({
      where: { status: "POSTED", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.transaction.count({
      where: {
        status: "POSTED",
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),

    prisma.transaction.aggregate({
      where: { status: "POSTED" },
      _sum: { creditAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "POSTED", createdAt: { gte: thirtyDaysAgo } },
      _sum: { creditAmount: true },
    }),

    prisma.account.findMany({
      select: { balance: true, memberId: true, member: { select: { displayName: true } } },
    }),

    prisma.offer.count({ where: { status: "PUBLISHED" } }),
    prisma.need.count({ where: { status: "PUBLISHED" } }),
  ])

  const totalVolume = Number(volumeResult._sum.creditAmount ?? 0)
  const volume30dNum = Number(volume30d._sum.creditAmount ?? 0)
  const velocityChange =
    posted60to30d > 0
      ? Math.round(((posted30d - posted60to30d) / posted60to30d) * 100)
      : null

  // Concentration: top holder's share of all positive balances
  const positiveBalances = accounts
    .map((a) => Number(a.balance))
    .filter((b) => b > 0)
  const totalPositive = positiveBalances.reduce((s, b) => s + b, 0)
  const maxPositive = Math.max(0, ...positiveBalances)
  const concentration =
    totalPositive > 0 ? Math.round((maxPositive / totalPositive) * 100) : 0

  // Top creditors and debtors
  const sorted = [...accounts].sort(
    (a, b) => Number(b.balance) - Number(a.balance),
  )
  const topCreditors = sorted.slice(0, 5)
  const topDebtors = sorted.slice(-5).reverse()

  return {
    totalMembers,
    activeMembers30d,
    totalPosted,
    posted30d,
    velocityChange,
    totalVolume,
    volume30dNum,
    concentration,
    topCreditors,
    topDebtors,
    offersPublished,
    needsPublished,
  }
}

export default async function HealthPage() {
  const h = await getHealthData()
  const participationRate =
    h.totalMembers > 0
      ? Math.round((h.activeMembers30d / h.totalMembers) * 100)
      : 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Network health</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Velocity, participation, and balance distribution
        </p>
      </div>

      {/* Top stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Active members (30d)"
          value={`${h.activeMembers30d} / ${h.totalMembers}`}
          sub={`${participationRate}% participation`}
          highlight={participationRate < 40}
        />
        <Stat
          label="Transactions (30d)"
          value={h.posted30d}
          sub={
            h.velocityChange !== null
              ? `${h.velocityChange >= 0 ? "+" : ""}${h.velocityChange}% vs prior 30d`
              : "No prior period data"
          }
        />
        <Stat
          label="Volume (30d)"
          value={`${h.volume30dNum.toFixed(0)} CC`}
          sub={`${h.totalVolume.toFixed(0)} CC all-time`}
        />
        <Stat
          label="Balance concentration"
          value={`${h.concentration}%`}
          sub="Top creditor's share"
          highlight={h.concentration > 50}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Balance distribution */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
            Top creditors
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <tbody className="divide-y divide-gray-100">
                {h.topCreditors.map((a) => (
                  <tr key={a.memberId}>
                    <td className="px-4 py-2.5 text-gray-700">{a.member.displayName}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-green-700">
                      +{Number(a.balance).toFixed(2)} CC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
            Top debtors
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <tbody className="divide-y divide-gray-100">
                {h.topDebtors.map((a) => (
                  <tr key={a.memberId}>
                    <td className="px-4 py-2.5 text-gray-700">{a.member.displayName}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-red-600">
                      {Number(a.balance).toFixed(2)} CC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Marketplace supply/demand */}
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
            Marketplace supply vs demand
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-2xl font-semibold text-gray-900">
                {h.offersPublished}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">Published offers</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <p className="text-2xl font-semibold text-amber-700">
                {h.needsPublished}
              </p>
              <p className="mt-0.5 text-sm text-amber-600">Unmet needs</p>
            </div>
          </div>
          {h.needsPublished > h.offersPublished && (
            <p className="mt-2 text-xs text-amber-700">
              ⚠ More needs than offers — invite members who can fill supply gaps.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string | number
  sub: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${highlight ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}
    >
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${highlight ? "text-amber-700" : "text-gray-900"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  )
}
