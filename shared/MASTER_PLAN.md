# Master Plan — Three-Product Parallel Build

**Products:** CommonCredit · Stewardship · Sensemaking  
**Date:** June 2026  
**Strategy:** Three parallel workstreams, converging at the identity layer

---

## The Three Workstreams

| Workstream | Product | Focus | Plan file |
|---|---|---|---|
| A | Stewardship | Identity spec migrations | `PLAN_STEWARDSHIP_MIGRATIONS.md` |
| B | CommonCredit | Multi-tenancy sprint | `PLAN_COMMONCREDIT_MULTITENANCY.md` |
| C | Sensemaking | Phase 1 build from scratch | `PLAN_SENSEMAKING_BUILD.md` |

---

## Dependency Graph

```
IDENTITY_SPEC.md (done)
        │
   ┌────┴──────────────────────┐
   │                           │                    
   ▼                           ▼                    
Workstream A               Workstream C            
(Stewardship migrations)   (Sensemaking build)     
   │                           │                    
   │ ← can run in parallel →   │                    
   │                           │                    
Workstream B                   │                    
(CC multi-tenancy)             │                    
   │                           │                    
   └─────────────┬─────────────┘                    
                 │                                  
         SYNC POINT 1:                              
    All three have org_id                           
    All three have Clerk user_id                    
                 │                                  
         Shared Auth (SSO)                          
                 │                                  
         SYNC POINT 2:                              
    Cross-product domain events                     
                 │                                  
         Community OS positioning                   
```

---

## Parallelization Rules

**Safe to run in parallel (no coordination needed):**
- Workstream A and Workstream B (different repos, no shared code)
- Workstream C bootstrap (C-1 through C-3) while A and B run
- Workstream C domain build (C-4 onwards) is fully independent of A and B

**Must be sequential within each workstream:**
- Each workstream's tasks must run in order (foundation before feature)

**Needs coordination (define before parallelizing):**
- Clerk configuration: agree on whether all three share one Clerk instance or separate instances before any product wires Clerk
- Event schema: agree on the canonical event shapes (already in `IDENTITY_SPEC.md`) before any product starts emitting events

---

## Sync Points

### Sync Point 1 — All Three at Identity Spec

**Condition:** Each product has:
- `org_id` on all records
- `user_id` (Clerk) on Member
- `Organization.status` and `Organization.products[]`

**Who is blocked:** Nobody is blocked here — all three can proceed without waiting. This is a convergence checkpoint, not a gate.

**What becomes possible after:** Shared auth (SSO). A user logged into Sensemaking can present the same JWT to Stewardship without re-authenticating.

**Estimated arrival:** Workstream A ~1 week, B ~2 weeks, C ~1 week (C builds to spec from day one)

---

### Sync Point 2 — Cross-Product Domain Events

**Condition:** At least two products are live and want to react to each other's events.

**Who initiates:** Likely Stewardship first (a governance decision → needs to propagate to CommonCredit credit policy in Phase 3).

**What's needed:**
- An event bus (Postgres `events` table + polling, or a lightweight queue)
- Both products reading from `IDENTITY_SPEC.md` event envelope
- At minimum: `governance.decision.recorded` and `org.member.joined`

**Estimated arrival:** 2–3 months after Sync Point 1

---

## Task Summary — All Workstreams

### Workstream A: Stewardship Migrations

| Task | Description | Size | Depends on |
|---|---|---|---|
| A-1 | Rename `community_id` → `org_id` everywhere | M | — |
| A-2 | Add `status`, `products[]`, `archived_at` to communities | S | — |
| A-3 | Add `user_id`, `avatar_url`, `timezone`, `departed_at` to members | S | — |
| **Checkpoint A-1** | Schema is spec-aligned | | A-1, A-2, A-3 |
| A-4 | Update Drizzle schema + queries to use `org_id` | M | A-1 |
| A-5 | Wire Clerk `userId` onto Member records | M | A-3, A-4 |
| A-6 | Expose canonical `organization` shape at API layer | S | A-4 |
| **Checkpoint A-2** | App layer spec-aligned | | A-4, A-5, A-6 |

**Total estimated:** 3–5 days

---

### Workstream B: CommonCredit Multi-tenancy

