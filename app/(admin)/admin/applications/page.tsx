import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import type { Route } from "next"

async function getApplications() {
  return prisma.membershipApplication.findMany({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    include: { member: true },
    orderBy: { createdAt: "asc" },
  })
}

export default async function ApplicationsPage() {
  const applications = await getApplications()

  async function approve(formData: FormData) {
    "use server"
    const memberId = formData.get("memberId") as string
    const session = await auth()
    const reviewerId = session?.user.memberId ?? null

    await prisma.$transaction(async (tx) => {
      // Approve the member
      await tx.member.update({
        where: { id: memberId },
        data: {
          status: "APPROVED",
          joinedAt: new Date(),
        },
      })

      // Mark application approved
      await tx.membershipApplication.update({
        where: { memberId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: reviewerId,
        },
      })

      // Auto-create ledger account with default limits
      const existingAccount = await tx.account.findUnique({
        where: { memberId },
      })
      if (!existingAccount) {
        await tx.account.create({
          data: {
            memberId,
            balance: 0,
            creditLimit: 500,
            debitLimit: -200,
            status: "ACTIVE",
          },
        })
      }
    })

    redirect("/admin/applications" as Route)
  }

  async function reject(formData: FormData) {
    "use server"
    const memberId = formData.get("memberId") as string
    const note = (formData.get("note") as string)?.trim() || null
    const session = await auth()
    const reviewerId = session?.user.memberId ?? null

    await prisma.$transaction([
      prisma.member.update({
        where: { id: memberId },
        data: { status: "INACTIVE" },
      }),
      prisma.membershipApplication.update({
        where: { memberId },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedById: reviewerId,
          adminNote: note,
        },
      }),
    ])

    redirect("/admin/applications" as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Applications</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {applications.length === 0
              ? "No pending applications"
              : `${applications.length} pending`}
          </p>
        </div>
        <a
          href="/apply"
          target="_blank"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          View application form ↗
        </a>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            No applications awaiting review.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Share{" "}
            <span className="font-mono text-gray-600">
              {process.env.AUTH_URL ?? "your-domain.com"}/apply
            </span>{" "}
            to invite founding members.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Applicant info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {app.member.name}
                    </p>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 uppercase">
                      {app.member.type.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {app.member.email}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Applied{" "}
                    {new Date(app.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {app.referredBy && ` · referred by ${app.referredBy}`}
                  </p>

                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Offers
                      </p>
                      <p className="mt-0.5 text-sm text-gray-700">
                        {app.offerSummary}
                      </p>
                    </div>
                    {app.needsSummary && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Needs
                        </p>
                        <p className="mt-0.5 text-sm text-gray-700">
                          {app.needsSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-col gap-2">
                  <form action={approve}>
                    <input type="hidden" name="memberId" value={app.memberId} />
                    <button
                      type="submit"
                      className="w-24 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={reject}>
                    <input type="hidden" name="memberId" value={app.memberId} />
                    <input
                      type="text"
                      name="note"
                      placeholder="Reason (optional)"
                      className="mb-1.5 w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
