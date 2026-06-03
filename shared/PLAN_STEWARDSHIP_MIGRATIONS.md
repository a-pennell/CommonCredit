# Implementation Plan: Stewardship — Identity Spec Migrations

**Workstream:** A  
**Repo:** `/Users/andrewpennell/Projects/Stewardship`  
**Against spec:** `shared/IDENTITY_SPEC.md` v1.0.0  
**Estimated scope:** 3–5 days  
**Blocks:** Cross-product SSO, cross-product events

---

## Overview

Migrate Stewardship's database schema to align with the shared identity spec. Primarily renames and additive column additions — no data loss, no breaking feature changes. Stewardship already has the right structure; it just needs its field names aligned and a few new columns added.

## Architecture Decisions

- Rename `community_id` → `org_id` across all tables. Option A (direct rename) over Option B (generated column alias). Codebase is young enough that the rename is worth the cleanliness.
- Keep `communities` as the table name internally. Expose as `organization` at the API layer only. The ID is the contract; the table name is an implementation detail.
- Adopt the identity spec's three canonical statuses (`active`, `suspended`, `departed`) as an API-layer mapping. Keep Stewardship's richer internal statuses (`prospective`, `provisional`, etc.) — they map down to the canonical values in event payloads.
- Add `user_id` as nullable initially. Wire Clerk after column exists.

---

## Task List

### Phase 1: Schema Migrations

---

**Task A-1: Rename `community_id` → `org_id` in all tables**  
*Size: M*

Add a single migration that renames the `community_id` column to `org_id` in every table that uses it as a foreign key.

**Acceptance criteria:**
- [ ] All tables that referenced `community_id` now reference `org_id`
- [ ] Existing indexes on `community_id` are renamed to `idx_*_org_id`
- [ ] Foreign key constraints are preserved (still reference `communities.id`)
- [ ] Migration runs cleanly on a fresh DB: `psql < schema.sql` succeeds
- [ ] Migration runs cleanly on existing DB without data loss

**Verification:**
- [ ] `psql -c "\d members"` shows `org_id` column, not `community_id`
- [ ] `psql -c "\d proposals"` shows `org_id` column
- [ ] Run full table list: confirm no remaining `community_id` columns

**Dependencies:** None

**Files touched:**
- `schema.sql` — rename all occurrences
- `schema-fix.sql` — update if referenced
- Any Drizzle schema files in `db/` that declare these columns

---

**Task A-2: Add `status`, `products[]`, `archived_at` to `communities`**  
*Size: S*

Add the three missing columns required by the identity spec.

```sql
ALTER TABLE communities
  ADD COLUMN status      TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  ADD COLUMN products    TEXT[]      NOT NULL DEFAULT ARRAY['stewardship'],
  ADD COLUMN archived_at TIMESTAMPTZ;
```

**Acceptance criteria:**
- [ ] `communities.status` exists with default `'active'` and check constraint
- [ ] `communities.products` exists with default `['stewardship']`
- [ ] `communities.archived_at` exists as nullable timestamptz
- [ ] All existing community records have `status = 'active'` and `products = ['stewardship']`

**Verification:**
- [ ] `SELECT status, products FROM communities LIMIT 5;` returns expected defaults
- [ ] Attempting to set `status = 'invalid'` throws constraint violation

**Dependencies:** None (can run in same migration as A-1)

**Files touched:**
- `schema.sql`

---

**Task A-3: Add `user_id`, `avatar_url`, `timezone`, `departed_at` to `members`**  
*Size: S*

Add identity-spec-required columns. `user_id` is nullable initially — it becomes non-null once Clerk is wired (Task A-5).

```sql
ALTER TABLE members
  ADD COLUMN user_id      TEXT,        -- Clerk user ID; nullable until Clerk is wired
  ADD COLUMN avatar_url   TEXT,
  ADD COLUMN timezone     TEXT,        -- IANA tz string e.g. "America/Los_Angeles"
  ADD COLUMN departed_at  TIMESTAMPTZ;

CREATE UNIQUE INDEX idx_members_user_id_org_id ON members(user_id, org_id)
  WHERE user_id IS NOT NULL;
```

**Acceptance criteria:**
- [ ] All four columns exist on `members`
- [ ] `user_id` is nullable
- [ ] Partial unique index on `(user_id, org_id)` prevents duplicate Clerk user in same org
- [ ] Existing member rows have `NULL` for all new columns (expected)

**Verification:**
- [ ] `\d members` shows all four new columns
- [ ] Inserting two members with same `user_id` + `org_id` fails with unique violation

