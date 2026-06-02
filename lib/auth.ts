import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { authAdapter } from "@/lib/auth-adapter"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth.config"

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: authAdapter,
  session: { strategy: "jwt" },

  providers: [
    Resend({
      from: process.env.EMAIL_FROM ?? "noreply@commoncredit.coop",
      name: "CommonCredit",
    }),
  ],

  callbacks: {
    // Spread the authorized callback from authConfig, then add jwt + session
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user?.email) {
        const member = await prisma.member.findUnique({
          where: { email: user.email },
          select: { id: true },
        })
        token.memberId = member?.id ?? null
        token.role = adminEmails.includes(user.email) ? "admin" : "member"
      }
      return token
    },

    async session({ session, token }) {
      session.user.memberId = (token.memberId as string) ?? null
      session.user.role = (token.role as "admin" | "member") ?? "member"
      return session
    },
  },
})
