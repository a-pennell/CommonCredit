import Link from "next/link"
import { signOut } from "@/lib/auth"
import type { Route } from "next"

interface SidebarProps {
  role: "admin" | "member"
  userName: string | null | undefined
  userEmail: string | null | undefined
  pendingCount?: number
}

const memberNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/transactions", label: "Transactions" },
  { href: "/invoices", label: "Invoices" },
  { href: "/profile", label: "Profile" },
]

const adminNav = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/transactions", label: "Transactions" },
]

export function Sidebar({ role, userName, userEmail, pendingCount }: SidebarProps) {
  const nav = role === "admin" ? adminNav : memberNav

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-sm font-semibold tracking-tight text-gray-900">
          CommonCredit
        </span>
        {role === "admin" && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            Admin
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {nav.map(({ href, label }) => {
          const showBadge =
            role === "admin" &&
            href === "/admin/applications" &&
            pendingCount != null &&
            pendingCount > 0

          return (
            <Link
              key={href}
              href={href as Route}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {label}
              {showBadge && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + sign-out */}
      <div className="border-t border-gray-200 p-3">
        <div className="mb-2 px-1">
          <p className="truncate text-xs font-medium text-gray-900">
            {userName ?? "Admin"}
          </p>
          <p className="truncate text-xs text-gray-500">{userEmail}</p>
        </div>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md px-3 py-1.5 text-left text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
