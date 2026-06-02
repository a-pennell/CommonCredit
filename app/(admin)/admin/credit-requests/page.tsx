import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

async function getRequests() {
  return prisma.creditLimitRequest.findMany({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    include: {
      member: true,
      account: true,
    },
    orderBy: { createdAt: "asc" },
  })
}

export default async function CreditRequestsPage() {
  const requests = await getRequests()

  async function approve(formData: FormData) {
    "use server"
    const reqId = formData.get("reqId") as string
    const reason = (formData.get("reason") as string).trim() || null

    const req = await prisma.creditLimitRequest.findUniqueOrThrow({
      where: { id: reqId },
    })

    await prisma.$transaction([
      prisma.account.update({
        where: { id: req.accountId },
        data: {
          debitLimit: req.requestedDebitLimit,
          creditLimit: req.requestedCreditLimit,
        },
      }),
      prisma.creditLimitRequest.update({
        where: { id: reqId },
        data: {
          status: "APPROVED",
          decisionReason: reason,
        },
      }),
    ])

    redirect("/admin/credit-requests" as Route)
  }

  async function deny(formData: FormData) {
    "use server"
    const reqId = formData.get("reqId") as string
    const reason = (formData.get("reason") as string).trim() || null

    await prisma.creditLimitRequest.update({
      where: { id: reqId },
      data: {
        status: "DENIED",
        decisionReason: reason,
      },
    })

    redirect("/admin/credit-requests" as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Credit limit requests</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {requests.length === 0 ? "No pending requests" : `${requests.length} pending`}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No pending credit limit requests.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((req) => {
            const balance = Number(req.account.balance)
            const currentDebit = Number(req.account.debitLimit)
            const currentCredit = Number(req.account.creditLimit)
            const reqDebit = Number(req.requestedDebitLimit)
            const reqCredit = Number(req.requestedCreditLimit)

            return (
              <div key={req.id} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{req.member.name}</p>
                    <p className="text-xs text-gray-500">{req.member.email}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Submitted {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                  {/* Limit comparison */}
                  <div className="text-right text-xs">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-gray-400">Balance</p>
                        <p className={`font-medium ${balance < 0 ? "text-red-600" : "text-gray-900"}`}>
                          {balance >= 0 ? "+" : ""}{balance.toFixed(0)} CC
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Debit now → req</p>
                        <p className="font-medium text-gray-900">
                          {currentDebit} → {reqDebit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Credit now → req</p>
                        <p className="font-medium text-gray-900">
                          +{currentCredit} → +{reqCredit}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Rationale</p>
                    <p className="mt-0.5 text-sm text-gray-700">{req.rationale}</p>
                  </div>
                  {req.tradeContext && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Trade context</p>
                      <p className="mt-0.5 text-sm text-gray-700">{req.tradeContext}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <form action={approve}>
                    <input type="hidden" name="reqId" value={req.id} />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="reason"
                        placeholder="Decision note (sent to member)"
                        className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-xs placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                      >
                        Approve
                      </button>
                    </div>
                  </form>
                  <form action={deny}>
                    <input type="hidden" name="reqId" value={req.id} />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="reason"
                        placeholder="Reason for denial"
                        className="w-48 rounded-md border border-gray-300 px-3 py-1.5 text-xs placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Deny
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
