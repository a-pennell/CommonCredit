import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import type { Route } from "next"

async function getMember(id: string) {
  return prisma.member.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      offers: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } },
      needs: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } },
      endorsementsReceived: {
        where: { revokedAt: null },
        include: { fromMember: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      reputationReceived: {
        orderBy: { createdAt: "desc" },
        include: { fromMember: { select: { name: true } } },
      },
    },
  })
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const viewerId = session?.user.memberId
  if (!viewerId) redirect("/login" as Route)

  const member = await getMember(id)
  if (!member) notFound()

  const isSelf = viewerId === id

  const scores = member.reputationReceived.map((r) => r.score)
  const avgScore =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null

  // Check if viewer already endorsed this member
  const existingEndorsement = isSelf
    ? null
    : await prisma.endorsement.findUnique({
        where: {
          fromMemberId_toMemberId: { fromMemberId: viewerId, toMemberId: id },
        },
      })

  async function writeEndorsement(formData: FormData) {
    "use server"
    const session = await auth()
    const fromMemberId = session?.user.memberId
    if (!fromMemberId || fromMemberId === id) redirect(`/members/${id}` as Route)

    const body = (formData.get("body") as string).trim()
    if (!body) redirect(`/members/${id}` as Route)

    await prisma.endorsement.upsert({
      where: { fromMemberId_toMemberId: { fromMemberId, toMemberId: id } },
      create: { fromMemberId, toMemberId: id, body },
      update: { body, revokedAt: null },
    })

    redirect(`/members/${id}?endorsed=1` as Route)
  }

  async function revokeEndorsement() {
    "use server"
    const session = await auth()
    const fromMemberId = session?.user.memberId
    if (!fromMemberId) redirect(`/members/${id}` as Route)

    await prisma.endorsement.updateMany({
      where: { fromMemberId, toMemberId: id },
      data: { revokedAt: new Date() },
    })

    redirect(`/members/${id}` as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-2">
        <a href="/members" className="text-sm text-gray-400 hover:text-gray-600">
          ← Members
        </a>
      </div>

      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{member.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500 capitalize">
              {member.type.toLowerCase()}
              {member.location ? ` · ${member.location}` : ""}
              {member.joinedAt
                ? ` · Member since ${new Date(member.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                : ""}
            </p>
          </div>
          {avgScore !== null && (
            <div className="text-right">
              <p className="text-2xl font-semibold text-amber-600">
                ★ {avgScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">
                {scores.length} rating{scores.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {member.bio && (
          <p className="mb-6 text-sm text-gray-700 leading-relaxed">{member.bio}</p>
        )}

        {member.website && (
          <a
            href={member.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 block text-sm text-blue-600 hover:underline"
          >
            {member.website}
          </a>
        )}

        {/* CTA buttons (for other members) */}
        {!isSelf && (
          <div className="mb-6 flex gap-3">
            <a
              href={`/pay?to=${member.id}`}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Send credits
            </a>
            <a
              href={`/invoices/new`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Create invoice
            </a>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Offers */}
          {member.offers.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                Offers
              </h2>
              <div className="space-y-2">
                {member.offers.map((o) => (
                  <div key={o.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{o.title}</p>
                      <span className="shrink-0 rounded bg-gray-900 px-1.5 py-0.5 text-[11px] font-medium text-white">
                        {Number(o.price) > 0
                          ? `${Number(o.price)} CC${o.priceUnit === "CC_PER_HOUR" ? "/hr" : ""}`
                          : "Negotiable"}
                      </span>
                    </div>
                    {o.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {o.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Needs */}
          {member.needs.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                Looking for
              </h2>
              <div className="space-y-2">
                {member.needs.map((n) => (
                  <div key={n.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    {n.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {n.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Endorsements */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
            Endorsements ({member.endorsementsReceived.length})
          </h2>

          {member.endorsementsReceived.length > 0 ? (
            <div className="space-y-3">
              {member.endorsementsReceived.map((e) => (
                <div key={e.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-700">&ldquo;{e.body}&rdquo;</p>
                  <p className="mt-1.5 text-xs text-gray-400">
                    — {e.fromMember.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No endorsements yet.</p>
          )}

          {/* Write / revoke endorsement */}
          {!isSelf && (
            <div className="mt-5">
              {existingEndorsement && !existingEndorsement.revokedAt ? (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-2">
                    Your endorsement: &ldquo;{existingEndorsement.body}&rdquo;
                  </p>
                  <form action={revokeEndorsement}>
                    <button type="submit" className="text-xs text-gray-400 hover:text-red-600 underline">
                      Revoke endorsement
                    </button>
                  </form>
                </div>
              ) : (
                <form action={writeEndorsement} className="space-y-3">
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder={`Write an endorsement for ${member.name}…`}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    Endorse {member.name}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* Ratings */}
        {member.reputationReceived.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
              Ratings
            </h2>
            <div className="space-y-2">
              {member.reputationReceived.map((r) => (
                <div key={r.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <span className="shrink-0 rounded bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-700">
                    {r.score}/5
                  </span>
                  <div>
                    {r.comment && (
                      <p className="text-sm text-gray-700">{r.comment}</p>
                    )}
                    <p className="text-xs text-gray-400">— {r.fromMember.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
