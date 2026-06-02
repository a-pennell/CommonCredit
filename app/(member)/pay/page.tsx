/**
 * Direct payment — payer-initiated.
 * Creates a PENDING Transaction (no Invoice). The payee confirms via
 * the Transactions page to post it to the ledger.
 */
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; error?: string }>
}) {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const params = await searchParams

  const account = await prisma.account.findUnique({ where: { memberId } })
  const members = await prisma.member.findMany({
    where: { status: "APPROVED", id: { not: memberId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  async function send(formData: FormData) {
    "use server"
    const session = await auth()
    const payerId = session?.user.memberId
    if (!payerId) redirect("/login" as Route)

    const payeeId = formData.get("payeeId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const description = (formData.get("description") as string).trim()

    if (!payeeId || isNaN(amount) || amount <= 0 || !description) {
      redirect("/pay?error=invalid" as Route)
    }

    const [payerAccount, payeeAccount] = await Promise.all([
      prisma.account.findUnique({ where: { memberId: payerId } }),
      prisma.account.findUnique({ where: { memberId: payeeId } }),
    ])

    if (!payerAccount || !payeeAccount) {
      redirect("/pay?error=noaccount" as Route)
    }

    // Validate limit (optimistic check — DB constraint is the hard guard)
    const projected = Number(payerAccount.balance) - amount
    if (projected < Number(payerAccount.debitLimit)) {
      redirect("/pay?error=insufficient" as Route)
    }

    await prisma.transaction.create({
      data: {
        payerAccountId: payerAccount.id,
        payeeAccountId: payeeAccount.id,
        creditAmount: amount,
        cashAmount: 0,
        taxableValueUsd: amount,
        description,
        status: "PENDING",
        referenceType: "DIRECT",
      },
    })

    redirect("/transactions" as Route)
  }

  const balance = account ? Number(account.balance) : null
  const debitLimit = account ? Number(account.debitLimit) : null

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Send credits</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          The recipient confirms before the ledger posts.
        </p>
      </div>

      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error === "insufficient"
            ? "This payment would exceed your debit limit."
            : params.error === "noaccount"
              ? "One or both accounts are not active."
              : "Please check your inputs and try again."}
        </div>
      )}

      <div className="max-w-md">
        {balance !== null && (
          <div className="mb-5 rounded-md bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">Your balance: </span>
            <span className="font-medium text-gray-900">
              {balance >= 0 ? "+" : ""}
              {balance.toFixed(2)} CC
            </span>
            <span className="ml-3 text-gray-400">
              (debit limit {debitLimit?.toFixed(0)} CC)
            </span>
          </div>
        )}

        <form action={send} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Pay to <span className="text-red-500">*</span>
            </label>
            <select
              name="payeeId"
              required
              defaultValue={params.to ?? ""}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Select member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Amount (CC) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">
                CC
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              What for? <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={2}
              placeholder="Brief description of what you're paying for"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <p className="text-xs text-gray-400">
            The recipient will see this payment and must confirm it before your
            balance changes.
          </p>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Send for confirmation
            </button>
            <a
              href="/transactions"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
