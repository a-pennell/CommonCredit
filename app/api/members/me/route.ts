/**
 * GET /api/members/me
 *
 * Returns the canonical MemberResponse for the currently authenticated member.
 * Useful for cross-product SSO — another product can verify identity
 * by presenting a valid JWT and calling this endpoint.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { serializeMember } from "@/lib/serializers/member"

export async function GET() {
  const session = await auth()
  const memberId = session?.user?.memberId

  if (!memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } })

  if (!member) {
    return NextResponse.json({ error: "Member record not found" }, { status: 404 })
  }

  return NextResponse.json(serializeMember(member))
}
