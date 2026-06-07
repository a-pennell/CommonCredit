/**
 * POST /api/organizations
 *
 * Creates a new Organization and its default CreditNetworkConfig.
 * Admin only — regular members cannot provision new networks.
 *
 * Body: { slug, name, type?, size?, website?, description? }
 *
 * Returns: 201 + OrganizationResponse on success.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { serializeOrganization } from "@/lib/serializers/organization"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })
  }

  const body = await req.json()
  const { slug, name, type, size, website, description } = body

  if (!slug || !name) {
    return NextResponse.json(
      { error: "slug and name are required" },
      { status: 422 }
    )
  }

  // Validate slug is URL-safe
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must contain only lowercase letters, numbers, and hyphens" },
      { status: 422 }
    )
  }

  const existing = await prisma.organization.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "slug already taken" }, { status: 409 })
  }

  const org = await prisma.organization.create({
    data: {
      slug,
      name,
      type:        type ?? "COOPERATIVE",
      size:        size ?? "MICRO",
      status:      "ACTIVE",
      products:    ["common_credit"],
      website:     website ?? null,
      description: description ?? null,
      creditConfig: {
        create: {
          currencyName:      "CommonCredit",
          currencySymbol:    "CC",
          creditUnitBasis:   "USD",
          defaultCreditLimit: 500,
          defaultDebitLimit:  -200,
        },
      },
    },
  })

  return NextResponse.json(serializeOrganization(org), { status: 201 })
}
