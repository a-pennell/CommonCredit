# Implementation Plan: CommonCredit — Multi-tenancy & Identity Spec

**Workstream:** B  
**Repo:** `/Users/andrewpennell/Projects/CommonCredit`  
**Against spec:** `shared/IDENTITY_SPEC.md` v1.0.0  
**Estimated scope:** 5–8 days  
**Blocks:** Phase 3 governance, cross-product events, federation

---

## Overview

CommonCredit is currently single-tenant: one global namespace of members, no organization partitioning. This sprint adds the `Organization` model, wires `orgId` onto every member-adjacent record, migrates existing data into a default organization, and wires Clerk auth. This is a prerequisite for Phase 3 governance — retrofitting org partitioning after governance is built is exponentially harder.

## Architecture Decisions

- UUID (not cuid) for Organization and Member IDs, to match the identity spec and Stewardship.
- Email uniqueness changes from global to per-org: `@@unique([orgId, email])`. A person can be a member of multiple credit networks.
- Existing members are migrated into a single default `Organization` record. The default org is a real Organization, not a null placeholder.
- Clerk is the auth provider. `userId` on Member stores the Clerk user ID.
- Multi-tenancy is enforced at the application layer (all queries include `orgId`). Row-level security in Postgres as a secondary safeguard — add later if needed.
- CommonCredit-specific Organization extensions (`currencyName`, `creditUnitBasis`, etc.) live in a separate `CreditNetworkConfig` model, not on the base Organization model. This keeps the canonical Organization clean.

---

## Task List

### Phase 1: Foundation — Organization Model

---

**Task B-1: Add `Organization` model to Prisma schema**  
*Size: M*

Add the canonical Organization record. This is the top-level tenant partition key.

```prisma
model Organization {
  id          String      @id @default(uuid())
  slug        String      @unique
  name        String
  type        OrgType     @default(COOPERATIVE)
  size        OrgSize     @default(MICRO)
  status      OrgStatus   @default(ACTIVE)
  products    String[]    @default(["common_credit"])
  website     String?
  description String?
  createdAt   DateTime    @default(now())
  archivedAt  DateTime?

  members         Member[]
  creditConfig    CreditNetworkConfig?

  @@index([slug])
  @@index([status])
}

model CreditNetworkConfig {
  id              String       @id @default(uuid())
  orgId           String       @unique
  organization    Organization @relation(fields: [orgId], references: [id])
  currencyName    String       @default("CommonCredit")
  creditUnitBasis String       @default("USD")
  defaultCreditLimit Int       @default(500)
  // ...other CC-specific settings
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
  MICRO
  SMALL
  MEDIUM
  LARGE
}

enum OrgStatus {
  ACTIVE
  SUSPENDED
  ARCHIVED
}
```

**Acceptance criteria:**
- [ ] `Organization` model exists in schema
- [ ] `CreditNetworkConfig` model exists as a 1:1 extension
- [ ] `npx prisma migrate dev` runs without errors
- [ ] `npx prisma generate` produces correct TypeScript types

**Verification:**
- [ ] `npx prisma migrate dev --name add-organization` succeeds
- [ ] `npx prisma studio` shows `Organization` table

**Dependencies:** None

**Files touched:**
- `prisma/schema.prisma`

---

**Task B-2: Add `orgId` and `userId` to `Member`; update uniqueness**  
*Size: M*

Wire the Member model to Organization. Add Clerk user ID. Change email uniqueness from global to per-org.

```prisma
model Member {
  id          String       @id @default(uuid())
  orgId       String
  userId      String?      // Clerk user ID; nullable until Clerk is wired
  
  displayName String       // was: name
  email       String
  bio         String?
  avatarUrl   String?
  timezone    String?
  location    String?
  website     String?

  status      MemberStatus @default(PENDING)
  joinedAt    DateTime?
  departedAt  DateTime?    // new
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  organization Organization @relation(fields: [orgId], references: [id])

  // ... existing relations unchanged ...

  @@unique([orgId, email])
  @@index([orgId])
  @@index([userId])
}
```

