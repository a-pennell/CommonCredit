import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { prisma } from "@/lib/db"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const pendingCount = await prisma.membershipApplication.count({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
  })

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        role="admin"
        userName={session.user.name}
        userEmail={session.user.email}
        pendingCount={pendingCount}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
