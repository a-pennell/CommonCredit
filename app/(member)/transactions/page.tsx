import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

async function getLedger(accountId: string) {
  // Fetch entries chronologically; we'll compute running balance client-side
  return prisma.ledgerEntry.findMany({
    where: { accountId },
    include: {
      transaction: {
        include: {
          payerAccount: { include: { member: { select: { name: true } } } },
          payeeAccount: { include: { member: { select: { name: true } } } },
        },
      },
    },
    orderBy: { postedAt: "desc" },
  })
}

export default async function TransactionsPage() {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const account = await prisma.account.findUnique({ where: { memberId } })
  if (!account) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
        <p className="mt-4 text-sm text-gray-500">
          Your account hasn&apos;t been activated yet.
        </p>
      </div>
    )
  }

  const entries = await getLedger(account.id)
  const balance = Number(account.balance)

  // Build running balance (newest first → iterate to compute from oldest)
  const entriesWithRunning: Array<
    (typeof entries)[number] & { running: number }
  > = []
  let running = balance
  for (const e of entries) {
    entriesWithRunning.push({ ...e, running })
    running += Number(e.debit) - Number(e.credit) // reverse back in time
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-gray-500">Your ledger history</p>
        </div>
        {/* Balance summary */}
        <div className="text-right">
          <p className="text-xs text-gray-400">Current balance</p>
          <p
            className={`text-2xl font-semibold ${balance >= 0 ? "text-gray-900" : "text-red-600"}`}
          >
            {balance >= 0 ? "+" : ""}
            {balance.toFixed(2)} CC
          </p>
          <p className="text-xs text-gray-400">
            Limits: {Number(account.debitLimit).toFixed(0)} /{" "}
            +{Number(account.creditLimit).toFixed(0)} CC
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No transactions yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Create an invoice to record your first exchange.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Counterparty</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entriesWithRunning.map((e) => {
                const txn = e.transaction
                const isDebit = Number(e.debit) > 0
                const amount = isDebit ? Number(e.debit) : Number(e.credit)
                const isSelf = txn.payerAccount.memberId === memberId
                const counterparty = isSelf
                  ? txn.payeeAccount.member.name
                  : txn.payerAccount.member.name

                return (
                  <tr key={e.id} className="text-sm">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                      {new Date(e.postedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-700">
                      <span className="line-clamp-1">{txn.description}</span>
                      {txn.referenceType === "INVOICE" && (
                        <a
                          href={`/invoices/${txn.referenceId}`}
                          className="block text-[11px] text-gray-400 hover:text-gray-600 hover:underline"
                        >
                          Invoice →
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{counterparty}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span
                        className={
                          isDebit ? "text-red-600" : "text-green-700"
                        }
                      >
                        {isDebit ? "−" : "+"}
                        {amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                      {e.running >= 0 ? "+" : ""}
                      {e.running.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
