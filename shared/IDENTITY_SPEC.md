# Shared Identity Specification
## The Community OS — Cross-Product Identity Contract

**Version:** 1.0  
**Date:** June 2026  
**Status:** Canonical  
**Applies to:** CommonCredit · Stewardship · Sensemaking

---

## Purpose

This document defines the **Organization** and **Member** records as canonical identity objects shared across all three products. Every product that adopts this spec:

- Uses the same `org_id` UUID as the universal partition key
- Can reference the same member identity without separate accounts
- Can emit and consume cross-product domain events

This spec is intentionally minimal. It defines what **must** be shared. Each product owns its domain extensions freely.

**Rule:** No product may redefine or shadow these fields under different names. If a field appears here, it is authoritative.

---

## 1. Organization

### 1.1 The canonical record

```ts
interface Organization {
  // Identity
  id:          string;    // UUID v4, stable forever, never recycled
  slug:        string;    // URL-safe, lowercase, hyphenated. Unique globally. Mutable with redirect.
  name:        string;    // Display name. Max 100 chars.

  // Classification
  type:        OrgType;
  size:        OrgSize;

  // Status
  status:      OrgStatus;
  created_at:  Date;
  archived_at: Date | null;

  // Contact
  website:     string | null;
  description: string | null;  // Max 500 chars.

  // Products enabled (which modules this org has activated)
  products:    ProductSlug[];
}

type OrgType =
  | 'cooperative'          // Worker, consumer, or multi-stakeholder co-op
  | 'land_trust'           // Community land trust
  | 'housing_coop'         // Housing cooperative
  | 'intentional_community'// Intentional community / ecovillage
  | 'mutual_aid'           // Mutual aid network
  | 'nonprofit'            // Nonprofit or charitable organization
  | 'institution'          // Government body, policy org, civic institution
  | 'network'              // Federation of other orgs
  | 'other';

type OrgSize =
  | 'micro'    // 1–15 members
  | 'small'    // 16–50 members
  | 'medium'   // 51–200 members
  | 'large';   // 200+ members

type OrgStatus =
  | 'active'
  | 'suspended'   // Temporarily restricted
  | 'archived';   // Soft-deleted; data retained

type ProductSlug =
  | 'common_credit'
  | 'stewardship'
  | 'sensemaking';
```

### 1.2 Rules

- `id` is assigned at creation. It never changes. It is the universal partition key for all three products.
- `slug` may change (renamed org) but the old slug must redirect to the new one for at least 12 months.
- `status: 'archived'` is the only deletion mechanism. No hard deletes.
- `products` is the authoritative list of which products the org has activated. A product must check this before granting access.
- An org with `type: 'institution'` is the primary market for **Sensemaking**. An org with any other type is the primary market for **CommonCredit** and/or **Stewardship**. Products should use this to tune onboarding, copy, and defaults.

### 1.3 What each product extends (not shared)

| Product | Extends Organization with |
|---|---|
| CommonCredit | `credit_currency_name`, `credit_unit_value_basis`, `network_treasury_balance`, `membership_fee_cc` |
| Stewardship | `ostrom_design_principles_adopted[]`, `governance_charter_url`, `ecological_context` |
| Sensemaking | `deliberation_mode_defaults`, `decision_methods_enabled[]`, `phase_unlocked` |

These fields live in each product's own database table, linked by `org_id`. They are never part of the canonical Organization record.

---

## 2. Member

### 2.1 The canonical record

```ts
interface Member {
  // Identity
  id:          string;    // UUID v4, stable forever
  org_id:      string;    // FK → Organization.id
  user_id:     string;    // FK → Auth provider's user record (Clerk, etc.)

  // Profile
  display_name: string;   // Max 60 chars. Shown across all products.
  email:        string;   // Unique per org. Matches auth provider.
  avatar_url:   string | null;

  // Membership
  status:       MemberStatus;
  joined_at:    Date;
  departed_at:  Date | null;

  // Cross-product roles
  org_roles:    OrgRole[];

  // Metadata
  bio:          string | null;  // Max 300 chars.
  timezone:     string | null;  // IANA timezone string
}

type MemberStatus =
  | 'active'
  | 'suspended'   // Access restricted; data retained
  | 'departed';   // Left the org; data retained, no access

type OrgRole =
  | 'admin'       // Full access across all activated products
  | 'facilitator' // Can open/close governance processes (all products)
  | 'member';     // Default role; product-specific permissions managed per-product
```

### 2.2 Rules

- `id` never changes. A member who departs and rejoins gets a new `id` — the old record is set to `status: 'departed'`.
- `user_id` is the link to the auth layer. One `user_id` may have Member records in multiple orgs (a person participates in two co-ops).
- `email` is unique **per org**, not globally. The same person can be a member of multiple orgs.
- `org_roles` are cross-product roles only. Product-specific roles (e.g. `steward`, `evidence_steward`, `credit_broker`) are defined in each product's own schema.
- `status: 'departed'` is the only removal mechanism. No hard deletes. Departed members' contributions, transactions, and decisions remain in the record.
- `display_name` is authoritative across all products. Products must not ask a member to re-enter their name.

### 2.3 What each product extends (not shared)

