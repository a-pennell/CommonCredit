import { prisma } from "@/lib/db"

async function getMembers() {
  const members = await prisma.member.findMany({
    where: { status: "APPROVED" },
    include: {
      account: { select: { balance: true } },
      offers: {
        where: { status: "PUBLISHED" },
        select: { title: true, price: true, priceUnit: true, category: true },
        take: 3,
      },
      endorsementsReceived: {
        where: { revokedAt: null },
        select: { id: true },
      },
      reputationReceived: {
        select: { score: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  return members.map((m) => {
    const scores = m.reputationReceived.map((r) => r.score)
    const avgScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null
    return { ...m, avgScore, endorsementCount: m.endorsementsReceived.length }
  })
}

export default async function MembersPage() {
  const members = await getMembers()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Members</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {members.length} active member{members.length !== 1 ? "s" : ""} in
          the network
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <a
            key={m.id}
            href={`/members/${m.id}`}
            className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {/* Header */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {m.type.toLowerCase()}
                  {m.location ? ` · ${m.location}` : ""}
                </p>
              </div>
              {m.avgScore !== null && (
                <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                  ★ {m.avgScore.toFixed(1)}
                </span>
              )}
            </div>

            {/* Bio */}
            {m.bio && (
              <p className="mb-3 line-clamp-2 text-xs text-gray-500">{m.bio}</p>
            )}

            {/* Top offers */}
            {m.offers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {m.offers.map((o, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    {o.title}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto flex items-center gap-3 text-[11px] text-gray-400">
              {m.endorsementCount > 0 && (
                <span>{m.endorsementCount} endorsement{m.endorsementCount !== 1 ? "s" : ""}</span>
              )}
              <span className="ml-auto">View profile →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
