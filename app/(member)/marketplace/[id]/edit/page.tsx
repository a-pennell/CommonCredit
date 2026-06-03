import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import type { Route } from "next"

const CATEGORIES = [
  { value: "wellness", label: "Wellness" },
  { value: "creative", label: "Creative" },
  { value: "food", label: "Food" },
  { value: "repair", label: "Repair" },
  { value: "professional", label: "Professional" },
  { value: "space", label: "Space" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
]

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const { id } = await params
  const { type } = await searchParams
  const isOffer = type !== "need"

  // Fetch the listing and verify ownership
  const offer = isOffer
    ? await prisma.offer.findUnique({ where: { id } })
    : null
  const need = !isOffer
    ? await prisma.need.findUnique({ where: { id } })
    : null

  if (isOffer && (!offer || offer.memberId !== memberId)) notFound()
  if (!isOffer && (!need || need.memberId !== memberId)) notFound()

  async function saveOffer(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const title = (formData.get("title") as string).trim()
    const category = formData.get("category") as string
    const description = (formData.get("description") as string).trim()
    const priceUnit = formData.get("priceUnit") as string
    const price =
      priceUnit === "NEGOTIABLE"
        ? 0
        : parseFloat((formData.get("price") as string) || "0")
    const availability = (formData.get("availability") as string).trim()
    const serviceArea = (formData.get("serviceArea") as string).trim()

    if (!title || !category || !description) {
      redirect(`/marketplace/${id}/edit?type=offer` as Route)
    }

    const existing = await prisma.offer.findUnique({ where: { id } })
    if (existing?.memberId !== memberId) redirect("/marketplace" as Route)

    await prisma.offer.update({
      where: { id },
      data: {
        title,
        category,
        description,
        price,
        priceUnit,
        availability: availability || null,
        serviceArea: serviceArea || null,
      },
    })

    redirect("/marketplace?view=mine" as Route)
  }

  async function saveNeed(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const title = (formData.get("title") as string).trim()
    const category = formData.get("category") as string
    const description = (formData.get("description") as string).trim()
    const urgency = (formData.get("urgency") as string) || "NORMAL"

    if (!title || !category || !description) {
      redirect(`/marketplace/${id}/edit?type=need` as Route)
    }

    const existing = await prisma.need.findUnique({ where: { id } })
    if (existing?.memberId !== memberId) redirect("/marketplace" as Route)

    await prisma.need.update({
      where: { id },
      data: { title, category, description, urgency },
    })

    redirect("/marketplace?view=mine" as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-2">
        <a
          href="/marketplace?view=mine"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← My listings
        </a>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Edit {isOffer ? "offer" : "need"}
        </h1>
      </div>

      <div className="max-w-lg">
        {isOffer && offer ? (
          <form action={saveOffer} className="space-y-5">
            <Field
              label="Title"
              name="title"
              required
              defaultValue={offer.title}
            />
            <CategorySelect
              categories={CATEGORIES}
              defaultValue={offer.category}
            />
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={3}
                defaultValue={offer.description}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Price unit
                </label>
                <select
                  name="priceUnit"
                  defaultValue={offer.priceUnit}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="CC">Fixed (CC)</option>
                  <option value="CC_PER_HOUR">Per hour (CC/hr)</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                </select>
              </div>
              <Field
                label="Amount"
                name="price"
                type="number"
                defaultValue={Number(offer.price).toString()}
              />
            </div>
            <Field
              label="Availability"
              name="availability"
              defaultValue={offer.availability ?? ""}
            />
            <Field
              label="Service area"
              name="serviceArea"
              defaultValue={offer.serviceArea ?? ""}
            />
            <Actions />
          </form>
        ) : need ? (
          <form action={saveNeed} className="space-y-5">
            <Field
              label="Title"
              name="title"
              required
              defaultValue={need.title}
            />
            <CategorySelect
              categories={CATEGORIES}
              defaultValue={need.category}
            />
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={3}
                defaultValue={need.description}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Urgency
              </label>
              <select
                name="urgency"
                defaultValue={need.urgency}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              >
                <option value="LOW">Low — nice to have</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High — actively looking</option>
                <option value="URGENT">Urgent — needed soon</option>
              </select>
            </div>
            <Actions />
          </form>
        ) : null}
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
    </div>
  )
}

function CategorySelect({
  categories,
  defaultValue,
}: {
  categories: typeof CATEGORIES
  defaultValue?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">
        Category <span className="text-red-500">*</span>
      </label>
      <select
        name="category"
        required
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      >
        <option value="">Select…</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Actions() {
  return (
    <div className="flex gap-3 pt-1">
      <button
        type="submit"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        Save changes
      </button>
      <a
        href="/marketplace?view=mine"
        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        Cancel
      </a>
    </div>
  )
}
