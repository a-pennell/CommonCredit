/**
 * Custom Auth.js adapter that maps the Auth.js user model to our Member model.
 *
 * Why custom: Auth.js's Prisma adapter expects an `Account` model for OAuth.
 * Our domain already uses that name for ledger accounts. Rather than rename
 * the ledger model, we implement only the adapter methods we actually need:
 *   - User lookup (maps Member → AdapterUser)
 *   - VerificationToken CRUD (for Resend magic links)
 *
 * OAuth methods are stubbed out — we don't use any OAuth providers.
 * Session methods are stubbed out — we use JWT sessions.
 *
 * Admin emails (from ADMIN_EMAILS env var) can sign in even without a Member
 * record. They receive a synthetic AdapterUser with id "admin:<email>".
 */

import type { Adapter, AdapterUser } from "@auth/core/adapters"
import { prisma } from "@/lib/db"
import type { Member } from "@prisma/client"

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

function isAdminEmail(email: string): boolean {
  return adminEmails.includes(email)
}

function syntheticAdminUser(email: string): AdapterUser {
  return {
    id: `admin:${email}`,
    email,
    name: "Admin",
    emailVerified: new Date(),
    image: null,
  }
}

function toAdapterUser(member: Member): AdapterUser {
  return {
    id: member.id,
    email: member.email,
    name: member.displayName,
    emailVerified: member.joinedAt,
    image: null,
  }
}

export const authAdapter: Adapter = {
  // ---- User (maps to Member) ----

  async getUser(id) {
    // Handle synthetic admin users
    if (id.startsWith("admin:")) {
      const email = id.slice("admin:".length)
      return isAdminEmail(email) ? syntheticAdminUser(email) : null
    }
    const member = await prisma.member.findUnique({ where: { id } })
    return member ? toAdapterUser(member) : null
  },

  async getUserByEmail(email) {
    // Admin emails bypass the Member table — they have no membership record
    if (isAdminEmail(email)) return syntheticAdminUser(email)

    const member = await prisma.member.findUnique({ where: { email } })
    // Only APPROVED members can sign in
    if (!member || member.status !== "APPROVED") return null
    return toAdapterUser(member)
  },

  async getUserByAccount() {
    return null // No OAuth
  },

  async updateUser({ id }) {
    // Handle synthetic admin users — nothing to persist
    if (id.startsWith("admin:")) {
      const email = id.slice("admin:".length)
      return syntheticAdminUser(email)
    }
    // Auth.js calls this after email verification; we don't need to update anything
    const member = await prisma.member.findUniqueOrThrow({ where: { id } })
    return toAdapterUser(member)
  },

  async createUser({ email }) {
    // Admin emails get a synthetic user — no DB record needed
    if (email && isAdminEmail(email)) return syntheticAdminUser(email)

    // Members are created through the membership application process, not here.
    // If Auth.js calls this, it means someone tried to sign in with an email
    // that has no matching approved Member record.
    throw new Error(
      "Sign-in is only available to approved members. " +
        "Apply at /apply or contact the network admin."
    )
  },

  // ---- OAuth Account — not used ----
  async linkAccount() {
    return undefined
  },
  async unlinkAccount() {},

  // ---- Session — not used (JWT strategy) ----
  async createSession() {
    throw new Error("JWT sessions only — session adapter methods should not be called")
  },
  async getSessionAndUser() {
    return null
  },
  async updateSession() {
    return null
  },
  async deleteSession() {},

  // ---- Verification tokens (magic links) ----

  async createVerificationToken(token) {
    return prisma.verificationToken.create({ data: token })
  },

  async useVerificationToken({ identifier, token }) {
    try {
      return await prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      })
    } catch {
      // Token already used or doesn't exist
      return null
    }
  },
}
