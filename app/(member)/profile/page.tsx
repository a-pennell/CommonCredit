import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

const TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individual",
  BUSINESS: "Business",
  COOPERATIVE: "Cooperative",
  NONPROFIT: "Nonprofit",
  ANCHOR: "Anchor institution",
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const params = await searchParams

  const member = await prisma.member.findUniqueOrThrow({
    where: { id: memberId },
    include: {
      account: {
        select: { balance: true, creditLimit: true, debitLimit: true },
      },
    },
  })

  async function saveProfile(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    await prisma.member.update({
      where: { id: memberId },
      data: {
        bio: (formData.get("bio") as string).trim() || null,
        location: (formData.get("location") as string).trim() || null,
        website: (formData.get("website") as string).trim() || null,
      },
    })

    redirect("/profile?saved=1" as Route)
  }

  const balance = member.account ? Number(member.account.balance) : null
  const creditLimit = member.account
    ? Number(member.account.creditLimit)
    : null
  const debitLimit = member.account ? Number(member.account.debitLimit) : null

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Profile</h1>

      <div className="max-w-lg space-y-6">
        {/* Identity card — read-only */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Identity
          </p>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={member.displayName} />
            <Row label="Email" value={member.email} />
            <Row
              label="Member type"
              value={TYPE_LABELS[member.type] ?? member.type}
            />
            <Row
              label="Joined"
              value={
                member.joinedAt
                  ? new Date(member.joinedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"
              }
            />
          </dl>
        </div>

        {/* Account */}
        {balance !== null && (
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Account
              </p>
              <a
                href="/profile/credit-request"
                className="text-xs text-gray-500 hover:text-gray-800 hover:underline"
              >
                Request limit change →
              </a>
            </div>
            <dl className="space-y-2 text-sm">
              <Row
                label="Balance"
                value={`${balance >= 0 ? "+" : ""}${balance.toFixed(2)} CC`}
                valueClass={balance < 0 ? "text-red-600 font-medium" : "font-medium"}
              />
              <Row label="Credit limit" value={`+${creditLimit?.toFixed(0)} CC`} />
              <Row label="Debit limit" value={`${debitLimit?.toFixed(0)} CC`} />
            </dl>
          </div>
        )}

        {/* Editable fields */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Public profile
          </p>

          {params.saved && (
            <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
              Profile saved.
            </p>
          )}

          <form action={saveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Bio
              </label>
              <textarea
                name="bio"
                rows={3}
                defaultValue={member.bio ?? ""}
                placeholder="Tell the network about yourself and what you do."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location"
                defaultValue={member.location ?? ""}
                placeholder="e.g. Oakland, CA"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                name="website"
                defaultValue={member.website ?? ""}
                placeholder="https://…"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Save changes
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  valueClass = "text-gray-900",
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right ${valueClass}`}>{value}</dd>
    </div>
  )
}
