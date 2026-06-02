import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

export default async function CreditRequestPage() {
  const session = await auth()
  const memberId = session?.user.memberId
  if (!memberId) redirect("/login" as Route)

  const account = await prisma.account.findUnique({ where: { memberId } })
  if (!account) redirect("/profile" as Route)

  const existing = await prisma.creditLimitRequest.findFirst({
    where: { memberId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    orderBy: { createdAt: "desc" },
  })

  async function submit(formData: FormData) {
    "use server"
    const session = await auth()
    const memberId = session?.user.memberId
    if (!memberId) redirect("/login" as Route)

    const account = await prisma.account.findUniqueOrThrow({ where: { memberId } })

    const reqDebit = parseFloat(formData.get("requestedDebitLimit") as string)
    const reqCredit = parseFloat(formData.get("requestedCreditLimit") as string)
    const rationale = (formData.get("rationale") as string).trim()
    const tradeContext = (formData.get("tradeContext") as string).trim()

    if (isNaN(reqDebit) || isNaN(reqCredit) || !rationale) {
      redirect("/profile/credit-request?error=invalid" as Route)
    }

    await prisma.creditLimitRequest.create({
      data: {
        memberId,
        accountId: account.id,
        requestedDebitLimit: reqDebit,
        requestedCreditLimit: reqCredit,
        rationale,
        tradeContext: tradeContext || null,
        status: "SUBMITTED",
      },
    })

    redirect("/profile?saved=1" as Route)
  }

  const balance = Number(account.balance)
  const currentDebit = Number(account.debitLimit)
  const currentCredit = Number(account.creditLimit)

  return (
    <div className="p-8">
      <div className="mb-2">
        <a href="/profile" className="text-sm text-gray-400 hover:text-gray-600">
          ← Profile
        </a>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Request credit limit change
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          An admin will review your request and respond with a plain-language
          explanation.
        </p>
      </div>

      {existing && (
        <div className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have a pending request already under review. Submit a new one
          only if your situation has changed.
        </div>
      )}

      <div className="max-w-lg">
        {/* Current limits */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Current limits</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400">Balance</p>
              <p className={`font-semibold ${balance < 0 ? "text-red-600" : "text-gray-900"}`}>
                {balance >= 0 ? "+" : ""}{balance.toFixed(2)} CC
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Debit limit</p>
              <p className="font-semibold text-gray-900">{currentDebit.toFixed(0)} CC</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Credit limit</p>
              <p className="font-semibold text-gray-900">+{currentCredit.toFixed(0)} CC</p>
            </div>
          </div>
        </div>

        <form action={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Requested debit limit <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-400">Negative number, e.g. −400</p>
              <input
                type="number"
                name="requestedDebitLimit"
                required
                max="0"
                step="50"
                defaultValue={currentDebit}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Requested credit limit <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-400">Positive number, e.g. 800</p>
              <input
                type="number"
                name="requestedCreditLimit"
                required
                min="0"
                step="50"
                defaultValue={currentCredit}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Why do you need this change? <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-gray-400">
              Include your repayment plan and any new services you plan to offer.
            </p>
            <textarea
              name="rationale"
              required
              rows={4}
              placeholder="I'm launching a new service and expect to bring in 200+ CC/month…"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Trade context (optional)
            </label>
            <p className="text-[11px] text-gray-400">
              Summarise your trading history — who you&apos;ve worked with, what you&apos;ve exchanged.
            </p>
            <textarea
              name="tradeContext"
              rows={3}
              placeholder="In the past 3 months I've done 8 transactions totalling 340 CC…"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Submit request
            </button>
            <a
              href="/profile"
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
