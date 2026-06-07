import { requireMemberSession } from "@/lib/session"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

const CATEGORY_LABELS: Record<string, string> = {
  wellness: "Wellness",
  creative: "Creative",
  food: "Food",
  repair: "Repair",
  professional: "Professional",
  space: "Space",
  transport: "Transport",
  other: "Other",
}

async function getData(tab: string, category: string, memberId: string, orgId: string) {
  const categoryFilter = category ? { category } : {}
  const [offers, needs, myOffers, myNeeds] = await Promise.all([
    tab !== "needs"
      ? prisma.offer.findMany({
          where: { orgId, status: "PUBLISHED", ...categoryFilter },
          include: { member: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
    tab !== "offers"
      ? prisma.need.findMany({
          where: { orgId, status: "PUBLISHED", ...categoryFilter },
          include: { member: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
    // My listings — always scoped to the member (which is already org-scoped)
    prisma.offer.findMany({
      where: { memberId, status: { in: ["PUBLISHED", "DRAFT"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.need.findMany({
      where: { memberId, status: { in: ["PUBLISHED", "DRAFT"] } },
      orderBy: { createdAt: "desc" },
    }),
  ])
  return { offers, needs, myOffers, myNeeds }
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string; view?: string }>
}) {
  const { memberId, orgId } = await requireMemberSession()
  const params = await searchParams
  const tab = params.tab ?? "offers"
  const category = params.category ?? ""
  const view = params.view ?? "browse"

  const { offers, needs, myOffers, myNeeds } = await getData(
    tab,
    category,
    memberId,
    orgId,
  )

  async function unpublishOffer(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) return
    const id = formData.get("id") as string
    const offer = await prisma.offer.findUnique({ where: { id } })
    if (offer?.memberId !== memberId) return
    await prisma.offer.update({
      where: { id },
      data: { status: offer.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED" },
    })
    redirect("/marketplace?view=mine" as Route)
  }

  async function unpublishNeed(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) return
    const id = formData.get("id") as string
    const need = await prisma.need.findUnique({ where: { id } })
    if (need?.memberId !== memberId) return
    await prisma.need.update({
      where: { id },
      data: { status: need.status === "PUBLISHED" ? "WITHDRAWN" : "PUBLISHED" },
    })
    redirect("/marketplace?view=mine" as Route)
  }

  const categories = Object.entries(CATEGORY_LABELS)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Marketplace</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Browse what members offer and need
          </p>
        </div>
        <a
          href="/marketplace/new"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
        >
          + New listing
        </a>
      </div>

      {/* View switcher */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {[
          { v: "browse", label: "Browse" },
          { v: "mine", label: "My listings" },
        ].map(({ v, label }) => (
          <a
            key={v}
            href={`/marketplace?view=${v}`}
            className={`-mb-px px-4 py-2 text-sm font-medium transition-colors ${
              view === v
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            {v === "mine" && myOffers.length + myNeeds.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                {myOffers.length + myNeeds.length}
              </span>
            )}
          </a>
        ))}
      </div>

      {view === "mine" ? (
        /* ── My listings ── */
        <div className="space-y-6">
          <MyListings
            title="My offers"
            items={myOffers.map((o) => ({
              id: o.id,
              title: o.title,
              category: o.category,
              status: o.status,
              price: `${Number(o.price) > 0 ? `${Number(o.price)} CC${o.priceUnit === "CC_PER_HOUR" ? "/hr" : ""}` : "Negotiable"}`,
              editHref: `/marketplace/${o.id}/edit?type=offer`,
              type: "offer" as const,
            }))}
            unpublish={unpublishOffer}
          />
          <MyListings
            title="My needs"
            items={myNeeds.map((n) => ({
              id: n.id,
              title: n.title,
              category: n.category,
              status: n.status,
              editHref: `/marketplace/${n.id}/edit?type=need`,
              type: "need" as const,
            }))}
            unpublish={unpublishNeed}
          />
        </div>
      ) : (
        /* ── Browse ── */
        <>
          {/* Tabs */}
          <div className="mb-5 flex gap-1 border-b border-gray-200">
            {(["offers", "needs"] as const).map((t) => (
              <a
                key={t}
                href={`/marketplace?view=browse&tab=${t}${category ? `&category=${category}` : ""}`}
                className={`-mb-px px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "offers"
                  ? `Offers (${offers.length})`
                  : `Needs (${needs.length})`}
              </a>
            ))}
          </div>

          {/* Category filter */}
          <div className="mb-5 flex flex-wrap gap-2">
            <a
              href={`/marketplace?view=browse&tab=${tab}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !category
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </a>
            {categories.map(([key, label]) => (
              <a
                key={key}
                href={`/marketplace?view=browse&tab=${tab}&category=${key}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  category === key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Cards */}
          {tab === "offers" ? (
            offers.length === 0 ? (
              <EmptyBrowse />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {offers.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-col rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 leading-snug">
                          {o.title}
                        </p>
                        <a
                          href={`/members/${o.member.id}`}
                          className="mt-0.5 block text-xs text-gray-500 hover:underline"
                        >
                          {o.member.displayName}
                        </a>
                      </div>
                      <PriceBadge
                        price={Number(o.price)}
                        unit={o.priceUnit}
                      />
                    </div>
                    <p className="mt-2 flex-1 text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {o.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 uppercase">
                        {CATEGORY_LABELS[o.category] ?? o.category}
                      </span>
                      {o.availability && (
                        <span className="text-[11px] text-gray-400">
                          {o.availability}
                        </span>
                      )}
                    </div>
                    {o.member.id !== memberId && (
                      <a
                        href={`/pay?to=${o.member.id}`}
                        className="mt-3 rounded-md border border-gray-200 px-3 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Contact / send credits
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : needs.length === 0 ? (
            <EmptyBrowse />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {needs.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col rounded-lg border border-gray-200 bg-white p-4"
                >
                  <p className="font-medium text-gray-900 leading-snug">
                    {n.title}
                  </p>
                  <a
                    href={`/members/${n.member.id}`}
                    className="mt-0.5 block text-xs text-gray-500 hover:underline"
                  >
                    {n.member.displayName}
                  </a>
                  <p className="mt-2 flex-1 text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {n.description}
                  </p>
                  <div className="mt-3">
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 uppercase">
                      {CATEGORY_LABELS[n.category] ?? n.category}
                    </span>
                  </div>
                  {n.member.id !== memberId && (
                    <a
                      href={`/pay?to=${n.member.id}`}
                      className="mt-3 rounded-md border border-gray-200 px-3 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      I can help →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MyListings({
  title,
  items,
  unpublish,
}: {
  title: string
  items: Array<{
    id: string
    title: string
    category: string
    status: string
    price?: string
    editHref: string
    type: "offer" | "need"
  }>
  unpublish: (formData: FormData) => Promise<void>
}) {
  if (items.length === 0) {
    return (
      <div>
        <p className="mb-2 text-sm font-medium text-gray-500">{title}</p>
        <p className="text-sm text-gray-400">None yet.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-500">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-400 capitalize">
                {CATEGORY_LABELS[item.category] ?? item.category}
                {item.price && ` · ${item.price}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  item.status === "PUBLISHED"
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {item.status === "PUBLISHED" ? "Live" : "Draft"}
              </span>
              <a
                href={item.editHref}
                className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                Edit
              </a>
              <form action={unpublish}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                >
                  {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PriceBadge({ price, unit }: { price: number; unit: string }) {
  if (unit === "NEGOTIABLE" || price === 0)
    return (
      <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
        Negotiable
      </span>
    )
  return (
    <span className="shrink-0 rounded bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">
      {price} CC{unit === "CC_PER_HOUR" ? "/hr" : ""}
    </span>
  )
}

function EmptyBrowse() {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
      <p className="text-sm text-gray-500">Nothing here yet.</p>
      <a
        href="/marketplace/new"
        className="mt-3 inline-block text-xs text-gray-500 hover:underline"
      >
        + Add the first listing
      </a>
    </div>
  )
}
