# Implementation Plan: Sensemaking Platform — Phase 1 Build

**Workstream:** C  
**New repo:** `/Users/andrewpennell/Projects/Sensemaking`  
**Against spec:** `shared/IDENTITY_SPEC.md` + `PRD-collective-sensemaking-platform.md`  
**Wireframes:** `/Users/andrewpennell/Projects/CommonCredit/wireframes/`  
**Estimated scope:** Phase 1 MVP — 4–6 weeks  
**Unlocks:** Institutional memory across all three products

---

## Overview

Build the Sensemaking platform from scratch — no existing code. Phase 1 covers Issue Memory & AI Synthesis (PRD Phase 1): organizations can create issues, upload sources, have AI extract claims and themes, review and accept extractions, and view the structured issue workspace.

This plan covers only Phase 1. Deliberation (Phase 2), System Maps (Phase 3), Scenarios (Phase 4), and Monitoring (Phase 5) are out of scope here.

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 App Router | Consistent with other two products |
| Database | Postgres (Neon) | Consistent with others; event-sourcing friendly |
| ORM | Prisma | CommonCredit uses it; better TS experience than Drizzle |
| Auth | Clerk | Stewardship uses it; shared SSO goal |
| Styling | Tailwind CSS | Consistent with wireframe design system |
| AI | Claude API (Anthropic) | All three products committed to this |
| File storage | Vercel Blob or S3 | Source document storage |
| Deployment | Vercel | Standard |

## Architecture Decisions

- Build to the identity spec from day one: `Organization`, `Member` use canonical field names and UUIDs
- All tables include `org_id` as partition key — no global queries
- AI extraction is asynchronous: upload triggers a background job, status polling updates the UI
- Claims, themes, and stakeholder mentions are AI *candidates* until accepted by a human — never auto-published
- Decision records are immutable once finalized — implemented as `finalized_at: DateTime` + `is_finalized: Boolean`; no updates after finalization
- Source documents stored in Blob storage; only metadata + extracted text stored in Postgres

---

## Task List

### Phase 1: Bootstrap & Identity

---

**Task C-1: Initialize Next.js app with full stack**  
*Size: M*

```bash
npx create-next-app@latest sensemaking \
  --typescript --tailwind --app --src-dir \
  --import-alias "@/*"
```

Then add:
- Prisma + Postgres connection
- Clerk auth
- Environment variable structure

**Acceptance criteria:**
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds
- [ ] Clerk sign-in page renders at `/sign-in`
- [ ] Prisma connected to Postgres: `npx prisma db push` succeeds
- [ ] `GET /api/health` returns `{ status: 'ok' }`

**Verification:**
- [ ] All three checks above pass
- [ ] `.env.example` documents all required env vars

**Dependencies:** None

**Files created:**
- Standard Next.js scaffold
- `prisma/schema.prisma`
- `.env.example`
- `app/api/health/route.ts`

---

**Task C-2: Organization + Member models (to identity spec)**  
*Size: M*

Create Prisma models that exactly match `IDENTITY_SPEC.md`.

```prisma
model Organization {
  id          String      @id @default(uuid())
  slug        String      @unique
  name        String
  type        OrgType     @default(INSTITUTION)
  size        OrgSize     @default(SMALL)
  status      OrgStatus   @default(ACTIVE)
  products    String[]    @default(["sensemaking"])
  website     String?
  description String?
  createdAt   DateTime    @default(now())
  archivedAt  DateTime?
  members     Member[]
  issues      Issue[]
  @@index([slug])
}

model Member {
  id          String       @id @default(uuid())
  orgId       String
  userId      String?      // Clerk user ID
  displayName String
  email       String
  bio         String?
  avatarUrl   String?
  timezone    String?
  orgRoles    String[]     @default(["member"])
  status      String       @default("active")
  joinedAt    DateTime     @default(now())
  departedAt  DateTime?
  organization Organization @relation(fields: [orgId], references: [id])
  contributions Contribution[]
  @@unique([orgId, email])
  @@index([orgId])
  @@index([userId])
}
```

