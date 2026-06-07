/**
 * Serializes Prisma Member rows to the canonical identity spec shape.
 * See: shared/IDENTITY_SPEC.md
 *
 * Response uses snake_case JSON to match the cross-product contract.
 * The Prisma field `displayName` maps to `display_name` in the response.
 * The DB column is still `name` (mapped via @map("name") in schema).
 */
import type { Member } from "@prisma/client"

export type MemberResponse = {
  id: string
  org_id: string | null
  user_id: string | null
  display_name: string
  email: string
  avatar_url: string | null
  timezone: string | null
  // Cross-product roles: ['admin'] | ['facilitator'] | ['member']
  org_roles: string[]
  status: string
  joined_at: string | null
  departed_at: string | null
}

export function serializeMember(member: Member): MemberResponse {
  return {
    id:           member.id,
    org_id:       member.orgId,
    user_id:      member.userId,
    display_name: member.displayName,
    email:        member.email,
    avatar_url:   member.avatarUrl,
    timezone:     member.timezone,
    // CommonCredit uses MemberStatus enum; map to canonical org_roles
    org_roles:    toOrgRoles(member.status),
    status:       member.status,
    joined_at:    member.joinedAt?.toISOString() ?? null,
    departed_at:  member.departedAt?.toISOString() ?? null,
  }
}

/** Map CommonCredit's MemberStatus to canonical cross-product role array. */
function toOrgRoles(status: string): string[] {
  // Admin role is set separately via ADMIN_EMAILS env var and stored in the JWT.
  // Here we return the baseline member role.
  return ["member"]
}
