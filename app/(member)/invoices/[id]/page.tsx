import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import type { Route } from "next"

async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      seller: { include: { account: true } },
      buyer: { include: { account: true } },
    },
  })
}

async function getExistingRating(fromMemberId: string, transactionId: string) {
  return prisma.reputationEvent.findFirst({
    where: { fromMemberId, transactionId },
  })
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  // Only seller or buyer can view
  const isSeller = invoice.sellerId === memberId
  const isBuyer = invoice.buyerId === memberId
  if (!isSeller && !isBuyer) notFound()

  const canApprove = isBuyer && invoice.status === "SENT"
  const canCancel = isSeller && invoice.status === "SENT"

  // Rating: shown on PAID invoices; one rating per direction per transaction
  const existingRating =
    invoice.status === "PAID" && invoice.transactionId
      ? await getExistingRating(memberId, invoice.transactionId)
      : null
  const canRate =
    invoice.status === "PAID" && invoice.transactionId && !existingRating
  // Rater reviews the other party
  const ratedMemberId = isBuyer ? invoice.sellerId : invoice.buyerId

  const creditAmount = Number(invoice.creditAmount)
  const cashAmount = Number(invoice.cashAmount)
  const taxable = Number(invoice.taxableValueUsd)

  // ── Server actions ───────────────────────────────────────────────────────

  async function approveInvoice() {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const inv = await prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: {
        buyer: { include: { account: true } },
        seller: { include: { account: true } },
      },
    })

    if (inv.buyerId !== memberId || inv.status !== "SENT") {
      redirect(`/invoices/${id}` as Route)
    }

    const buyerAccount = inv.buyer.account
    const sellerAccount = inv.seller.account

    if (!buyerAccount || !sellerAccount) {
      throw new Error("One or both members have no ledger account")
    }

    const amount = Number(inv.creditAmount)
    const newBuyerBalance = Number(buyerAccount.balance) - amount

    // Enforce debit limit
    if (newBuyerBalance < Number(buyerAccount.debitLimit)) {
      redirect(`/invoices/${id}?error=insufficient` as Route)
    }

    await prisma.$transaction(async (tx) => {
      // Post the transaction
      const txn = await tx.transaction.create({
        data: {
          payerAccountId: buyerAccount.id,
          payeeAccountId: sellerAccount.id,
          creditAmount: inv.creditAmount,
          cashAmount: inv.cashAmount,
          taxableValueUsd: inv.taxableValueUsd,
          description: inv.description,
          status: "POSTED",
          referenceType: "INVOICE",
          referenceId: inv.id,
        },
      })

      // Double-entry ledger entries
      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: txn.id,
            accountId: buyerAccount.id,
            debit: inv.creditAmount,
            credit: 0,
          },
          {
            transactionId: txn.id,
            accountId: sellerAccount.id,
            debit: 0,
            credit: inv.creditAmount,
          },
        ],
      })

      // Update balances
      await tx.account.update({
        where: { id: buyerAccount.id },
        data: { balance: { decrement: Number(inv.creditAmount) } },
      })
      await tx.account.update({
        where: { id: sellerAccount.id },
        data: { balance: { increment: Number(inv.creditAmount) } },
      })

      // Mark invoice paid
      await tx.invoice.update({
        where: { id: inv.id },
        data: {
          status: "PAID",
          approvedAt: new Date(),
          paidAt: new Date(),
          transactionId: txn.id,
        },
      })
    })

    redirect("/invoices" as Route)
  }

  async function rejectInvoice(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const inv = await prisma.invoice.findUniqueOrThrow({ where: { id } })
    if (inv.buyerId !== memberId || inv.status !== "SENT") {
      redirect(`/invoices/${id}` as Route)
    }

    const note = (formData.get("note") as string)?.trim() || null
    await prisma.invoice.update({
      where: { id },
      data: { status: "REJECTED", rejectionNote: note },
    })

    redirect("/invoices" as Route)
  }

  async function cancelInvoice() {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const inv = await prisma.invoice.findUniqueOrThrow({ where: { id } })
    if (inv.sellerId !== memberId || inv.status !== "SENT") {
      redirect(`/invoices/${id}` as Route)
    }

    await prisma.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    redirect("/invoices" as Route)
  }

  async function submitRating(formData: FormData) {
    "use server"
    const session = await auth()
    const fromMemberId = session?.user.memberId
    if (!fromMemberId) redirect("/login" as Route)

    const inv = await prisma.invoice.findUniqueOrThrow({ where: { id } })
    if (inv.status !== "PAID" || !inv.transactionId) redirect(`/invoices/${id}` as Route)

    const toMemberId =
      inv.buyerId === fromMemberId ? inv.sellerId : inv.buyerId
    const score = parseInt(formData.get("score") as string)
    const comment = (formData.get("comment") as string).trim() || null

    if (isNaN(score) || score < 1 || score > 5) redirect(`/invoices/${id}` as Route)

    // Prevent duplicate
    const existing = await prisma.reputationEvent.findFirst({
      where: { fromMemberId, transactionId: inv.transactionId },
    })
    if (existing) redirect(`/invoices/${id}` as Route)

    await prisma.reputationEvent.create({
      data: {
        fromMemberId,
        toMemberId,
        transactionId: inv.transactionId,
        score,
        comment,
        dimension: "OVERALL",
        editableUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    })

    redirect(`/invoices/${id}?rated=1` as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <a href="/invoices" className="text-sm text-gray-400 hover:text-gray-600">
          ← Invoices
        </a>
      </div>

      <div className="max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Invoice</h1>
            <p className="mt-0.5 font-mono text-xs text-gray-400">
              {invoice.id}
            </p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        {/* Parties */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <p className="text-xs font-medium text-gray-400">From</p>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {invoice.seller.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">To</p>
            <p className="mt-0.5 text-sm font-medium text-gray-900">
              {invoice.buyer.name}
            </p>
          </div>
        </div>

        {/* Description + amounts */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-700">{invoice.description}</p>
          <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4">
            <Row label="CC amount" value={`${creditAmount.toFixed(2)} CC`} bold />
            {cashAmount > 0 && (
              <Row label="Cash portion" value={`$${cashAmount.toFixed(2)}`} />
            )}
            <Row
              label="Taxable value (1 CC = 1 USD)"
              value={`$${taxable.toFixed(2)}`}
              muted
            />
          </div>
        </div>

        {/* Dates */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500 space-y-1">
          <p>Created {fmt(invoice.createdAt)}</p>
          {invoice.sentAt && <p>Sent {fmt(invoice.sentAt)}</p>}
          {invoice.approvedAt && <p>Approved {fmt(invoice.approvedAt)}</p>}
          {invoice.paidAt && <p>Paid {fmt(invoice.paidAt)}</p>}
        </div>

        {/* Error banner */}
        {/* (insufficient funds — handled via query param) */}

        {/* Actions */}
        {canApprove && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-900">
              Approve this invoice?
            </p>
            <p className="text-xs text-gray-500">
              Approving will deduct{" "}
              <span className="font-medium">{creditAmount.toFixed(2)} CC</span>{" "}
              from your balance immediately.
            </p>
            <div className="flex gap-3">
              <form action={approveInvoice}>
                <button
                  type="submit"
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Approve &amp; pay
                </button>
              </form>
              <form action={rejectInvoice}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="note"
                    placeholder="Reason (optional)"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Reject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {canCancel && (
          <form action={cancelInvoice}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
            >
              Cancel invoice
            </button>
          </form>
        )}

        {invoice.rejectionNote && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Rejected: {invoice.rejectionNote}
          </div>
        )}

        {/* Rating prompt */}
        {canRate && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-900">
              Rate this exchange
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              How did it go? Ratings are visible to all members.
            </p>
            <form action={submitRating} className="mt-3 space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex cursor-pointer flex-col items-center gap-1">
                    <input type="radio" name="score" value={n} required className="sr-only peer" />
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-400 peer-checked:border-gray-900 peer-checked:bg-gray-900 peer-checked:text-white">
                      {n}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {["Poor", "Fair", "Good", "Great", "★"][n - 1]}
                    </span>
                  </label>
                ))}
              </div>
              <textarea
                name="comment"
                rows={2}
                placeholder="Optional comment (visible to all members)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <button
                type="submit"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Submit rating
              </button>
            </form>
          </div>
        )}

        {existingRating && (
          <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
            You rated this exchange{" "}
            <span className="font-medium text-gray-900">
              {existingRating.score}/5
            </span>
            {existingRating.comment && (
              <span className="ml-1 text-gray-600">
                — &ldquo;{existingRating.comment}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={muted ? "text-gray-400" : "text-gray-600"}>{label}</span>
      <span
        className={
          bold ? "font-semibold text-gray-900" : muted ? "text-gray-400" : "text-gray-900"
        }
      >
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-500",
    SENT: "bg-blue-50 text-blue-700",
    APPROVED: "bg-green-50 text-green-700",
    PAID: "bg-green-100 text-green-800",
    REJECTED: "bg-red-50 text-red-600",
    CANCELLED: "bg-gray-100 text-gray-400",
  }
  return (
    <span
      className={`rounded px-2.5 py-1 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  )
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
