/**
 * GET  /api/organizations/:id  — fetch org by ID
 * PATCH /api/organizations/:id — update name, description, website, size
 *
 * GET is accessible to any authenticated member of that org.
 * PATCH is admin only.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { serializeOrganization } from "@/lib/serializers/organization"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const org = await prisma.organization.findUnique({ where: { id } })

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Members can only see their own org
  if (session.user.role !== "admin" && session.user.orgId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(serializeOrganization(org))
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })
  }

  const { id } = await params
  const org = await prisma.organization.findUnique({ where: { id } })
  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (org.status === "ARCHIVED") {
    return NextResponse.json({ error: "Cannot update an archived organization" }, { status: 409 })
  }

  const body = await req.json()
  // Only these fields are patchable — slug and id are immutable
  const { name, description, website, size } = body

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(website     !== undefined && { website }),
      ...(size        !== undefined && { size }),
    },
  })

  return NextResponse.json(serializeOrganization(updated))
}