**Acceptance criteria:**
- [ ] Member has `orgId` (non-null FK to Organization)
- [ ] Member has `userId` (nullable, Clerk ID)
- [ ] `displayName` replaces `name`
- [ ] `departedAt` field exists
- [ ] `email` is unique per org, not globally
- [ ] `npx prisma migrate dev` succeeds

**Verification:**
- [ ] `npx prisma migrate dev --name add-org-id-to-member` succeeds
- [ ] TypeScript: `member.orgId` and `member.userId` are accessible

**Dependencies:** B-1

**Files touched:**
- `prisma/schema.prisma`

---

**Task B-3: Migration — seed default Organization, assign all existing Members**  
*Size: S*

Write a Prisma seed / migration script that:
1. Creates the default Organization record (using the existing network's name)
2. Sets `orgId` on all existing Member records

```ts
// prisma/migrations/[timestamp]_assign_default_org/migration.sql equivalent
// Or as a Prisma seed:

const defaultOrg = await prisma.organization.create({
  data: {
    id:   process.env.DEFAULT_ORG_ID ?? randomUUID(),
    slug: 'default-network',
    name: 'CommonCredit Network',
    type: 'COOPERATIVE',
    status: 'ACTIVE',
    products: ['common_credit'],
    creditConfig: {
      create: {
        currencyName:      'CommonCredit',
        creditUnitBasis:   'USD',
        defaultCreditLimit: 500,
      }
    }
  }
});

await prisma.member.updateMany({
  data: { orgId: defaultOrg.id }
});
```

**Acceptance criteria:**
- [ ] Exactly one Organization record exists after migration
- [ ] Every Member record has `orgId` pointing to that Organization
- [ ] No Member records have `orgId = null`

**Verification:**
- [ ] `SELECT COUNT(*) FROM members WHERE org_id IS NULL;` returns 0
- [ ] `SELECT COUNT(*) FROM organizations;` returns 1

**Dependencies:** B-2

**Files touched:**
- `prisma/seed.ts` or a new migration script

---

### Checkpoint B-1: Foundation complete

- [ ] `npx prisma migrate dev` runs clean
- [ ] `npx prisma db seed` runs clean
- [ ] All Member records have `orgId`
- [ ] `npx prisma generate` produces clean TypeScript types
- [ ] `npm run build` succeeds (even if runtime queries are not yet updated)
- [ ] Human review before Phase 2

---

### Phase 2: Query Layer — Scope All Queries to Org

---

**Task B-4: Scope all read queries to `orgId`**  
*Size: L — split into feature-area batches if needed*

Every query that reads Member, Account, Transaction, Offer, Need, etc. must be scoped to the current `orgId`. This prevents cross-org data leakage.

Pattern:
```ts
// Before
const members = await prisma.member.findMany();

// After
const members = await prisma.member.findMany({
  where: { orgId: ctx.orgId }
});
```

Work through each domain area:
- Members + Applications
- Accounts + Balances
- Transactions + Ledger
- Offers + Needs
- Invoices
- Proposals + Votes
- Treasury

**Acceptance criteria:**
- [ ] `grep -r "prisma.member.findMany()" lib/ app/` returns zero results without `orgId` filter
- [ ] Same check for all other multi-tenant models
- [ ] A request with Org A's token cannot return Org B's data
- [ ] All existing queries still return correct data for the default org

**Verification:**
- [ ] Manual: create a second test org, confirm its data is isolated
- [ ] `npm run build` succeeds
- [ ] Core flows (member list, transaction list, offer list) work end-to-end

**Dependencies:** B-3

**Files touched:**
- All query files in `lib/`, `app/api/`

---

**Task B-5: Wire Clerk auth — resolve Member from JWT**  
*Size: M*

Replace the current auth mechanism with Clerk. On each authenticated request, resolve the current `member` from the Clerk JWT's `userId`.

```ts
// lib/auth.ts
export async function getCurrentMember(req: NextRequest): Promise<Member> {
  const { userId } = await clerkAuth(req);
  if (!userId) throw new UnauthorizedError();
  
  const member = await prisma.member.findFirst({
    where: { userId, status: 'ACTIVE' }
  });
  if (!member) throw new UnauthorizedError();
  
  return member;
}
```

**Acceptance criteria:**
- [ ] Every protected API route uses `getCurrentMember()` to resolve identity
- [ ] A valid Clerk JWT returns the correct Member record
- [ ] An expired/invalid JWT returns `401`
- [ ] A Clerk user with no corresponding Member record returns `403`
- [ ] `member.orgId` is available on every authenticated request

**Verification:**
- [ ] Sign in with Clerk; call `GET /api/me`; returns correct member
- [ ] Call with expired token; get `401`
- [ ] `npm run build` succeeds

**Dependencies:** B-4

**Files touched:**
- `lib/auth.ts`
- `middleware.ts`
- All protected API routes

---

### Checkpoint B-2: Multi-tenancy enforced

- [ ] All queries scoped to `orgId`
- [ ] Clerk auth working end-to-end
- [ ] `npm run build` succeeds
- [ ] No cross-org data leakage (tested with two orgs)
- [ ] All existing features (transactions, offers, invoices) work for default org
- [ ] Human review before Phase 3

---

### Phase 3: API Layer — Expose Canonical Shapes

---

**Task B-6: Add Organization CRUD API**  
*Size: M*

Create the API endpoints for Organization — needed for onboarding new credit networks.

Endpoints:
- `POST /api/organizations` — create new org (admin only)
- `GET /api/organizations/:id` — get org by ID
- `PATCH /api/organizations/:id` — update name, description, etc.

Response shape must match the identity spec:
```ts
{
  id, slug, name, type, size, status, products,
  website, description, created_at, archived_at
}
```

**Acceptance criteria:**
- [ ] `POST /api/organizations` creates org and default CreditNetworkConfig
- [ ] `GET /api/organizations/:id` returns spec-compliant shape
- [ ] Response never exposes internal Prisma field names (camelCase → snake_case in response)
- [ ] Non-admin cannot create/update an org

**Verification:**
- [ ] `curl -X POST /api/organizations` with valid payload creates org
- [ ] Response shape matches `IDENTITY_SPEC.md` Organization type

**Dependencies:** B-5

**Files touched:**
- `app/api/organizations/route.ts` (new)
- `app/api/organizations/[id]/route.ts` (new)
- `lib/serializers/organization.ts` (new)

---

**Task B-7: Update Member API to expose canonical shape**  
*Size: S*

Member API responses must use `display_name` (not `name`), include `user_id`, `org_id`, `departed_at`.

**Acceptance criteria:**
- [ ] `GET /api/members/:id` returns `{ id, org_id, display_name, email, status, joined_at, ... }`
- [ ] Response never exposes `name` (old field name)
- [ ] `org_roles` array present (even if just `['member']` for now)

**Verification:**
- [ ] `GET /api/members/:id` response passes against IDENTITY_SPEC Member shape

**Dependencies:** B-5

**Files touched:**
- `app/api/members/[id]/route.ts`
- `lib/serializers/member.ts` (new)

---

### Checkpoint B-3: API is spec-compliant

- [ ] All API responses use spec field names
- [ ] `npm run build` passes
- [ ] Postman/curl checks against identity spec shapes pass
- [ ] Human sign-off

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Missed query without `orgId` filter | High — data leakage | Grep check in checkpoint B-2; integration test with two orgs |
| Prisma migration conflicts with existing data | Med | Test migration against copy of prod DB first |
| Clerk integration breaks existing session logic | Med | Keep old auth alongside Clerk during transition; cut over at B-5 |
| `uuid()` vs `cuid()` ID format mismatch | Low | All new IDs are UUID; old Member IDs stay as cuid until a future migration |

## Open Questions

- What is the current auth mechanism in CommonCredit? (Needs investigation before B-5)
- Is there a `DEFAULT_ORG_ID` env var strategy, or will we generate a new UUID at migration time?
- Should old Member `id` (cuid) be migrated to UUID now, or deferred? (Recommendation: defer — not worth the blast radius)
