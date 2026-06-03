import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import type { Route } from "next"

async function getProposal(id: string) {
  return prisma.proposal.findUnique({
    where: { id },
    include: {
      proposer: { select: { id: true, name: true } },
      votes: {
        include: { voter: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const memberId = session?.user.memberId
  const isAdmin = session?.user.role === "admin"
  if (!memberId && !isAdmin) redirect("/login" as Route)

  const proposal = await getProposal(id)
  if (!proposal) notFound()

  const myVote = memberId
    ? proposal.votes.find((v) => v.voterId === memberId)
    : null
  const canVote =
    !!memberId && proposal.status === "VOTING" && !myVote

  // Tally
  const yes = proposal.votes.filter((v) => v.choice === "YES").length
  const no = proposal.votes.filter((v) => v.choice === "NO").length
  const abstain = proposal.votes.filter((v) => v.choice === "ABSTAIN").length
  const total = proposal.votes.length
  const decisive = yes + no // abstains don't count for pass %
  const yesPercent = decisive > 0 ? Math.round((yes / decisive) * 100) : 0

  // ── Server actions ──────────────────────────────────────────────────────

  async function castVote(formData: FormData) {
    "use server"
    const session = await auth()
    const voterId = session?.user.memberId
    if (!voterId) redirect("/login" as Route)

    const choice = formData.get("choice") as "YES" | "NO" | "ABSTAIN"
    if (!["YES", "NO", "ABSTAIN"].includes(choice)) {
      redirect(`/proposals/${id}` as Route)
    }

    const prop = await prisma.proposal.findUniqueOrThrow({ where: { id } })
    if (prop.status !== "VOTING") redirect(`/proposals/${id}` as Route)

    await prisma.vote.upsert({
      where: { proposalId_voterId: { proposalId: id, voterId } },
      create: { proposalId: id, voterId, choice },
      update: { choice },
    })

    redirect(`/proposals/${id}` as Route)
  }

  async function advanceStatus(formData: FormData) {
    "use server"
    const session = await auth()
    if (session?.user.role !== "admin") redirect(`/proposals/${id}` as Route)

    const next = formData.get("next") as string
    const commentDays = parseInt(
      (formData.get("commentDays") as string) || "7",
    )
    const votingDays = parseInt(
      (formData.get("votingDays") as string) || "14",
    )

    const data: Record<string, unknown> = { status: next }

    if (next === "COMMENT_PERIOD") {
      data.commentDeadline = new Date(
        Date.now() + commentDays * 24 * 60 * 60 * 1000,
      )
    }
    if (next === "VOTING") {
      data.votingDeadline = new Date(
        Date.now() + votingDays * 24 * 60 * 60 * 1000,
      )
    }

    await prisma.proposal.update({ where: { id }, data })
    redirect(`/proposals/${id}` as Route)
  }

  async function closeVoting() {
    "use server"
    const session = await auth()
    if (session?.user.role !== "admin") redirect(`/proposals/${id}` as Route)

    const prop = await prisma.proposal.findUniqueOrThrow({
      where: { id },
      include: { votes: true },
    })

    if (prop.status !== "VOTING") redirect(`/proposals/${id}` as Route)

    const totalMembers = await prisma.member.count({
      where: { status: "APPROVED" },
    })
    const yes = prop.votes.filter((v) => v.choice === "YES").length
    const no = prop.votes.filter((v) => v.choice === "NO").length
    const abstain = prop.votes.filter((v) => v.choice === "ABSTAIN").length
    const total = prop.votes.length
    const decisive = yes + no
    const quorumMet =
      totalMembers > 0
        ? (total / totalMembers) * 100 >= prop.quorumPercent
        : false
    const passMet =
      decisive > 0 ? (yes / decisive) * 100 >= prop.passPercent : false
    const enacted = quorumMet && passMet

    await prisma.proposal.update({
      where: { id },
      data: {
        status: enacted ? "ENACTED" : "FAILED",
        totalVotes: total,
        yesVotes: yes,
        noVotes: no,
        abstainVotes: abstain,
      },
    })

    redirect(`/proposals/${id}` as Route)
  }

  const nextStatusMap: Record<string, string> = {
    DRAFT: "COMMENT_PERIOD",
    COMMENT_PERIOD: "VOTING",
  }
  const nextStatus = nextStatusMap[proposal.status]

  return (
    <div className="p-8">
      <div className="mb-2">
        <a
          href="/proposals"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Proposals
        </a>
      </div>

      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {proposal.title}
            </h1>
            <StatusBadge status={proposal.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Proposed by {proposal.proposer.name} ·{" "}
            {new Date(proposal.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {proposal.status === "VOTING" && proposal.votingDeadline && (
            <p className="mt-0.5 text-sm text-amber-700">
              Voting closes{" "}
              {new Date(proposal.votingDeadline).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="space-y-3">
            {proposal.body.split("\n\n").map((para, i) => (
              <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Vote tally */}
        {total > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Vote tally — {total} vote{total !== 1 ? "s" : ""}
            </p>
            <div className="mb-3 flex gap-6 text-sm">
              <span className="text-green-700 font-medium">
                YES {yes} ({yesPercent}%)
              </span>
              <span className="text-red-600">NO {no}</span>
              <span className="text-gray-400">ABSTAIN {abstain}</span>
            </div>
            {/* Progress bar */}
            {decisive > 0 && (
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-600 transition-all"
                  style={{ width: `${yesPercent}%` }}
                />
              </div>
            )}
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>
                Pass threshold: {proposal.passPercent}% YES of decisive votes
              </span>
              <span>Quorum: {proposal.quorumPercent}% of members</span>
            </div>
            {(proposal.status === "ENACTED" ||
              proposal.status === "FAILED") && (
              <div
                className={`mt-3 rounded-md px-3 py-2 text-sm font-medium ${
                  proposal.status === "ENACTED"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {proposal.status === "ENACTED"
                  ? "✓ Enacted — quorum met and threshold reached"
                  : "✗ Failed — quorum or threshold not met"}
              </div>
            )}
          </div>
        )}

        {/* Vote form */}
        {canVote && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
            <p className="mb-3 text-sm font-medium text-gray-900">
              Cast your vote
            </p>
            <form action={castVote} className="flex gap-3">
              {(["YES", "NO", "ABSTAIN"] as const).map((choice) => (
                <button
                  key={choice}
                  type="submit"
                  name="choice"
                  value={choice}
                  className={`rounded-md border px-5 py-2 text-sm font-medium transition-colors ${
                    choice === "YES"
                      ? "border-green-300 text-green-700 hover:bg-green-50"
                      : choice === "NO"
                        ? "border-red-300 text-red-600 hover:bg-red-50"
                        : "border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {choice}
                </button>
              ))}
            </form>
          </div>
        )}

        {myVote && (
          <div className="mb-6 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-600">
            You voted <span className="font-medium">{myVote.choice}</span>.
            {proposal.status === "VOTING" && (
              <form action={castVote} className="mt-2 flex gap-2">
                <p className="text-xs text-gray-400">Change vote:</p>
                {(["YES", "NO", "ABSTAIN"] as const)
                  .filter((c) => c !== myVote.choice)
                  .map((choice) => (
                    <button
                      key={choice}
                      type="submit"
                      name="choice"
                      value={choice}
                      className="text-xs text-gray-500 underline hover:text-gray-800"
                    >
                      {choice}
                    </button>
                  ))}
              </form>
            )}
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-amber-700">
              Admin controls
            </p>
            <div className="flex flex-wrap gap-3">
              {nextStatus && (
                <form action={advanceStatus} className="flex items-center gap-2">
                  <input type="hidden" name="next" value={nextStatus} />
                  {nextStatus === "COMMENT_PERIOD" && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        name="commentDays"
                        defaultValue={7}
                        min={1}
                        max={30}
                        className="w-14 rounded border border-amber-200 px-2 py-1 text-xs"
                      />
                      <span className="text-xs text-amber-700">days comment</span>
                    </div>
                  )}
                  {nextStatus === "VOTING" && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        name="votingDays"
                        defaultValue={14}
                        min={1}
                        max={30}
                        className="w-14 rounded border border-amber-200 px-2 py-1 text-xs"
                      />
                      <span className="text-xs text-amber-700">days voting</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800"
                  >
                    Advance to {nextStatus.replace(/_/g, " ").toLowerCase()}
                  </button>
                </form>
              )}
              {proposal.status === "VOTING" && (
                <form action={closeVoting}>
                  <button
                    type="submit"
                    className="rounded-md border border-amber-300 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100"
                  >
                    Close voting now &amp; tally
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-500",
    COMMENT_PERIOD: "bg-blue-50 text-blue-700",
    VOTING: "bg-amber-50 text-amber-700",
    ENACTED: "bg-green-100 text-green-800",
    FAILED: "bg-red-50 text-red-500",
    ARCHIVED: "bg-gray-100 text-gray-400",
  }
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    COMMENT_PERIOD: "Comment period",
    VOTING: "Voting open",
    ENACTED: "Enacted",
    FAILED: "Failed",
    ARCHIVED: "Archived",
  }
  return (
    <span
      className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {labels[status] ?? status}
    </span>
  )
}
