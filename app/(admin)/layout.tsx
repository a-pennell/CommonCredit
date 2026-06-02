import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        role="admin"
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
