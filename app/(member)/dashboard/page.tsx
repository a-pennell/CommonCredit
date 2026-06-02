import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function getMemberData(memberId: string | null) {
  if (!memberId) return null

  return prisma.member.findUnique({
    where: { id: memberId },
    include: {
      account: {
        select: {
          balance: true,
          creditLimit: true,
          debitLimit: true,
        },
      },
    },
  })
}

export default async function DashboardPage() {
  const session = await auth()
  const member = await getMemberData(session?.user.memberId ?? null)

  const balance = member?.account?.balance != null ? Number(member.account.balance) : null
  const creditLimit = member?.account?.creditLimit != null ? Number(member.account.creditLimit) : null
  const debitLimit = member?.account?.debitLimit != null ? Number(member.account.debitLimit) : null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Welcome back, {session?.user.name ?? "member"}.
        </p>
      </div>

      {balance !== null ? (
        <>
          {/* Balance card */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-xs font-medium text-gray-500">Current Balance</p>
            <p
              className={`mt-1 text-3xl font-semibold ${
                balance >= 0 ? "text-gray-900" : "text-red-600"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              {balance.toFixed(2)} CC
            </p>
            <div className="mt-3 flex gap-6 text-xs text-gray-400">
              <span>Credit limit: {creditLimit} CC</span>
              <span>Debit limit: {debitLimit} CC</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ActionCard
              label="Browse Marketplace"
              description="Find offers and needs"
              href="/marketplace"
            />
            <ActionCard
              label="Post an Offer"
              description="List what you can provide"
              href="/marketplace/new"
            />
            <ActionCard
              label="Create Invoice"
              description="Bill another member"
              href="/invoices/new"
            />
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-gray-900">
            Account not yet activated
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Your account will be activated once the network admin approves your
            membership.
          </p>
        </div>
      )}
    </div>
  )
}

function ActionCard({
  label,
  description,
  href,
}: {
  label: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
    </a>
  )
}
