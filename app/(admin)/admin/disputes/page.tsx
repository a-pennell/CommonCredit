import { prisma } from "@/lib/db"

export default async function AdminDisputesPage() {
  const disputes = await prisma.dispute.findMany({
    where: { status: { not: "CLOSED" } },
    include: {
      openedBy: { select: { displayName: true } },
      transaction: {
        include: {
          payerAccount: { include: { member: { select: { displayName: true } } } },
          payeeAccount: { include: { member: { select: { displayName: true } } } },
        },
      },
      evidence: { select: { id: true } },
      decisions: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const STATUS_STYLES: Record<string, string> = {
    OPEN: "bg-amber-50 text-amber-700",
    EVIDENCE_GATHERING: "bg-blue-50 text-blue-700",
    MEDIATION: "bg-purple-50 text-purple-700",
    DECIDED: "bg-green-50 text-green-700",
    APPEALED: "bg-orange-50 text-orange-700",
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Disputes</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {disputes.length === 0 ? "No open disputes" : `${disputes.length} open`}
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No open disputes. 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <a
              key={d.id}
              href={`/disputes/${d.id}`}
              className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {d.transaction.description}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {d.transaction.payerAccount.member.displayName} →{" "}
                  {d.transaction.payeeAccount.member.displayName} ·{" "}
                  {Number(d.transaction.creditAmount).toFixed(0)} CC
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Opened by {d.openedBy.displayName} ·{" "}
                  {d.type.replace(/_/g, " ").toLowerCase()} ·{" "}
                  {d.evidence.length} evidence item{d.evidence.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[d.status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {d.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(d.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
