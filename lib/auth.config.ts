/**
 * Edge-compatible auth config — no Prisma, no heavy providers.
 * Used only by middleware. The full auth.ts spreads this and adds
 * the Prisma adapter, Resend provider, and jwt/session callbacks.
 *
 * Why session callback here:
 *   next-auth's getSession() (used in middleware) strips the JWT payload
 *   down to { name, email, image } before calling callbacks.session.
 *   Without explicitly mapping token.role → session.user.role here, the
 *   authorized callback sees role=undefined and bounces admins in a loop:
 *     /dashboard → (member layout) → /admin/dashboard
 *     /admin/dashboard → (middleware, role=undefined) → /dashboard → ∞
 */
import type { NextAuthConfig } from "next-auth"

const protectedPrefixes = [
  "/dashboard",
  "/admin",
  "/marketplace",
  "/transactions",
  "/invoices",
  "/profile",
]

export const authConfig = {
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login",
  },
  callbacks: {
    // Propagate role into the session so middleware can see it.
    // This callback is edge-safe (no Prisma). The full auth.ts overrides
    // it to also add memberId.
    session({ session, token }) {
      session.user.role = (token.role as "admin" | "member") ?? "member"
      return session
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

      if (!isProtected) return true
      if (!isLoggedIn) return false

      // Admin routes require admin role (role is stored in the JWT)
      if (pathname.startsWith("/admin")) {
        const role = (auth.user as { role?: string }).role
        if (role !== "admin") {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
      }

      return true
    },
  },
  providers: [], // Providers added in auth.ts (Node.js only)
} satisfies NextAuthConfig