**Dependencies:** None (can run in same migration as A-1, A-2)

**Files touched:**
- `schema.sql`

---

### Checkpoint A-1: Schema is spec-aligned

- [ ] `psql < schema.sql` on fresh DB succeeds
- [ ] Migration script runs on existing DB without errors
- [ ] `community_id` appears nowhere in schema.sql
- [ ] All three new community columns exist
- [ ] All four new member columns exist
- [ ] Review schema with human before proceeding to app layer changes

---

### Phase 2: Application Layer Updates

---

**Task A-4: Update all Drizzle schema definitions and queries to use `org_id`**  
*Size: M*

Update every Drizzle table definition and every query that references `community_id` to use `org_id`.

**Acceptance criteria:**
- [ ] `grep -r "community_id" db/` returns zero results
- [ ] All Drizzle schema objects use `org_id` as the FK column name
- [ ] All queries that filter by organization use `org_id`
- [ ] TypeScript types inferred from Drizzle schema reflect `org_id`

**Verification:**
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `grep -r "community_id" app/ lib/ db/` returns zero results
- [ ] Key queries (list resources, list members, list proposals) return correct data

**Dependencies:** A-1, A-2, A-3

**Files touched:**
- `db/schema.ts` (or equivalent Drizzle schema file)
- All query files in `db/` or `lib/` that reference `community_id`

---

**Task A-5: Wire Clerk `userId` onto Member records**  
*Size: M*

After members sign in via Clerk, persist their Clerk `userId` into `members.user_id`. Update the member lookup logic to work with Clerk identity.

**Acceptance criteria:**
- [ ] On first sign-in after member is linked, `members.user_id` is populated with Clerk user ID
- [ ] API routes that require auth resolve the current member via `user_id` lookup, not session cookie
- [ ] A member whose `user_id` is NULL cannot access protected routes
- [ ] `GET /api/me` returns the correct member record for the authenticated Clerk user

**Verification:**
- [ ] Sign in with a test Clerk account; confirm `members.user_id` is set in DB
- [ ] `GET /api/me` returns `{ id, org_id, display_name, email, status }`
- [ ] Invalid/expired Clerk JWT returns `401`

**Dependencies:** A-3, A-4

**Files touched:**
- `app/api/auth/` or `middleware.ts`
- `lib/auth.ts` or equivalent
- `db/queries/members.ts` or equivalent

---

**Task A-6: Expose canonical `organization` API shape at API layer**  
*Size: S*

The DB table is `communities` internally. API responses should use the spec's field names: `org_id` (not `community_id`), `type` (not `legal_form`), `status`, `products`.

Create a mapper/serializer that translates the DB row to the canonical API shape.

```ts
// lib/serializers/organization.ts
export function toOrganizationResponse(community: DbCommunity): OrganizationResponse {
  return {
    id:          community.id,
    slug:        community.slug,
    name:        community.name,
    type:        mapLegalFormToType(community.legal_form),
    status:      community.status,
    products:    community.products,
    created_at:  community.created_at,
    archived_at: community.archived_at ?? null,
  };
}
```

**Acceptance criteria:**
- [ ] `GET /api/organizations/:id` returns `{ id, slug, name, type, status, products, ... }`
- [ ] Response never exposes `legal_form` or internal field names
- [ ] `type` maps correctly from `legal_form` values

**Verification:**
- [ ] `curl /api/organizations/:id` returns spec-compliant shape
- [ ] `type` field is one of the OrgType enum values from the spec

**Dependencies:** A-4

**Files touched:**
- `lib/serializers/organization.ts` (new)
- `app/api/organizations/[id]/route.ts`

---

### Checkpoint A-2: App layer is spec-aligned

- [ ] `npm run build` succeeds
- [ ] No `community_id` references in application code
- [ ] Clerk auth working: users can sign in, `user_id` populated
- [ ] API returns canonical field names
- [ ] Existing Stewardship features (resource list, maintenance tasks, proposals) still work end-to-end
- [ ] Human review before declaring done

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Missed `community_id` reference in app code | Med — runtime error | grep check in checkpoint A-1 |
| Clerk user_id not matching existing test accounts | Low — dev only | Use fresh test accounts after migration |
| Drizzle type inference breaks after column rename | Low — TS compile error | `npm run build` catches immediately |

## Open Questions

- Should `communities.legal_form` be renamed to `type` in the DB, or kept as-is and mapped at the API layer? (Current plan: keep as `legal_form` internally, map to `type` in serializer)
- Is there existing seed data / `seed.sql` that references `community_id`? If so, update it in the same migration.