| Task | Description | Size | Depends on |
|---|---|---|---|
| B-1 | Add `Organization` model to Prisma | M | — |
| B-2 | Add `orgId`, `userId`, `displayName`, `departedAt` to Member | M | B-1 |
| B-3 | Migrate existing data into default Organization | S | B-2 |
| **Checkpoint B-1** | Foundation complete | | B-1, B-2, B-3 |
| B-4 | Scope all read queries to `orgId` | L | B-3 |
| B-5 | Wire Clerk auth — resolve Member from JWT | M | B-4 |
| **Checkpoint B-2** | Multi-tenancy enforced | | B-4, B-5 |
| B-6 | Add Organization CRUD API | M | B-5 |
| B-7 | Update Member API to canonical shape | S | B-5 |
| **Checkpoint B-3** | API spec-compliant | | B-6, B-7 |

**Total estimated:** 5–8 days

---

### Workstream C: Sensemaking Phase 1 Build

| Task | Description | Size | Depends on |
|---|---|---|---|
| C-1 | Bootstrap Next.js app | M | — |
| C-2 | Organization + Member models to spec | M | C-1 |
| C-3 | Org creation onboarding flow | M | C-2 |
| **Checkpoint C-1** | Identity layer working | | C-1, C-2, C-3 |
| C-4 | Issue model + CRUD API | M | C-3 |
| C-5 | Issue Workspace UI (Overview tab) | L | C-4 |
| **Checkpoint C-2** | Issue workspace renders | | C-4, C-5 |
| C-6 | Source model + file upload | M | C-5 |
| C-7 | Sources tab UI | M | C-6 |
| C-8 | AI extraction (Claude API) | L | C-7 |
| C-9 | Extraction review UI | L | C-8 |
| **Checkpoint C-3** | Source pipeline end-to-end | | C-6 through C-9 |
| C-10 | Claims panel in Issue Workspace | M | C-9 |
| C-11 | Stakeholder Groups model + UI | M | C-10 |
| **Checkpoint C-4** | Issue Workspace Phase 1 complete | | C-10, C-11 |
| C-12 | Org Overview screen | M | C-11 |

**Total estimated:** 4–6 weeks

---

## Suggested Execution Order

Given single developer, here is the recommended sequence to make fastest visible progress while avoiding rework:

```
Week 1:
  → A-1, A-2, A-3 (Stewardship rename + column additions — low risk, high value)
  → C-1, C-2 (Sensemaking bootstrap — parallel, different repo)

Week 2:
  → A-4, A-5, A-6 (Stewardship app layer + Clerk)
  → B-1, B-2, B-3 (CommonCredit Organization model + data migration)
  → C-3, C-4 (Sensemaking org onboarding + Issue model)

Week 3:
  → B-4, B-5 (CommonCredit query scoping + Clerk — most complex)
  → C-5, C-6 (Sensemaking Issue Workspace + Source upload)

Week 4:
  → B-6, B-7 (CommonCredit API canonical shapes — done with B)
  → C-7, C-8 (Sensemaking Sources tab + AI extraction)

Week 5:
  → C-9, C-10 (Sensemaking extraction review + Claims panel)

Week 6:
  → C-11, C-12 (Sensemaking Stakeholders + Org Overview — Phase 1 complete)
```

---

## Definition of "Phase 1 Done"

All three products have reached Phase 1 complete when:

**Stewardship:** `community_id` fully renamed, Clerk wired, canonical API shapes exposed. No new features needed — just spec alignment.

**CommonCredit:** `Organization` table exists, all records have `orgId`, Clerk auth working, API returns spec field names. Existing features (transactions, offers, balances) unchanged and still working.

**Sensemaking:** Organizations can create issues, upload sources, trigger AI extraction, review and accept claims, manage stakeholders, and view the Issue Workspace. The full source-to-claim pipeline is end-to-end working.

---

## What We Don't Build in Phase 1

Explicitly deferred:
- Cross-product event bus (Sync Point 2)
- Shared SSO UI (each product has its own Clerk sign-in; SSO works via JWT, not shared login page)
- Governance module (CommonCredit Phase 3, Stewardship already has it, Sensemaking Phase 2)
- Sensemaking Deliberation Room (Phase 2 of Sensemaking build)
- System Maps, Scenarios, Monitoring (Sensemaking Phases 3–5)
- CommonCredit governance/treasury (Phase 3)
