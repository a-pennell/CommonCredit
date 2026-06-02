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
 */

import type { Adapter, AdapterUser } from "@auth/core/adapters"
import { prisma } from "@/lib/db"
import type { Member } from "@prisma/client"

function toAdapterUser(member: Member): AdapterUser {
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    emailVerified: member.joinedAt,
    image: null,
  }
}

export const authAdapter: Adapter = {
  // ---- User (maps to Member) ----

  async getUser(id) {
    const member = await prisma.member.findUnique({ where: { id } })
    return member ? toAdapterUser(member) : null
  },

  async getUserByEmail(email) {
    const member = await prisma.member.findUnique({ where: { email } })
    // Only APPROVED members can sign in
    if (!member || member.status !== "APPROVED") return null
    return toAdapterUser(member)
  },

  async getUserByAccount() {
    return null // No OAuth
  },

  async updateUser({ id }) {
    // Auth.js calls this after email verification; we don't need to update anything
    const member = await prisma.member.findUniqueOrThrow({ where: { id } })
    return toAdapterUser(member)
  },

  async createUser() {
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
