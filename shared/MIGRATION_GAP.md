# Identity Spec — Migration Gap Analysis

**Against:** `IDENTITY_SPEC.md` v1.0.0  
**Products audited:** CommonCredit (Prisma/Postgres) · Stewardship (raw SQL/Postgres)  
**Date:** June 2026

---

## Summary

| Gap | CommonCredit | Stewardship | Sensemaking |
|---|---|---|---|
| Organization top-level record | ❌ Missing — single-tenant | ✅ Has `communities` table | ✅ Build to spec |
| `org_id` as universal FK | ❌ No multi-tenancy | ⚠️ Uses `community_id` (rename) | ✅ Build to spec |
| `user_id` on Member (auth provider link) | ❌ Missing | ❌ Missing | ✅ Build to spec |
| `Organization.status` field | ❌ Missing | ❌ Missing | ✅ Build to spec |
| `Organization.products[]` field | ❌ Missing | ❌ Missing | ✅ Build to spec |
| Member `display_name` (vs `name`) | ⚠️ Uses `name` | ⚠️ Uses `name` | ✅ Build to spec |
| Member `departed_at` | ⚠️ No departure tracking | ⚠️ Uses `alumni` status | ✅ Build to spec |
| Auth provider | ❌ TBD | ✅ Clerk | Adopt Clerk |

**Risk level:** CommonCredit is higher-risk (missing multi-tenancy entirely). Stewardship is lower-risk (mostly renames).

---

## CommonCredit — Required Changes

### 1. Add Organization table (breaking architectural change)

CommonCredit is currently single-tenant. All members exist in one global namespace. This needs to change before Phase 3 governance or any federation is possible.

**New Prisma model:**

```prisma
model Organization {
  id          String        @id @default(uuid())
  slug        String        @unique
  name        String
  type        OrgType
  size        OrgSize       @default(MICRO)
  status      OrgStatus     @default(ACTIVE)
  products    String[]      @default(["common_credit"])
  website     String?
  description String?
  createdAt   DateTime      @default(now())
  archivedAt  DateTime?

  members     Member[]

  // CommonCredit-specific extensions (NOT in shared spec)
  currencyName    String    @default("CommonCredit")
  creditUnitBasis String    @default("USD")
}

enum OrgType {
  COOPERATIVE
  LAND_TRUST
  HOUSING_COOP
  INTENTIONAL_COMMUNITY
  MUTUAL_AID
  NONPROFIT
  INSTITUTION
  NETWORK
  OTHER
}

enum OrgSize {
  MICRO    // 1–15
  SMALL    // 16–50
  MEDIUM   // 51–200
  LARGE    // 200+
}

enum OrgStatus {
  ACTIVE
  SUSPENDED
  ARCHIVED
}
```

**Impact:** Every model currently keyed to `Member` alone will need `orgId` added as a partition key. This is ~15 models. Plan as a dedicated migration sprint.

**Sequencing recommendation:** Do this BEFORE adding any governance (Phase 3) features. Retrofitting multi-tenancy after governance is much harder.

---

### 2. Add `user_id` and `orgId` to Member

```prisma
model Member {
  id          String       @id @default(uuid())   // change cuid → uuid for spec alignment
  orgId       String                              // FK → Organization.id  NEW
  userId      String?                             // Clerk user ID          NEW
  
  // Rename for spec alignment:
  displayName String                              // was: name
  email       String
  bio         String?
  avatarUrl   String?                             // NEW
  timezone    String?                             // NEW

  status      MemberStatus @default(PENDING)
  joinedAt    DateTime?
  departedAt  DateTime?                           // NEW

  organization Organization @relation(fields: [orgId], references: [id])
  
  // ...rest unchanged
  
  @@unique([orgId, email])                        // email unique per org, not globally
  @@index([orgId])
  @@index([userId])
}
```

**Breaking change:** `email @unique` becomes `@@unique([orgId, email])`. The same person can be a member of multiple orgs.

---

### 3. Migrate existing data

For the Phase 1 MVP (single-tenant, single network), create one default Organization record and assign all existing Members to it. This is a one-time data migration, not a schema migration.

```sql
INSERT INTO organizations (id, slug, name, type, status, products)
VALUES (
  gen_random_uuid(),
  'default-network',
  'CommonCredit Network',
  'COOPERATIVE',
  'ACTIVE',
  ARRAY['common_credit']
);

UPDATE members SET org_id = (SELECT id FROM organizations LIMIT 1);
```

---

## Stewardship — Required Changes

### 1. Rename `community_id` → `org_id` across all tables

Stewardship uses `community_id` as the universal partition key. The spec requires `org_id`.

**Option A (recommended): Direct rename migration**

