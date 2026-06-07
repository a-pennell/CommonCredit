import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

async function getLedger(accountId: string) {
  return prisma.ledgerEntry.findMany({
    where: { accountId },
    include: {
      transaction: {
        include: {
          payerAccount: { include: { member: { select: { id: true, displayName: true } } } },
          payeeAccount: { include: { member: { select: { id: true, displayName: true } } } },
        },
      },
    },
    orderBy: { postedAt: "desc" },
  })
}

async function getPendingReceived(accountId: string) {
  return prisma.transaction.findMany({
    where: { payeeAccountId: accountId, status: "PENDING" },
    include: {
      payerAccount: { include: { member: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })
}

async function getPendingSent(accountId: string) {
  return prisma.transaction.findMany({
    where: { payerAccountId: accountId, status: "PENDING" },
    include: {
      payeeAccount: { include: { member: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: "desc" },
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

  const [entries, pendingReceived, pendingSent] = await Promise.all([
    getLedger(account.id),
    getPendingReceived(account.id),
    getPendingSent(account.id),
  ])

  const balance = Number(account.balance)

  // Running balance — newest first, unwind back in time
  const entriesWithRunning: Array<(typeof entries)[number] & { running: number }> = []
  let running = balance
  for (const e of entries) {
    entriesWithRunning.push({ ...e, running })
    running += Number(e.debit) - Number(e.credit)
  }

  // ── Server actions ───────────────────────────────────────────────────────

  async function confirmPayment(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const txId = formData.get("txId") as string
    const account = await prisma.account.findUniqueOrThrow({ where: { memberId } })

    const tx = await prisma.transaction.findUniqueOrThrow({
      where: { id: txId },
      include: {
        payerAccount: true,
        payeeAccount: true,
      },
    })

    if (tx.payeeAccountId !== account.id || tx.status !== "PENDING") {
      redirect("/transactions" as Route)
    }

    const amount = Number(tx.creditAmount)
    const newPayerBalance = Number(tx.payerAccount.balance) - amount

    if (newPayerBalance < Number(tx.payerAccount.debitLimit)) {
      redirect("/transactions?error=insufficient" as Route)
    }

    await prisma.$transaction(async (db) => {
      await db.ledgerEntry.createMany({
        data: [
          { transactionId: txId, accountId: tx.payerAccountId, debit: tx.creditAmount, credit: 0 },
          { transactionId: txId, accountId: tx.payeeAccountId, debit: 0, credit: tx.creditAmount },
        ],
      })
      await db.account.update({
        where: { id: tx.payerAccountId },
        data: { balance: { decrement: amount } },
      })
      await db.account.update({
        where: { id: tx.payeeAccountId },
        data: { balance: { increment: amount } },
      })
      await db.transaction.update({
        where: { id: txId },
        data: { status: "POSTED" },
      })
    })

    redirect("/transactions" as Route)
  }

  async function declinePayment(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const txId = formData.get("txId") as string
    const account = await prisma.account.findUniqueOrThrow({ where: { memberId } })
    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: txId } })

    if (tx.payeeAccountId !== account.id || tx.status !== "PENDING") {
      redirect("/transactions" as Route)
    }

    await prisma.transaction.update({
      where: { id: txId },
      data: { status: "DRAFT" }, // DRAFT = declined/cancelled
    })

    redirect("/transactions" as Route)
  }

  async function cancelPayment(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const txId = formData.get("txId") as string
    const account = await prisma.account.findUniqueOrThrow({ where: { memberId } })
    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: txId } })

    if (tx.payerAccountId !== account.id || tx.status !== "PENDING") {
      redirect("/transactions" as Route)
    }

    await prisma.transaction.update({
      where: { id: txId },
      data: { status: "DRAFT" },
    })

    redirect("/transactions" as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-gray-500">Your ledger history</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <a
            href="/api/export/statement"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            Export CSV ↓
          </a>
        <div className="text-right">
          <p className="text-xs text-gray-400">Current balance</p>
          <p className={`text-2xl font-semibold ${balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
            {balance >= 0 ? "+" : ""}{balance.toFixed(2)} CC
          </p>
          <p className="text-xs text-gray-400">
            Limits: {Number(account.debitLimit).toFixed(0)} / +{Number(account.creditLimit).toFixed(0)} CC
          </p>
        </div>
        </div>
      </div>

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-amber-700">
            Pending — awaiting your confirmation ({pendingReceived.length})
          </h2>
          <div className="space-y-2">
            {pendingReceived.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{tx.payerAccount.member.displayName}</p>
                  <p className="truncate text-xs text-gray-500">{tx.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-green-700">
                    +{Number(tx.creditAmount).toFixed(2)} CC
                  </span>
                  <form action={confirmPayment} className="inline">
                    <input type="hidden" name="txId" value={tx.id} />
                    <button type="submit" className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
                      Confirm
                    </button>
                  </form>
                  <form action={declinePayment} className="inline">
                    <input type="hidden" name="txId" value={tx.id} />
                    <button type="submit" className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-white">
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-gray-500">
            Sent — awaiting recipient confirmation ({pendingSent.length})
          </h2>
          <div className="space-y-2">
            {pendingSent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{tx.payeeAccount.member.displayName}</p>
                  <p className="truncate text-xs text-gray-500">{tx.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-500">
                    −{Number(tx.creditAmount).toFixed(2)} CC
                  </span>
                  <form action={cancelPayment} className="inline">
                    <input type="hidden" name="txId" value={tx.id} />
                    <button type="submit" className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-500 hover:bg-white">
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ledger history */}
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No posted transactions yet.</p>
          <div className="mt-3 flex justify-center gap-3">
            <a href="/pay" className="text-xs text-gray-500 underline">Send credits</a>
            <a href="/invoices/new" className="text-xs text-gray-500 underline">Create invoice</a>
          </div>
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
                const tx = e.transaction
                const isDebit = Number(e.debit) > 0
                const amount = isDebit ? Number(e.debit) : Number(e.credit)
                const isSelf = tx.payerAccount.memberId === memberId
                const counterparty = isSelf
                  ? tx.payeeAccount.member.displayName
                  : tx.payerAccount.member.displayName

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
                      <span className="line-clamp-1">{tx.description}</span>
                      {tx.referenceType === "INVOICE" && (
                        <a href={`/invoices/${tx.referenceId}`} className="block text-[11px] text-gray-400 hover:text-gray-600 hover:underline">
                          Invoice →
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{counterparty}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className={isDebit ? "text-red-600" : "text-green-700"}>
                        {isDebit ? "−" : "+"}
                        {amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                      {e.running >= 0 ? "+" : ""}{e.running.toFixed(2)}
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
