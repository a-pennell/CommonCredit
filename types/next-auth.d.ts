import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      memberId: string | null
      role: "admin" | "member"
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    memberId: string | null
    role: "admin" | "member"
  }
}
