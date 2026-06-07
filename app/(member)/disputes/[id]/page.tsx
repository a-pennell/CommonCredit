import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import type { Route } from "next"

async function getDispute(id: string) {
  return prisma.dispute.findUnique({
    where: { id },
    include: {
      transaction: {
        include: {
          payerAccount: { include: { member: { select: { id: true, displayName: true } } } },
          payeeAccount: { include: { member: { select: { id: true, displayName: true } } } },
        },
      },
      openedBy: { select: { id: true, displayName: true } },
      evidence: { orderBy: { createdAt: "asc" } },
      decisions: { orderBy: { createdAt: "desc" } },
    },
  })
}

export default async function DisputePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const memberId = session?.user.memberId
  const isAdmin = session?.user.role === "admin"

  const dispute = await getDispute(id)
  if (!dispute) notFound()

  // Only parties + admin can view
  const tx = dispute.transaction
  const isParty =
    tx.payerAccount.member.id === memberId ||
    tx.payeeAccount.member.id === memberId
  if (!isParty && !isAdmin) notFound()

  const canSubmitEvidence =
    isParty &&
    ["OPEN", "EVIDENCE_GATHERING"].includes(dispute.status)

  async function submitEvidence(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const member = await prisma.member.findUniqueOrThrow({
      where: { id: memberId },
      select: { displayName: true },
    })
    const content = (formData.get("content") as string).trim()
    if (!content) redirect(`/disputes/${id}` as Route)

    await prisma.$transaction([
      prisma.disputeEvidence.create({
        data: {
          disputeId: id,
          submittedById: memberId,
          submitterName: member.displayName,
          content,
        },
      }),
      prisma.dispute.update({
        where: { id },
        data: { status: "EVIDENCE_GATHERING" },
      }),
    ])

    redirect(`/disputes/${id}` as Route)
  }

  async function decide(formData: FormData) {
    "use server"
    const session = await auth()
    if (session?.user.role !== "admin") redirect(`/disputes/${id}` as Route)

    const decision = (formData.get("decision") as string).trim()
    const sanctionType = formData.get("sanctionType") as string || null
    const sanctionDetails = (formData.get("sanctionDetails") as string).trim() || null

    if (!decision) redirect(`/disputes/${id}` as Route)

    await prisma.$transaction([
      prisma.disputeDecision.create({
        data: {
          disputeId: id,
          decidedById: "admin",
          decidedByName: "Admin",
          decision,
          sanctionType: sanctionType as "WARNING" | "LIMIT_REDUCTION" | "SUSPENSION" | null,
          sanctionDetails,
        },
      }),
      prisma.dispute.update({
        where: { id },
        data: { status: "DECIDED" },
      }),
    ])

    redirect(`/disputes/${id}` as Route)
  }

  const STATUS_LABELS: Record<string, string> = {
    OPEN: "Open",
    EVIDENCE_GATHERING: "Evidence gathering",
    MEDIATION: "Mediation",
    DECIDED: "Decided",
    APPEALED: "Appealed",
    CLOSED: "Closed",
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

      <div className="max-w-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dispute</h1>
            <p className="mt-0.5 text-xs text-gray-400 font-mono">{id}</p>
          </div>
          <span className="rounded bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            {STATUS_LABELS[dispute.status] ?? dispute.status}
          </span>
        </div>

        {/* Transaction */}
        <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Transaction in dispute</p>
          <p className="text-sm font-medium text-gray-900">{tx.description}</p>
          <p className="mt-1 text-xs text-gray-500">
            {tx.payerAccount.member.displayName} → {tx.payeeAccount.member.displayName} ·{" "}
            {Number(tx.creditAmount).toFixed(2)} CC ·{" "}
            {dispute.type.replace(/_/g, " ").toLowerCase()}
          </p>
        </div>

        {/* Evidence thread */}
        <div className="mb-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Evidence ({dispute.evidence.length})
          </h2>
          <div className="space-y-3">
            {dispute.evidence.map((e) => (
              <div key={e.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900">{e.submitterName}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{e.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submit evidence */}
        {canSubmitEvidence && (
          <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-gray-900">Add evidence</p>
            <form action={submitEvidence} className="space-y-3">
              <textarea
                name="content"
                required
                rows={4}
                placeholder="Additional context, dates, screenshots described in text…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                Submit evidence
              </button>
            </form>
          </div>
        )}

        {/* Decisions */}
        {dispute.decisions.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Decision
            </h2>
            {dispute.decisions.map((d) => (
              <div key={d.id} className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{d.decision}</p>
                {d.sanctionType && (
                  <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Sanction: {d.sanctionType.replace(/_/g, " ")}
                    {d.sanctionDetails && ` — ${d.sanctionDetails}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admin decision form */}
        {isAdmin && !["DECIDED", "CLOSED"].includes(dispute.status) && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-amber-700">
              Admin — issue decision
            </p>
            <form action={decide} className="space-y-3">
              <textarea
                name="decision"
                required
                rows={4}
                placeholder="Written decision — plain language, factual basis, outcome"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sanction (optional)</label>
                  <select
                    name="sanctionType"
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="WARNING">Warning</option>
                    <option value="LIMIT_REDUCTION">Limit reduction</option>
                    <option value="SUSPENSION">Suspension</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sanction details</label>
                  <input
                    type="text"
                    name="sanctionDetails"
                    placeholder="e.g. Debit limit reduced to -100 until Sept 1"
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800">
                Issue decision
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
