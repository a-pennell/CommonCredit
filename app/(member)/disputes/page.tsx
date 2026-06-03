import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-700",
  EVIDENCE_GATHERING: "bg-blue-50 text-blue-700",
  MEDIATION: "bg-purple-50 text-purple-700",
  DECIDED: "bg-green-50 text-green-700",
  APPEALED: "bg-orange-50 text-orange-700",
  CLOSED: "bg-gray-100 text-gray-400",
}

export default async function DisputesPage() {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const disputes = await prisma.dispute.findMany({
    where: { openedById: memberId },
    include: {
      transaction: { select: { description: true, creditAmount: true } },
      decisions: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Disputes</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Disputes you have opened
          </p>
        </div>
        <a
          href="/disputes/new"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
        >
          + Open dispute
        </a>
      </div>

      {disputes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No disputes opened.</p>
          <p className="mt-1 text-xs text-gray-400">
            Disputes are a last resort — try resolving directly with the other
            member first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <a
              key={d.id}
              href={`/disputes/${d.id}`}
              className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {d.transaction.description}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {Number(d.transaction.creditAmount).toFixed(2)} CC ·{" "}
                  {d.type.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[d.status] ?? "bg-gray-100 text-gray-500"}`}
              >
                {d.status.replace(/_/g, " ")}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