| Product | Extends Member with |
|---|---|
| CommonCredit | `credit_balance`, `credit_limit`, `reputation_score`, `offers[]`, `endorsements[]` |
| Stewardship | `stewardship_assignments[]`, `contribution_log`, `access_rights[]` |
| Sensemaking | `deliberation_roles[]` (Facilitator, Evidence Steward, Decision Steward, Participant) |

---

## 3. Cross-Product Domain Events

### 3.1 Event envelope

All events share this envelope:

```ts
interface DomainEvent {
  event_id:     string;    // UUID v4, unique per event
  event_type:   string;    // Namespaced: "org.member.joined", "governance.decision.recorded", etc.
  occurred_at:  Date;
  org_id:       string;    // Always present; the partition key
  source:       ProductSlug;
  payload:      Record<string, unknown>;
  schema_version: number;  // Increment when payload shape changes
}
```

### 3.2 Canonical events (stable; breaking changes require major version bump)

```
org.created                   { org_id, org_type, products_enabled }
org.product.activated         { org_id, product }
org.member.joined             { org_id, member_id, roles }
org.member.departed           { org_id, member_id }
org.member.role_changed       { org_id, member_id, old_roles, new_roles }

governance.proposal.created   { org_id, proposal_id, source, title, type }
governance.proposal.decided   { org_id, proposal_id, outcome, method, dissent_recorded }
governance.decision.recorded  { org_id, decision_id, proposal_id, affects_domain, summary }

stewardship.resource.alert    { org_id, resource_id, indicator_id, threshold_type }
stewardship.policy.changed    { org_id, policy_id, decision_id, change_summary }

credit.limit.changed          { org_id, member_id, old_limit, new_limit, decision_id | null }
credit.network.health         { org_id, velocity, reciprocity_score, gap_categories[] }
```

### 3.3 Subscription matrix (which product cares about which events)

| Event | CommonCredit | Stewardship | Sensemaking |
|---|---|---|---|
| `org.member.joined` | ✅ init credit account | ✅ init steward profile | ✅ init participant |
| `org.member.departed` | ✅ freeze balance | ✅ reassign care | ✅ archive contributions |
| `governance.decision.recorded` | ✅ if affects credit policy | ✅ if affects resource policy | source |
| `stewardship.resource.alert` | — | source | ✅ can auto-create Issue |
| `stewardship.policy.changed` | ✅ if affects exchange rules | source | ✅ decision memory |
| `credit.limit.changed` | source | — | ✅ decision memory |
| `credit.network.health` | source | — | ✅ evidence for Issue |

---

## 4. Authentication Contract

### 4.1 Single sign-on requirement

A user authenticates **once** and gets access to all products their org has activated. Products must not maintain separate login systems.

**Current state:**
- Stewardship: Clerk ✅
- CommonCredit: TBD (adopt Clerk to match)
- Sensemaking: TBD (adopt Clerk to match)

**Resolution:** Adopt Clerk as the shared auth provider across all three products. Each product configures a Clerk application but shares the same Clerk organization and user records. The `user_id` in the Member record is the Clerk user ID.

### 4.2 Session token requirements

Each product's API must accept a JWT issued by the shared auth provider. The JWT payload must include:
- `user_id` (Clerk user ID)
- `org_id` (active organization)
- `org_roles[]` (from the canonical Member record)

Product-specific role checks are performed by each product against its own extended member record, using `org_id + user_id` as the lookup key.

---

## 5. What Each Product Must Never Do

These are hard constraints that protect cross-product identity integrity:

1. **Never hard-delete an Organization or Member record.** Use `status: 'archived'` / `status: 'departed'`. Cross-product references (event logs, decision records, transaction history) must remain resolvable.

2. **Never reassign `org_id` or `member_id`.** These are permanent. If an org restructures, it creates a new Organization record.

3. **Never define local copies of `display_name`, `email`, or `avatar_url`.** Read from the canonical Member record. Never shadow these fields.

4. **Never check product access without consulting `Organization.products`.** A product activated for one org is not activated for all.

5. **Never break event schema without incrementing `schema_version`.** Consumers must be able to handle old and new versions simultaneously during migration windows.

---

## 6. Migration Guide for Existing Products

### CommonCredit

1. Rename `organization_id` → `org_id` if not already matching (one migration)
2. Add `products: ProductSlug[]` column to organizations table with `['common_credit']` as default
3. Add `user_id` (Clerk ID) to members table; migrate from existing auth
4. Adopt `status: 'active' | 'suspended' | 'departed'` enum where not already present

### Stewardship

1. Confirm `org_id` column name matches spec (already appears to use `community_id` — rename or alias)
2. Add `products: ProductSlug[]` column with `['stewardship']` as default
3. `user_id` (Clerk ID) is already present — confirm it matches the canonical `Member.user_id` field name
4. Ensure no hard deletes exist for Community or Member records; convert to status flags

### Sensemaking

Build to spec from day one. No migration required.

---

## 7. Versioning

This spec is versioned. Breaking changes require:
- A new major version number
- A migration path documented in this file
- A minimum 6-month deprecation window for old field names or event schemas

Non-breaking additions (new optional fields, new event types) increment the minor version and do not require migration.

**Current version:** 1.0.0
