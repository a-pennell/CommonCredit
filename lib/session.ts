/**
 * Session helpers for server components and API routes.
 *
 * requireSession() — returns session or redirects to login.
 * requireMemberSession() — returns { memberId, orgId } or redirects.
 * requireAdminSession() — returns session or redirects to dashboard.
 *
 * orgId is the canonical multi-tenancy partition key.
 * Every query on member-adjacent data must include it.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export type MemberSession = {
  memberId: string
  orgId: string
  role: "admin" | "member"
  email: string | null | undefined
}

/**
 * Returns a verified MemberSession.
 * Throws (redirects) if the user is not signed in or has no memberId/orgId.
 */
export async function requireMemberSession(): Promise<MemberSession> {
  const session = await auth()
  const memberId = session?.user?.memberId
  const orgId = session?.user?.orgId

  if (!session || !memberId || !orgId) {
    redirect("/login")
  }

  return {
    memberId,
    orgId,
    role: session.user.role ?? "member",
    email: session.user.email,
  }
}

/**
 * Returns a session for admin pages.
 * Redirects to /dashboard if not admin.
 */
export async function requireAdminSession() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")
  return session
}
