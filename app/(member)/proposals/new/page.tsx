import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

export default async function NewProposalPage() {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  async function create(formData: FormData) {
    "use server"
    const session = await auth()
    const proposerId = session?.user.memberId
    if (!proposerId) redirect("/login" as Route)

    const title = (formData.get("title") as string).trim()
    const body = (formData.get("body") as string).trim()
    const quorumPercent = parseInt(
      (formData.get("quorumPercent") as string) || "30",
    )
    const passPercent = parseInt(
      (formData.get("passPercent") as string) || "60",
    )

    if (!title || !body) redirect("/proposals/new?error=missing" as Route)

    const proposal = await prisma.proposal.create({
      data: {
        proposerId,
        title,
        body,
        status: "DRAFT",
        quorumPercent,
        passPercent,
      },
    })

    redirect(`/proposals/${proposal.id}` as Route)
  }

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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New proposal</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Proposals start as drafts. An admin advances them to comment period
          and then to a vote.
        </p>
      </div>

      <div className="max-w-2xl">
        <form action={create} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Increase default debit limit from 200 to 300 CC"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Body <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-gray-400">
              State the problem, your proposed change, and the rationale.
            </p>
            <textarea
              name="body"
              required
              rows={10}
              placeholder={`## Problem\n\n## Proposed change\n\n## Rationale\n\n## Risks`}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Quorum %
              </label>
              <p className="text-[11px] text-gray-400">
                Min % of active members who must vote
              </p>
              <input
                type="number"
                name="quorumPercent"
                min="10"
                max="80"
                defaultValue={30}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Pass threshold %
              </label>
              <p className="text-[11px] text-gray-400">
                % of YES votes (excluding abstain) needed to pass
              </p>
              <input
                type="number"
                name="passPercent"
                min="51"
                max="100"
                defaultValue={60}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Save draft
            </button>
            <a
              href="/proposals"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
