import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-500",
  COMMENT_PERIOD: "bg-blue-50 text-blue-700",
  VOTING: "bg-amber-50 text-amber-700",
  ENACTED: "bg-green-100 text-green-800",
  FAILED: "bg-red-50 text-red-500",
  ARCHIVED: "bg-gray-100 text-gray-400",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  COMMENT_PERIOD: "Comment period",
  VOTING: "Voting open",
  ENACTED: "Enacted",
  FAILED: "Failed",
  ARCHIVED: "Archived",
}

export default async function ProposalsPage() {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const proposals = await prisma.proposal.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: {
      proposer: { select: { name: true } },
      votes: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const active = proposals.filter((p) =>
    ["COMMENT_PERIOD", "VOTING"].includes(p.status),
  )
  const other = proposals.filter(
    (p) => !["COMMENT_PERIOD", "VOTING"].includes(p.status),
  )

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Proposals</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Governance proposals — one member, one vote
          </p>
        </div>
        <a
          href="/proposals/new"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
        >
          + New proposal
        </a>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No proposals yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Any member can submit a proposal for governance consideration.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Active
              </h2>
              <ProposalList proposals={active} memberId={memberId} />
            </section>
          )}
          {other.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                All proposals
              </h2>
              <ProposalList proposals={other} memberId={memberId} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ProposalList({
  proposals,
  memberId,
}: {
  proposals: Array<{
    id: string
    title: string
    status: string
    proposer: { name: string }
    votes: Array<{ id: string }>
    createdAt: Date
    votingDeadline: Date | null
    yesVotes: number | null
    noVotes: number | null
    abstainVotes: number | null
  }>
  memberId: string
}) {
  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <a
          key={p.id}
          href={`/proposals/${p.id}`}
          className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{p.title}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Proposed by {p.proposer.name} ·{" "}
              {new Date(p.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {p.status === "VOTING" && p.votingDeadline && (
                <span className="ml-2 text-amber-600">
                  Voting closes{" "}
                  {new Date(p.votingDeadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {p.votes.length > 0 && (
              <span className="text-xs text-gray-400">
                {p.votes.length} vote{p.votes.length !== 1 ? "s" : ""}
              </span>
            )}
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-500"}`}
            >
              {STATUS_LABELS[p.status] ?? p.status}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
