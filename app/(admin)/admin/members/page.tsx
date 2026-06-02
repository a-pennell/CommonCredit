import { prisma } from "@/lib/db"

async function getMembers() {
  return prisma.member.findMany({
    where: { status: "APPROVED" },
    include: {
      account: { select: { balance: true, status: true } },
    },
    orderBy: { joinedAt: "asc" },
  })
}

export default async function MembersPage() {
  const members = await getMembers()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Members</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {members.length} active member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No approved members yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Approve applications to populate this list.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => {
                const balance = m.account?.balance
                  ? Number(m.account.balance)
                  : null
                return (
                  <tr key={m.id} className="text-sm hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {m.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 uppercase">
                        {m.type.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {balance !== null ? (
                        <span
                          className={
                            balance >= 0 ? "text-gray-900" : "text-red-600"
                          }
                        >
                          {balance >= 0 ? "+" : ""}
                          {balance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {m.joinedAt
                        ? new Date(m.joinedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {m.account ? (
                        <span className="text-xs text-green-600">Active</span>
                      ) : (
                        <span className="text-xs text-amber-500">
                          No account
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