**Acceptance criteria:**
- [ ] Both models exist in schema with all spec-required fields
- [ ] `npx prisma migrate dev` succeeds
- [ ] TypeScript types generated cleanly
- [ ] `GET /api/me` resolves current member from Clerk JWT

**Verification:**
- [ ] `npx prisma migrate dev --name init-identity` runs clean
- [ ] Sign in with Clerk, call `/api/me`, get correct member record

**Dependencies:** C-1

**Files touched:**
- `prisma/schema.prisma`
- `lib/auth.ts`
- `app/api/me/route.ts`

---

**Task C-3: Organization onboarding flow**  
*Size: M*

New organizations need to be created and configured. This is the entry point before anything else works.

Screens: Sign up → Create organization → Invite members (skip for now) → Dashboard

**Acceptance criteria:**
- [ ] A new user can sign up via Clerk and create an Organization
- [ ] Organization requires `name`, `slug`, `type`
- [ ] Slug is validated for uniqueness and URL-safety
- [ ] After org creation, user is redirected to their org dashboard
- [ ] User is automatically created as `admin` member of the new org

**Verification:**
- [ ] End-to-end: sign up → create org → land on dashboard
- [ ] Second user with same slug gets validation error

**Dependencies:** C-2

**Files touched:**
- `app/(onboarding)/create-org/page.tsx`
- `app/api/organizations/route.ts`
- `lib/org.ts`

---

### Checkpoint C-1: Identity layer working

- [ ] `npm run build` passes
- [ ] New org creation end-to-end works
- [ ] Clerk auth resolves member on API routes
- [ ] `org_id` present on all DB records
- [ ] Human review before domain models

---

### Phase 2: Issue Domain

---

**Task C-4: Issue model + CRUD API**  
*Size: M*

The Issue is the central object. Start with the basics.

```prisma
model Issue {
  id          String      @id @default(uuid())
  orgId       String
  title       String
  description String?
  status      IssueStatus @default(DRAFT)
  tags        String[]    @default([])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  publishedAt DateTime?
  
  organization Organization @relation(fields: [orgId], references: [id])
  sources      Source[]
  claims       Claim[]
  themes       Theme[]
  stakeholders StakeholderGroup[]
  
  @@index([orgId])
  @@index([orgId, status])
}

enum IssueStatus {
  DRAFT
  ACTIVE
  DELIBERATING
  DECIDED
  MONITORING
  CLOSED
}
```

