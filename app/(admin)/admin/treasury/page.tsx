/**
 * Network Treasury — admin view.
 *
 * The Treasury is a singleton created on first visit. It holds the network's
 * shared credit and cash reserves, funded through governance-approved
 * allocations from enacted proposals.
 */
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import type { Route } from "next"

async function getTreasury() {
  // Upsert: create a singleton treasury on first admin visit
  return prisma.treasury.upsert({
    where: { id: "network" },
    create: { id: "network", name: "Network Treasury" },
    update: {},
    include: {
      allocations: {
        include: { proposal: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

async function getEnactedProposals() {
  // Proposals that passed but don't have an allocation yet
  const allocated = await prisma.treasuryAllocation.findMany({
    select: { proposalId: true },
  })
  const allocatedIds = allocated.map((a) => a.proposalId)

  return prisma.proposal.findMany({
    where: {
      status: "ENACTED",
      id: { notIn: allocatedIds.length > 0 ? allocatedIds : ["__none__"] },
    },
    orderBy: { createdAt: "desc" },
  })
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-400",
}

export default async function TreasuryPage() {
  const [treasury, enactedProposals] = await Promise.all([
    getTreasury(),
    getEnactedProposals(),
  ])

  const creditBalance = Number(treasury.creditBalance)
  const cashBalance = Number(treasury.cashBalance)

  const pendingAllocated = treasury.allocations
    .filter((a) => a.status === "PENDING" || a.status === "ACTIVE")
    .reduce((sum, a) => sum + Number(a.amount), 0)

  // ── Server actions ────────────────────────────────────────────────────────

  async function adjustBalance(formData: FormData) {
    "use server"
    const type = formData.get("type") as "credit" | "cash"
    const operation = formData.get("operation") as "deposit" | "withdraw"
    const amount = parseFloat(formData.get("amount") as string)
    const note = (formData.get("note") as string).trim()

    if (isNaN(amount) || amount <= 0) redirect("/admin/treasury" as Route)

    const delta = operation === "deposit" ? amount : -amount

    await prisma.treasury.update({
      where: { id: "network" },
      data:
        type === "credit"
          ? { creditBalance: { increment: delta } }
          : { cashBalance: { increment: delta } },
    })

    redirect("/admin/treasury" as Route)
  }

  async function createAllocation(formData: FormData) {
    "use server"
    const proposalId = formData.get("proposalId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const purpose = (formData.get("purpose") as string).trim()

    if (!proposalId || isNaN(amount) || amount <= 0 || !purpose) {
      redirect("/admin/treasury" as Route)
    }

    await prisma.treasuryAllocation.create({
      data: {
        treasuryId: "network",
        proposalId,
        amount,
        purpose,
        status: "PENDING",
      },
    })

    redirect("/admin/treasury" as Route)
  }

  async function releaseAllocation(formData: FormData) {
    "use server"
    const id = formData.get("id") as string

    const alloc = await prisma.treasuryAllocation.findUniqueOrThrow({
      where: { id },
    })

    if (!["PENDING", "ACTIVE"].includes(alloc.status)) {
      redirect("/admin/treasury" as Route)
    }

    await prisma.$transaction([
      prisma.treasuryAllocation.update({
        where: { id },
        data: { status: "COMPLETED", releasedAt: new Date() },
      }),
      // Deduct from treasury credit balance on release
      prisma.treasury.update({
        where: { id: "network" },
        data: { creditBalance: { decrement: Number(alloc.amount) } },
      }),
    ])

    redirect("/admin/treasury" as Route)
  }

  async function cancelAllocation(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const reason = (formData.get("reason") as string).trim() || null

    await prisma.treasuryAllocation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    })

    redirect("/admin/treasury" as Route)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Treasury</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Network shared reserves — funded by governance-approved allocations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Balance card ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Balances
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Credit (CC)</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {creditBalance.toFixed(2)}
                  <span className="ml-1 text-sm font-normal text-gray-400">
                    CC
                  </span>
                </p>
                {pendingAllocated > 0 && (
                  <p className="mt-0.5 text-xs text-amber-600">
                    {pendingAllocated.toFixed(2)} CC allocated (pending/active)
                  </p>
                )}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500">Cash (USD)</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${cashBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Adjust balance ── */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Adjust balance
            </p>
            <form action={adjustBalance} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">Type</label>
                  <select
                    name="type"
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="credit">Credit (CC)</option>
                    <option value="cash">Cash (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">
                    Operation
                  </label>
                  <select
                    name="operation"
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="deposit">Deposit</option>
                    <option value="withdraw">Withdraw</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Amount</label>
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">
                  Note (optional)
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="e.g. Member dues, donation…"
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
              >
                Adjust
              </button>
            </form>
          </div>
        </div>

        {/* ── Allocations + new allocation ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* New allocation */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              New allocation
            </p>
            {enactedProposals.length === 0 ? (
              <p className="text-sm text-gray-400">
                No enacted proposals without an allocation yet. Pass a proposal
                through the governance vote to create an allocation.
              </p>
            ) : (
              <form action={createAllocation} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600">
                    Enacted proposal
                  </label>
                  <select
                    name="proposalId"
                    required
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="">Select proposal…</option>
                    {enactedProposals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">
                      Amount (CC)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">
                      Purpose
                    </label>
                    <input
                      type="text"
                      name="purpose"
                      required
                      placeholder="What it funds…"
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                >
                  Create allocation
                </button>
              </form>
            )}
          </div>

          {/* Allocation list */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
              Allocations ({treasury.allocations.length})
            </p>
            {treasury.allocations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
                <p className="text-sm text-gray-400">
                  No allocations yet. Pass a governance proposal and create an
                  allocation above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {treasury.allocations.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {a.purpose}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          <a
                            href={`/proposals/${a.proposalId}`}
                            className="hover:underline"
                          >
                            {a.proposal.title}
                          </a>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Created{" "}
                          {new Date(a.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {a.releasedAt &&
                            ` · Released ${new Date(a.releasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          {a.cancelReason && ` · ${a.cancelReason}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <p className="font-semibold text-gray-900">
                          {Number(a.amount).toFixed(2)} CC
                        </p>
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[a.status] ?? "bg-gray-100 text-gray-500"}`}
                        >
                          {a.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions for pending/active allocations */}
                    {["PENDING", "ACTIVE"].includes(a.status) && (
                      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                        <form action={releaseAllocation}>
                          <input type="hidden" name="id" value={a.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-green-700 px-3 py-1 text-xs font-medium text-white hover:bg-green-800"
                          >
                            Release funds
                          </button>
                        </form>
                        <form action={cancelAllocation} className="flex gap-2">
                          <input type="hidden" name="id" value={a.id} />
                          <input
                            type="text"
                            name="reason"
                            placeholder="Cancellation reason"
                            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 placeholder-gray-400 focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