```sql
-- Rename the column in every table that uses it
ALTER TABLE members           RENAME COLUMN community_id TO org_id;
ALTER TABLE resources         RENAME COLUMN community_id TO org_id;
ALTER TABLE policies          RENAME COLUMN community_id TO org_id;
ALTER TABLE proposals         RENAME COLUMN community_id TO org_id;
ALTER TABLE decisions         RENAME COLUMN community_id TO org_id;
ALTER TABLE roles             RENAME COLUMN community_id TO org_id;
ALTER TABLE role_assignments  RENAME COLUMN community_id TO org_id;
-- ...all remaining tables
```

**Option B: Add `org_id` as a generated alias (less invasive)**

```sql
-- Keep community_id, add org_id as a generated column aliased to it
ALTER TABLE communities ADD COLUMN org_id UUID GENERATED ALWAYS AS (id) STORED;
-- Expose org_id in API layer only; internal code still uses community_id
```

Option B has less blast radius but leaves the codebase inconsistent. Recommend Option A during early development while the schema is still fluid.

---

### 2. Rename `communities` table — **optional, lower priority**

The spec calls the top-level record `Organization`. Stewardship calls it `Community`. The field `id` is the canonical `org_id` either way.

**Decision:** Keep `communities` as the table name internally. Expose it as `organization` at the API layer. The table name is an implementation detail; the ID is the contract. No rename needed.

---

### 3. Add missing fields to `communities`

```sql
ALTER TABLE communities
  ADD COLUMN status   TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  ADD COLUMN products TEXT[] NOT NULL DEFAULT ARRAY['stewardship'],
  ADD COLUMN archived_at TIMESTAMPTZ;
```

---

### 4. Add `user_id` to `members`

Stewardship does not currently link members to Clerk user IDs. This is needed for SSO.

```sql
ALTER TABLE members
  ADD COLUMN user_id TEXT,           -- Clerk user ID; nullable until Clerk is wired
  ADD COLUMN avatar_url TEXT,
  ADD COLUMN timezone TEXT,
  ADD COLUMN departed_at TIMESTAMPTZ;

CREATE INDEX idx_members_user_id ON members(user_id);
```

---

### 5. Member status reconciliation

Stewardship's member status values (`prospective`, `provisional`, `active`, `guest`, `steward`, `suspended`, `alumni`) are richer than the spec's (`active`, `suspended`, `departed`).

**Resolution:** Keep Stewardship's richer status enum internally. Map to the canonical values at the API/event layer:

| Stewardship status | Canonical status |
|---|---|
| `prospective`, `provisional`, `guest` | → `active` (limited access; Stewardship handles the nuance) |
| `active`, `steward` | → `active` |
| `suspended` | → `suspended` |
| `alumni` | → `departed` |

The spec's `MemberStatus` is the **minimum** interface. Products can be richer internally.

---

## Sensemaking — Build to spec

No migrations. Use these field names, types, and enums from day one:

- Organizations table: `id (uuid)`, `slug`, `name`, `type`, `size`, `status`, `products[]`, `created_at`, `archived_at`
- Members table: `id (uuid)`, `org_id`, `user_id`, `display_name`, `email`, `avatar_url`, `status`, `joined_at`, `departed_at`, `bio`, `timezone`
- Auth: Clerk, using Clerk user ID as `user_id`

---

## Shared Auth — Clerk Adoption Plan

| Product | Current | Change |
|---|---|---|
| Stewardship | Clerk ✅ | None — already on Clerk |
| CommonCredit | Unknown/TBD | Add Clerk; wire `userId` on Member |
| Sensemaking | Not started | Use Clerk from day one |

**Clerk configuration:**
- Create one Clerk **instance** per product (separate applications)
- Use Clerk's `externalId` to store the canonical `member.id` from each product
- The `user.id` in Clerk is the `user_id` stored in each product's Member record
- SSO between products: a user authenticated in CommonCredit can present the same Clerk JWT to Stewardship — the API checks `user_id` matches a Member in that org

---

## Priority Order

1. **Stewardship: rename `community_id` → `org_id`** — mechanical, do it now while schema is young
2. **Stewardship: add `user_id`, `status`, `products[]`** — small additions, same migration
3. **CommonCredit: add Organization table + `orgId` on Member** — more involved; plan as dedicated sprint before Phase 3
4. **Shared: adopt Clerk in CommonCredit** — unblocks SSO
5. **Sensemaking: build to spec from day one** — no migration needed

---

## What this unlocks

Once all three products are at spec:
- A user logs in once (Clerk) and hits any product they're a member of
- Cross-product events use `org_id` as the routing key — no ambiguity
- Decision records from any product can reference the same `org_id` and `member_id`
- Sensemaking's institutional memory can index across products via `org_id` + stable IDs

**Total engineering cost:** ~3–5 days for Stewardship migrations, ~5–8 days for CommonCredit multi-tenancy sprint. Sensemaking gets it free. Then every future integration feature is additive, not architectural.
