/**
 * Edge-compatible auth config — no Prisma, no heavy providers.
 * Used only by middleware. The full auth.ts spreads this and adds
 * the Prisma adapter, Resend provider, and jwt/session callbacks.
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