**Acceptance criteria:**
- [ ] Create, read, update, archive Issue via API
- [ ] Issue is scoped to `orgId` — no cross-org access
- [ ] Status transitions are validated (e.g. can't go DECIDED → DRAFT)
- [ ] `GET /api/issues` returns org's issues sorted by `updatedAt` desc
- [ ] `POST /api/issues` creates issue with current user as creator

**Verification:**
- [ ] CRUD operations work via API
- [ ] `GET /api/issues` with another org's token returns 0 results
- [ ] Status enum enforced

**Dependencies:** C-3

**Files touched:**
- `prisma/schema.prisma`
- `app/api/issues/route.ts`
- `app/api/issues/[id]/route.ts`

---

**Task C-5: Issue Workspace UI**  
*Size: L*

Build the Issue Workspace screen (wireframe: `issue-workspace.html`). This is the hub screen — stat cards, issue description, navigation to sub-sections.

Start with the Overview tab only. Sources, Themes, Claims tabs are built in later tasks.

**Acceptance criteria:**
- [ ] `/org/[slug]/issues/[id]` renders the issue workspace
- [ ] Shows title, description, status badge
- [ ] Shows stat cards: claims count, stakeholder count, active conflicts, missing voices
- [ ] Left nav renders with correct section labels and counts
- [ ] Edit issue title/description inline
- [ ] Status pill updates on change

**Verification:**
- [ ] Load issue workspace for a seeded issue; all sections render
- [ ] Edit title; confirm persisted on reload

**Dependencies:** C-4

**Files touched:**
- `app/(app)/org/[slug]/issues/[id]/page.tsx`
- `components/issue/IssueWorkspace.tsx`
- `components/issue/IssueNav.tsx`
- `components/issue/StatCards.tsx`

---

### Checkpoint C-2: Issue workspace renders

- [ ] `npm run build` passes
- [ ] Issue workspace loads for a real issue
- [ ] Nav, stat cards, description edit all work
- [ ] Human review

---

### Phase 3: Source Ingestion

---

**Task C-6: Source model + file upload**  
*Size: M*

Sources are the raw inputs. Support PDF, DOCX, TXT, CSV upload.

```prisma
model Source {
  id              String       @id @default(uuid())
  orgId           String
  issueId         String
  title           String
  sourceType      SourceType
  fileUrl         String?      // Blob storage URL
  rawText         String?      // Extracted text for AI processing
  credibilityRating Int        @default(3)
  uploadedById    String       // Member.id
  status          SourceStatus @default(UPLOADED)
  processedAt     DateTime?
  createdAt       DateTime     @default(now())
  
  issue  Issue   @relation(fields: [issueId], references: [id])
  claims Claim[]
  themes Theme[]
  
  @@index([orgId])
  @@index([issueId])
}

enum SourceType {
  PDF
  TRANSCRIPT
  SURVEY
  DATASET
  WEB_ARTICLE
  INTERVIEW
  OTHER
}

enum SourceStatus {
  UPLOADED
  PROCESSING
  PROCESSED
  FAILED
}
```

File upload flow:
1. Client uploads to `POST /api/sources/upload` (multipart)
2. Server stores in Vercel Blob, creates Source record with `status: UPLOADED`
3. Returns source ID + signed URL

**Acceptance criteria:**
- [ ] PDF/DOCX/TXT/CSV upload succeeds up to 20MB
- [ ] Source record created with correct metadata
- [ ] File accessible via signed URL
- [ ] `GET /api/issues/[id]/sources` returns issue's sources

**Verification:**
- [ ] Upload a PDF; confirm source record in DB; confirm file accessible via URL
- [ ] Upload a 25MB file; get 413 error

**Dependencies:** C-5

**Files touched:**
- `prisma/schema.prisma`
- `app/api/sources/upload/route.ts`
- `app/api/issues/[id]/sources/route.ts`
- `lib/storage.ts`

---

**Task C-7: Source list UI in Issue Workspace**  
*Size: M*

The Sources tab in the Issue Workspace. Upload zone + source list with metadata. Matches `issue-workspace.html` Sources panel.

**Acceptance criteria:**
- [ ] Sources tab shows all sources for the issue
- [ ] File type icon, title, upload date, status badge
- [ ] Drag-and-drop upload zone
- [ ] Processing status shows spinner while `status: PROCESSING`
- [ ] Upload adds source to list without page reload

**Verification:**
- [ ] Upload a PDF; it appears in the list immediately with spinner
- [ ] After processing, spinner disappears and claim/theme counts show

**Dependencies:** C-6

**Files touched:**
- `components/issue/SourcesPanel.tsx`
- `components/sources/UploadZone.tsx`
- `components/sources/SourceCard.tsx`

---

**Task C-8: AI extraction — extract claims and themes from source**  
*Size: L*

After a source is uploaded, trigger AI extraction via Claude API. Extract claims (typed assertions) and themes (content clusters) as candidates. Nothing is accepted automatically — all outputs are candidates for human review.

Extraction prompt structure:
```
Given this source text, extract:
1. Claims: typed assertions (Fact/Causal/Value/Assumption/Preference), each with:
   - claim text
   - type
   - confidence (high/medium/low)  
   - supporting quote from the source
   - source passage location

2. Themes: content clusters, each with:
   - theme name
   - description
   - representative quote
   - signal strength (strong/moderate/weak)
   - claim count estimate
```

```prisma
model Claim {
  id           String      @id @default(uuid())
  orgId        String
  issueId      String
  sourceId     String?
  text         String
  type         ClaimType
  confidence   Float       @default(0.5)
  sourceQuote  String?
  reviewStatus ReviewStatus @default(PENDING)
  acceptedById String?
  acceptedAt   DateTime?
  rejectedAt   DateTime?
  createdAt    DateTime    @default(now())
  
  issue  Issue  @relation(fields: [issueId], references: [id])
  source Source? @relation(fields: [sourceId], references: [id])
  
  @@index([orgId])
  @@index([issueId])
  @@index([issueId, reviewStatus])
}

enum ClaimType { FACT CAUSAL VALUE ASSUMPTION PREFERENCE }
enum ReviewStatus { PENDING ACCEPTED REJECTED }
```

Extraction is async: 
- `POST /api/sources/[id]/process` triggers extraction (returns 202)
- Source status → `PROCESSING`
- Background: call Claude, parse response, insert Claim/Theme candidates
- Source status → `PROCESSED`
- Client polls `GET /api/sources/[id]/status` or uses SSE

**Acceptance criteria:**
- [ ] `POST /api/sources/[id]/process` starts extraction and returns 202
- [ ] Claude API called with source text; response parsed into Claim + Theme records
- [ ] All extracted records have `reviewStatus: PENDING`
- [ ] Source status updated to `PROCESSED` when complete
- [ ] If Claude fails, source status → `FAILED`, error logged

**Verification:**
- [ ] Upload a real PDF; trigger process; wait; confirm Claim records created with `reviewStatus: PENDING`
- [ ] Confirm no Claim has `reviewStatus: ACCEPTED` without human action
- [ ] Check Claude API call is using prompt caching for long documents

**Dependencies:** C-7

**Files touched:**
- `prisma/schema.prisma` (Claim, Theme models)
- `app/api/sources/[id]/process/route.ts`
- `lib/ai/extract.ts`
- `lib/ai/prompts/extraction.ts`

---

**Task C-9: Extraction review UI**  
*Size: L*

The source import review screen (wireframe: `source-import.html`). Humans accept, edit, or reject AI-extracted claims one by one.

**Acceptance criteria:**
- [ ] Review screen shows all PENDING claims for a source
- [ ] Each claim shows: type badge, text, confidence pill, source quote
- [ ] Accept button → `reviewStatus: ACCEPTED`, green left border
- [ ] Reject button → `reviewStatus: REJECTED`, muted + strikethrough
- [ ] Edit mode: editable textarea, "Accept edited" saves modified text
- [ ] Low-confidence claims show inline AI warning
- [ ] Progress bar: "X of Y claims reviewed"
- [ ] Bulk actions: "Accept all high-confidence", "Reject all low-confidence"
- [ ] "Finish review" button navigates back to Issue Workspace

**Verification:**
- [ ] Review flow: accept 3, reject 1, edit and accept 1 — confirm DB state correct
- [ ] Reload page; reviewed state persists
- [ ] Bulk accept 5 high-confidence claims; confirm all ACCEPTED

**Dependencies:** C-8

**Files touched:**
- `app/(app)/org/[slug]/sources/[id]/review/page.tsx`
- `components/extraction/ClaimReviewCard.tsx`
- `components/extraction/ExtractionProgress.tsx`
- `app/api/claims/[id]/route.ts` (accept/reject/edit)

---

### Checkpoint C-3: Source pipeline end-to-end

- [ ] Upload → Process → Review → Accept complete flow works
- [ ] Accepted claims appear in issue workspace claim count
- [ ] Rejected claims do not appear in workspace
- [ ] `npm run build` passes
- [ ] Human review of full source pipeline

---

### Phase 4: Claims Workspace

---

**Task C-10: Claims panel in Issue Workspace**  
*Size: M*

Show accepted claims in the Claims tab of the Issue Workspace. Filterable by type, contestable.

**Acceptance criteria:**
- [ ] Claims tab shows all ACCEPTED claims for the issue
- [ ] Filter chips: All / Fact / Causal / Value / Assumption / Contested
- [ ] Each claim shows: type badge, text, source, claim type, "Evidence" button
- [ ] Contested claims have red left border
- [ ] "Contest" button marks claim as contested (creates a conflict record)
- [ ] Claim count in left nav updates correctly

**Verification:**
- [ ] Filter by "Causal" — only causal claims show
- [ ] Contest a claim — left border turns red, count updates

**Dependencies:** C-9

**Files touched:**
- `components/issue/ClaimsPanel.tsx`
- `components/claims/ClaimCard.tsx`
- `app/api/claims/[id]/contest/route.ts`

---

**Task C-11: Stakeholder Groups model + UI**  
*Size: M*

Stakeholders are named groups with power/affectedness levels. AI can suggest them from source mentions; humans create and manage them.

```prisma
model StakeholderGroup {
  id              String @id @default(uuid())
  orgId           String
  issueId         String
  name            String
  type            String
  powerLevel      String @default("medium")
  affectednessLevel String @default("medium")
  isMissingVoice  Boolean @default(false)
  createdAt       DateTime @default(now())
  
  issue Issue @relation(fields: [issueId], references: [id])
  @@index([issueId])
}
```

**Acceptance criteria:**
- [ ] Stakeholders tab shows all groups for the issue
- [ ] Create new group with name, type, power/affectedness levels
- [ ] "Flag as missing voice" toggles `isMissingVoice`
- [ ] Missing voice groups show warning banner
- [ ] Stakeholder count in nav updates

**Verification:**
- [ ] Create 3 stakeholder groups; they appear in the tab
- [ ] Flag one as missing; banner appears; count in stat card updates

**Dependencies:** C-10

**Files touched:**
- `prisma/schema.prisma`
- `components/issue/StakeholdersPanel.tsx`
- `app/api/issues/[id]/stakeholders/route.ts`

---

### Checkpoint C-4: Issue Workspace feature-complete for Phase 1

- [ ] All 5 Issue Workspace tabs work (Overview, Sources, Themes, Claims, Stakeholders)
- [ ] Source upload → AI extraction → human review → accepted claims in workspace
- [ ] Stat cards (claims, stakeholders, conflicts, missing voices) accurate
- [ ] `npm run build` passes
- [ ] Full demo run-through with seeded data
- [ ] Human sign-off — Phase 1 complete

---

### Phase 5: Org Overview + Navigation

---

**Task C-12: Org Overview screen**  
*Size: M*

The entry point when a user logs in (wireframe: `org-overview.html`). Issue list with status, stat cards, recent activity.

**Acceptance criteria:**
- [ ] `/org/[slug]` shows org overview
- [ ] Stat cards: issues, claims, decisions, missing voices
- [ ] Issue grid with status badges, progress bars, member avatars
- [ ] "New Issue" creates and navigates to the new issue
- [ ] Recent activity feed (last 20 events: sources uploaded, claims accepted, etc.)

**Verification:**
- [ ] 3 seeded issues show in grid with correct status badges
- [ ] "New Issue" flow works end-to-end

**Dependencies:** C-11

**Files touched:**
- `app/(app)/org/[slug]/page.tsx`
- `components/org/IssueGrid.tsx`
- `components/org/ActivityFeed.tsx`

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Claude API latency for large PDFs | High — poor UX | Async processing with polling; show spinner; set 5min timeout |
| Claude extraction quality varies by document type | Med | Tune prompts per source type; human review is the safety net |
| Vercel Blob size limits | Low | 500MB per file on Pro plan; enforce 20MB limit in UI |
| PDF text extraction quality (scanned docs) | Med | Use a PDF parsing library (pdf-parse); flag scanned docs as low-confidence |
| Prisma migration conflicts with schema iteration | Low | Keep migrations granular; never edit committed migrations |

## Open Questions

- Should extraction run synchronously (for small documents) or always async? (Recommendation: always async for consistent UX)
- What model to use for extraction: Haiku (fast/cheap) or Sonnet (better quality)? (Recommendation: Sonnet for better claim quality; revisit with cost data)
- Is the repo at `/Users/andrewpennell/Projects/Sensemaking` or should it be named differently?
- Will Sensemaking share the same Vercel project as the others, or separate deployments?
