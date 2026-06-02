import { prisma } from "@/lib/db"

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

async function getData(tab: string, category: string) {
  const categoryFilter = category ? { category } : {}

  const [offers, needs] = await Promise.all([
    tab !== "needs"
      ? prisma.offer.findMany({
          where: { status: "PUBLISHED", ...categoryFilter },
          include: { member: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
    tab !== "offers"
      ? prisma.need.findMany({
          where: { status: "PUBLISHED", ...categoryFilter },
          include: { member: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ])

  return { offers, needs }
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string }>
}) {
  const params = await searchParams
  const tab = params.tab ?? "offers"
  const category = params.category ?? ""

  const { offers, needs } = await getData(tab, category)

  const categories = Object.entries(CATEGORY_LABELS)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Marketplace</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Browse what members offer and need
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {(["offers", "needs"] as const).map((t) => (
          <a
            key={t}
            href={`/marketplace?tab=${t}${category ? `&category=${category}` : ""}`}
            className={`-mb-px px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "offers" ? `Offers (${offers.length})` : `Needs (${needs.length})`}
          </a>
        ))}
      </div>

      {/* Category filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <a
          href={`/marketplace?tab=${tab}`}
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
            href={`/marketplace?tab=${tab}&category=${key}`}
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
          <EmptyState message="No offers match this filter." />
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
                    <p className="mt-0.5 text-xs text-gray-500">
                      {o.member.name}
                    </p>
                  </div>
                  <PriceBadge price={Number(o.price)} unit={o.priceUnit} />
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
              </div>
            ))}
          </div>
        )
      ) : needs.length === 0 ? (
        <EmptyState message="No needs match this filter." />
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
              <p className="mt-0.5 text-xs text-gray-500">{n.member.name}</p>
              <p className="mt-2 flex-1 text-sm text-gray-600 leading-relaxed line-clamp-3">
                {n.description}
              </p>
              <div className="mt-3">
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 uppercase">
                  {CATEGORY_LABELS[n.category] ?? n.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PriceBadge({ price, unit }: { price: number; unit: string }) {
  if (unit === "NEGOTIABLE") {
    return (
      <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
        Negotiable
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">
      {price} CC{unit === "CC_PER_HOUR" ? "/hr" : ""}
    </span>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
