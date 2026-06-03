import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
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

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const params = await searchParams
  const type = params.type === "need" ? "need" : "offer"

  async function createOffer(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const title = (formData.get("title") as string).trim()
    const category = formData.get("category") as string
    const description = (formData.get("description") as string).trim()
    const priceRaw = formData.get("price") as string
    const priceUnit = formData.get("priceUnit") as string
    const availability = (formData.get("availability") as string).trim()
    const serviceArea = (formData.get("serviceArea") as string).trim()

    if (!title || !category || !description) {
      redirect("/marketplace/new?type=offer&error=missing" as Route)
    }

    const price =
      priceUnit === "NEGOTIABLE" ? 0 : parseFloat(priceRaw || "0")

    await prisma.offer.create({
      data: {
        memberId,
        title,
        category,
        description,
        price,
        priceUnit: priceUnit || "CC",
        availability: availability || null,
        serviceArea: serviceArea || null,
        status: "PUBLISHED",
      },
    })

    redirect("/marketplace?view=mine" as Route)
  }

  async function createNeed(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const title = (formData.get("title") as string).trim()
    const category = formData.get("category") as string
    const description = (formData.get("description") as string).trim()
    const urgency = (formData.get("urgency") as string) || "NORMAL"

    if (!title || !category || !description) {
      redirect("/marketplace/new?type=need&error=missing" as Route)
    }

    await prisma.need.create({
      data: {
        memberId,
        title,
        category,
        description,
        urgency,
        status: "PUBLISHED",
      },
    })

    redirect("/marketplace?view=mine" as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-2">
        <a
          href="/marketplace"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Marketplace
        </a>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New listing</h1>
      </div>

      {/* Type switcher */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {[
          { t: "offer", label: "I'm offering something" },
          { t: "need", label: "I need something" },
        ].map(({ t, label }) => (
          <a
            key={t}
            href={`/marketplace/new?type=${t}`}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              type === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="max-w-lg">
        {type === "offer" ? (
          <form action={createOffer} className="space-y-5">
            <OfferFields categories={CATEGORIES} />
            <Actions backHref="/marketplace" submitLabel="Publish offer" />
          </form>
        ) : (
          <form action={createNeed} className="space-y-5">
            <NeedFields categories={CATEGORIES} />
            <Actions backHref="/marketplace" submitLabel="Publish need" />
          </form>
        )}
      </div>
    </div>
  )
}

function OfferFields({
  categories,
  defaults,
}: {
  categories: typeof CATEGORIES
  defaults?: Record<string, string>
}) {
  return (
    <>
      <Field
        label="Title"
        name="title"
        placeholder="e.g. Acupuncture session (60 min)"
        required
        defaultValue={defaults?.title}
      />
      <CategorySelect categories={categories} defaultValue={defaults?.category} />
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={defaults?.description}
          placeholder="Describe what you're offering, what's included, and any requirements."
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Price unit
          </label>
          <select
            name="priceUnit"
            defaultValue={defaults?.priceUnit ?? "CC"}
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
          placeholder="0"
          defaultValue={defaults?.price}
        />
      </div>
      <Field
        label="Availability"
        name="availability"
        placeholder="e.g. Weekday mornings, or by arrangement"
        defaultValue={defaults?.availability}
      />
      <Field
        label="Service area"
        name="serviceArea"
        placeholder="e.g. Oakland and East Bay"
        defaultValue={defaults?.serviceArea}
      />
    </>
  )
}

function NeedFields({
  categories,
  defaults,
}: {
  categories: typeof CATEGORIES
  defaults?: Record<string, string>
}) {
  return (
    <>
      <Field
        label="Title"
        name="title"
        placeholder="e.g. Weekly veggie box"
        required
        defaultValue={defaults?.title}
      />
      <CategorySelect categories={categories} defaultValue={defaults?.category} />
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={defaults?.description}
          placeholder="Describe what you need, how often, and any specifics."
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">
          Urgency
        </label>
        <select
          name="urgency"
          defaultValue={defaults?.urgency ?? "NORMAL"}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        >
          <option value="LOW">Low — nice to have</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High — actively looking</option>
          <option value="URGENT">Urgent — needed soon</option>
        </select>
      </div>
    </>
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

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
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
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
    </div>
  )
}

function Actions({
  backHref,
  submitLabel,
}: {
  backHref: string
  submitLabel: string
}) {
  return (
    <div className="flex gap-3 pt-1">
      <button
        type="submit"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        {submitLabel}
      </button>
      <a
        href={backHref}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        Cancel
      </a>
    </div>
  )
}
