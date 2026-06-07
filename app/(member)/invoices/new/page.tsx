import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

export default async function NewInvoicePage() {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  // Fetch all approved members except self to populate buyer dropdown
  const members = await prisma.member.findMany({
    where: { status: "APPROVED", id: { not: memberId } },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  })

  async function createInvoice(formData: FormData) {
    "use server"

    const session = await auth()
    const sellerId = session?.user.memberId
    if (!sellerId) redirect("/login" as Route)

    const buyerId = formData.get("buyerId") as string
    const description = (formData.get("description") as string).trim()
    const creditAmount = parseFloat(formData.get("creditAmount") as string)
    const cashAmount = parseFloat(
      (formData.get("cashAmount") as string) || "0",
    )

    if (!buyerId || !description || isNaN(creditAmount) || creditAmount <= 0) {
      redirect("/invoices/new?error=invalid" as Route)
    }

    await prisma.invoice.create({
      data: {
        sellerId,
        buyerId,
        description,
        creditAmount,
        cashAmount,
        taxableValueUsd: creditAmount + cashAmount,
        status: "SENT",
        sentAt: new Date(),
      },
    })

    redirect("/invoices" as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New invoice</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          The buyer approves before the ledger posts.
        </p>
      </div>

      <div className="max-w-lg">
        <form action={createInvoice} className="space-y-5">
          {/* Buyer */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Bill to <span className="text-red-500">*</span>
            </label>
            {members.length === 0 ? (
              <p className="mt-1 text-sm text-gray-400">
                No other approved members found.
              </p>
            ) : (
              <select
                name="buyerId"
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="">Select member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={2}
              placeholder="What did you provide?"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                CC amount <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  name="creditAmount"
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
                Cash portion{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  name="cashAmount"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">
                  USD
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            1 CC = 1 USD for tax purposes. Taxable value = CC + cash.
          </p>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Send invoice
            </button>
            <a
              href="/invoices"
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
