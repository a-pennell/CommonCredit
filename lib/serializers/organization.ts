/**
 * Serializes Prisma Organization rows to the canonical identity spec shape.
 * See: shared/IDENTITY_SPEC.md
 *
 * Response uses snake_case JSON to match the cross-product contract.
 * Prisma internals (e.g. creditConfig) are never exposed here.
 */
import type { Organization } from "@prisma/client"

export type OrganizationResponse = {
  id: string
  slug: string
  name: string
  type: string
  size: string
  status: string
  products: string[]
  website: string | null
  description: string | null
  created_at: string
  archived_at: string | null
}

export function serializeOrganization(org: Organization): OrganizationResponse {
  return {
    id:          org.id,
    slug:        org.slug,
    name:        org.name,
    type:        org.type,
    size:        org.size,
    status:      org.status,
    products:    org.products,
    website:     org.website,
    description: org.description,
    created_at:  org.createdAt.toISOString(),
    archived_at: org.archivedAt?.toISOString() ?? null,
  }
}
