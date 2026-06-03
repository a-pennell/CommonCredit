import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function getMemberData(memberId: string | null) {
  if (!memberId) return null
  return prisma.member.findUnique({
    where: { id: memberId },
    include: {
      account: { select: { balance: true, creditLimit: true, debitLimit: true } },
      _count: { select: { sentInvoices: true, receivedInvoices: true } },
    },
  })
}

export default async function DashboardPage() {
  const session = await auth()
  const member = await getMemberData(session?.user.memberId ?? null)

  const balance = member?.account?.balance != null ? Number(member.account.balance) : null
  const creditLimit = member?.account?.creditLimit != null ? Number(member.account.creditLimit) : null
  const debitLimit = member?.account?.debitLimit != null ? Number(member.account.debitLimit) : null

  const usedCredit = balance !== null && creditLimit !== null ? creditLimit - balance : null
  const creditPercent =
    usedCredit !== null && creditLimit !== null && creditLimit > 0
      ? Math.min(100, Math.round((balance! / creditLimit) * 100))
      : null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Welcome back, {member?.name ?? session?.user.name ?? "member"}.
        </p>
      </div>

      {balance !== null ? (
        <div className="max-w-2xl space-y-6">
          {/* Balance card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Balance
            </p>
            <p
              className={`mt-1 text-4xl font-semibold tabular-nums ${
                balance < 0 ? "text-red-600" : "text-gray-900"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              {balance.toFixed(2)}{" "}
              <span className="text-2xl font-normal text-gray-400">CC</span>
            </p>

            {/* Credit bar */}
            {creditPercent !== null && (
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      balance < 0 ? "bg-red-400" : "bg-gray-400"
                    }`}
                    style={{ width: `${Math.abs(creditPercent)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
                  <span>{debitLimit?.toFixed(0)} CC</span>
                  <span>0</span>
                  <span>+{creditLimit?.toFixed(0)} CC</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Quick actions
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Send credits",
                  description: "Pay another member",
                  href: "/pay",
                  primary: true,
                },
                {
                  label: "Marketplace",
                  description: "Browse offers & needs",
                  href: "/marketplace",
                },
                {
                  label: "Create invoice",
                  description: "Bill for services",
                  href: "/invoices/new",
                },
              ].map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className={`flex flex-col rounded-lg border p-4 transition-colors ${
                    a.primary
                      ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${a.primary ? "text-white" : "text-gray-900"}`}
                  >
                    {a.label}
                  </p>
                  <p
                    className={`mt-0.5 text-xs ${a.primary ? "text-gray-300" : "text-gray-500"}`}
                  >
                    {a.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Pending / no account state
        <div className="max-w-lg">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <p className="font-medium text-amber-900">Application under review</p>
            <p className="mt-1 text-sm text-amber-700">
              Your membership application is being reviewed. Once approved, your
              account will be activated and you can start trading.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-gray-500">
              While you wait, explore the network:
            </p>
            <div className="flex gap-3">
              <a
                href="/marketplace"
                className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Browse marketplace
              </a>
              <a
                href="/members"
                className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                View members
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
