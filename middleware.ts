import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Middleware uses only the edge-compatible config — no Prisma, no pg, no Resend.
// This keeps the bundle well under Vercel's 1MB edge function limit.
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
