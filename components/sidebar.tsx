"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOutAction } from "@/lib/actions/auth"
import type { Route } from "next"

interface SidebarProps {
  role: "admin" | "member"
  userName: string | null | undefined
  userEmail: string | null | undefined
  pendingCount?: number
}

const memberSections = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    label: "Exchange",
    items: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/ai", label: "AI match ✦" },
      { href: "/pay", label: "Send credits" },
      { href: "/invoices", label: "Invoices" },
      { href: "/transactions", label: "Transactions" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/members", label: "Members" },
      { href: "/proposals", label: "Proposals" },
      { href: "/disputes", label: "Disputes" },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/profile", label: "Profile" }],
  },
]

const adminSections = [
  {
    label: null,
    items: [
      { href: "/admin/dashboard", label: "Overview" },
      { href: "/admin/health", label: "Network health" },
    ],
  },
  {
    label: "Members",
    items: [
      { href: "/admin/members", label: "Roster" },
      { href: "/admin/applications", label: "Applications" },
      { href: "/admin/credit-requests", label: "Credit requests" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/proposals", label: "Proposals" },
      { href: "/admin/treasury", label: "Treasury" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/disputes", label: "Disputes" },
      { href: "/admin/transactions", label: "Transactions" },
    ],
  },
]

export function Sidebar({ role, userName, userEmail, pendingCount }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const sections = role === "admin" ? adminSections : memberSections

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  function isActive(href: string) {
    if (href === "/dashboard" || href === "/admin/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            CommonCredit
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Admin
            </span>
          )}
          {/* Close button — mobile only */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden rounded-md p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section, i) => (
          <div key={i} className={i > 0 ? "mt-4" : ""}>
            {section.label && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label }) => {
                const active = isActive(href)
                const showBadge =
                  role === "admin" &&
                  href === "/admin/applications" &&
                  pendingCount != null &&
                  pendingCount > 0

                return (
                  <Link
                    key={href}
                    href={href as Route}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-gray-100 font-medium text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
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
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-gray-200 p-3">
        <div className="mb-2 rounded-md px-2 py-1.5">
          <p className="truncate text-xs font-medium text-gray-900">
            {userName ?? "Admin"}
          </p>
          <p className="truncate text-[11px] text-gray-500">{userEmail}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <Link href="/" className="text-sm font-semibold text-gray-900">
          CommonCredit
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Mobile overlay backdrop ── */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Sidebar — fixed drawer on mobile, static on desktop ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white transition-transform duration-200 ease-in-out
          md:static md:z-auto md:w-56 md:translate-x-0 md:transition-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {navContent}
      </aside>
    </>
  )
}
