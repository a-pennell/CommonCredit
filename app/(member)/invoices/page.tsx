import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

async function getInvoices(memberId: string) {
  return prisma.invoice.findMany({
    where: { OR: [{ sellerId: memberId }, { buyerId: memberId }] },
    include: {
      seller: { select: { id: true, name: true } },
      buyer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-500",
  SENT: "bg-blue-50 text-blue-700",
  APPROVED: "bg-green-50 text-green-700",
  PAID: "bg-green-100 text-green-800",
  REJECTED: "bg-red-50 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-400",
  OVERDUE: "bg-amber-50 text-amber-700",
}

export default async function InvoicesPage() {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const invoices = await getInvoices(memberId)

  const sent = invoices.filter((i) => i.sellerId === memberId)
  const received = invoices.filter((i) => i.buyerId === memberId)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Sent and received invoices
          </p>
        </div>
        <a
          href="/invoices/new"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
        >
          + New invoice
        </a>
      </div>

      <Section title="Received" invoices={received} memberId={memberId} />
      <Section
        title="Sent"
        invoices={sent}
        memberId={memberId}
        className="mt-8"
      />
    </div>
  )
}

function Section({
  title,
  invoices,
  memberId,
  className = "",
}: {
  title: string
  invoices: Awaited<ReturnType<typeof getInvoices>>
  memberId: string
  className?: string
}) {
  return (
    <div className={className}>
      <h2 className="mb-3 text-sm font-medium text-gray-500">{title}</h2>
      {invoices.length === 0 ? (
        <p className="text-sm text-gray-400">None yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">
                  {title === "Received" ? "From" : "To"}
                </th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => {
                const counterparty =
                  inv.sellerId === memberId ? inv.buyer : inv.seller
                const amount = Number(inv.creditAmount)
                return (
                  <tr
                    key={inv.id}
                    className="cursor-pointer text-sm hover:bg-gray-50"
                    onClick={() => {}}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <a href={`/invoices/${inv.id}`} className="hover:underline">
                        {counterparty.name}
                      </a>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                      {inv.description}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-900">
                      {amount.toFixed(2)} CC
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(inv.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
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
