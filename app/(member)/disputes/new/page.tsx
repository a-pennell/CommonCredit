import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  TRANSACTION_DISPUTE: "Transaction dispute — amount or terms contested",
  SERVICE_QUALITY: "Service quality — work not as described",
  NON_DELIVERY: "Non-delivery — goods or services not provided",
  HARASSMENT_SAFETY: "Harassment or safety concern",
  CREDIT_ABUSE: "Credit abuse — gaming the system",
}

export default async function NewDisputePage({
  searchParams,
}: {
  searchParams: Promise<{ txId?: string }>
}) {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const params = await searchParams

  // Transactions this member was party to (posted, not already disputed)
  const account = await prisma.account.findUnique({ where: { memberId } })
  const transactions = account
    ? await prisma.transaction.findMany({
        where: {
          status: "POSTED",
          dispute: null,
          OR: [
            { payerAccountId: account.id },
            { payeeAccountId: account.id },
          ],
        },
        include: {
          payerAccount: { include: { member: { select: { displayName: true } } } },
          payeeAccount: { include: { member: { select: { displayName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : []

  async function open(formData: FormData) {
    "use server"
    const session = await auth()
    const openedById = session?.user.memberId
    if (!openedById) redirect("/login" as Route)

    const transactionId = formData.get("transactionId") as string
    const type = formData.get("type") as string
    const initialEvidence = (formData.get("evidence") as string).trim()

    if (!transactionId || !type || !initialEvidence) {
      redirect("/disputes/new?error=missing" as Route)
    }

    // Verify the opener was party to this transaction
    const account = await prisma.account.findUniqueOrThrow({
      where: { memberId: openedById },
    })
    const tx = await prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
    })
    if (
      tx.payerAccountId !== account.id &&
      tx.payeeAccountId !== account.id
    ) {
      redirect("/disputes/new?error=notparty" as Route)
    }

    const member = await prisma.member.findUniqueOrThrow({
      where: { id: openedById },
      select: { displayName: true },
    })

    const dispute = await prisma.dispute.create({
      data: {
        transactionId,
        openedById,
        type: type as
          | "TRANSACTION_DISPUTE"
          | "SERVICE_QUALITY"
          | "NON_DELIVERY"
          | "HARASSMENT_SAFETY"
          | "CREDIT_ABUSE",
        status: "OPEN",
        evidence: {
          create: {
            submittedById: openedById,
            submitterName: member.displayName,
            content: initialEvidence,
          },
        },
      },
    })

    redirect(`/disputes/${dispute.id}` as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-2">
        <a
          href="/disputes"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Disputes
        </a>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Open a dispute</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Disputes are reviewed by a network admin. Try resolving directly with
          the other member first.
        </p>
      </div>

      <div className="max-w-lg">
        <form action={open} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Transaction <span className="text-red-500">*</span>
            </label>
            <select
              name="transactionId"
              required
              defaultValue={params.txId ?? ""}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Select transaction…</option>
              {transactions.map((tx) => {
                const isSelf = tx.payerAccount.memberId === memberId
                const other = isSelf
                  ? tx.payeeAccount.member.displayName
                  : tx.payerAccount.member.displayName
                return (
                  <option key={tx.id} value={tx.id}>
                    {Number(tx.creditAmount).toFixed(0)} CC{" "}
                    {isSelf ? "→" : "←"} {other} — {tx.description.slice(0, 40)}
                  </option>
                )
              })}
            </select>
            {transactions.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                No eligible transactions found.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Dispute type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Select type…</option>
              {Object.entries(DISPUTE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Your account of events <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-gray-400">
              Be specific: dates, what was agreed, what happened, what you
              tried.
            </p>
            <textarea
              name="evidence"
              required
              rows={6}
              placeholder="On [date] I agreed to… The other member… I attempted to resolve this by…"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Submit dispute
            </button>
            <a
              href="/disputes"
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
