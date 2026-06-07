/**
 * GET /api/members/:id
 *
 * Returns a canonical MemberResponse (identity spec shape).
 * Members can view any other member in their org.
 * Admins can view any member.
 *
 * Returns snake_case JSON to match the cross-product identity spec contract.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { serializeMember } from "@/lib/serializers/member"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const member = await prisma.member.findUnique({ where: { id } })

  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Members can only see others in the same org; admins can see all
  if (
    session.user.role !== "admin" &&
    member.orgId !== session.user.orgId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(serializeMember(member))
}
