import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  // Admins get their own dashboard — redirect them out of the member shell
  if (session.user.role === "admin") redirect("/admin/dashboard")

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        role="member"
        userName={session.user.name}
        userEmail={session.user.email}
      />
      {/* pt-14 clears the fixed mobile top bar; md:pt-0 removes it on desktop */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
