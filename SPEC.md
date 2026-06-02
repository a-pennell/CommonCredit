# CommonCredit — Product & Engineering Spec

> **Version:** 0.2 — June 2026  
> **Status:** Decisions recorded — ready for implementation planning  
> **Scope:** Full 5-phase product vision + Phase 1 engineering spec

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem Statement](#2-problem-statement)
3. [User Personas](#3-user-personas)
4. [Product Principles](#4-product-principles)
5. [Feature Roadmap — All 5 Phases](#5-feature-roadmap)
6. [Phase 1 Acceptance Criteria (MVP)](#6-phase-1-acceptance-criteria)
7. [Key Transaction Flows](#7-key-transaction-flows)
8. [Data Model](#8-data-model)
9. [Engineering Spec](#9-engineering-spec)
10. [Project Structure](#10-project-structure)
11. [Code Style](#11-code-style)
12. [Testing Strategy](#12-testing-strategy)
13. [Demo Seed Data](#13-demo-seed-data)
14. [Business Model](#14-business-model)
15. [Risk Register](#15-risk-register)
16. [Boundaries](#16-boundaries)
17. [Success Criteria by Phase](#17-success-criteria-by-phase)
18. [Open Questions](#18-open-questions)

---

## 1. Product Vision

**CommonCredit** is a democratically governed mutual credit platform that lets communities trade with each other using internally created credit — without waiting for banks, investors, or state currency liquidity.

It is not a wallet. It is not a token. It is not a crypto product.

It is a **cooperative accounting institution**: a shared ledger governed by its members, where purchasing power is created through the act of exchange itself. When Member A provides a service to Member B, A goes positive and B goes negative — the network always sums to zero.

**Tagline:** Trade with trusted local members using cooperative credit. Get new customers, conserve cash, keep value circulating locally.

**Long-term vision:** A Community Operating System — where exchange, governance, shared resources, ownership, project coordination, and collective learning reinforce each other.

---

## 2. Problem Statement

### The Coordination Failure

Communities routinely have:
- Unmet needs (childcare, repair, bookkeeping, food, design, transport)
- Unused productive capacity (spare hours, empty rooms, idle tools, skills going unleveraged)
- Local businesses needing customers
- Freelancers needing clients
- Co-ops needing suppliers

Exchange fails **not** because the capacity is missing. It fails because everyone is short of state money.

Traditional capitalism routes access to exchange through bank credit (requires collateral, credit score, investor upside), wages (requires employment), grants (requires donors), and external investment (requires ceding control). This makes communities dependent on institutions they do not govern.

### What Mutual Credit Changes

Mutual credit creates purchasing power **inside** the community, against its own capacity to reciprocate.

- Credit is not created by a bank expecting profit — it is created because the community recognizes a member's capacity to contribute back
- Negative balances are not moral failure — they are permission to receive now and produce later
- The network disciplines itself through reciprocal production, not debt enforcement

### Why This Moment

- Post-pandemic mutual aid networks have demonstrated community trust infrastructure
- Cooperative and solidarity economy ecosystems are expanding
- Modern software makes governing a distributed ledger routine (no blockchain needed)
- AI can augment matching, risk detection, and deliberation without replacing governance

---

## 3. User Personas

### 3.1 The Independent Service Provider ("Sofia")
- Massage therapist, web designer, copywriter, bookkeeper, yoga teacher, photographer
- Has spare capacity: unfilled appointment slots, unused studio time
- Needs: design work, accounting help, office supplies, food, childcare
- Cash-poor but skill-rich
- Pain: finding trusted local service providers; paying for business expenses she can't afford
- CommonCredit value: fills unused capacity with new clients; pays for services she needs without burning cash

### 3.2 The Local Business Owner ("Marcus")
- Café owner, repair shop, food producer, coworking space
- Has inventory, space, and capacity that goes unsold
- Needs: marketing, web, cleaning, bookkeeping, supplies from other local producers
- Cash-flow constrained, especially in slow seasons
- CommonCredit value: moves unsold capacity; buys locally without depleting cash reserves

### 3.3 The Cooperative ("Tierra")
- Worker co-op, housing co-op, food co-op, community land trust
- Needs: accounting, legal, maintenance, food, transport, admin
- Wants to transact within an aligned ecosystem rather than extractive platforms
- CommonCredit value: co-op-to-co-op exchange; reduce cash outflows; contribute to shared treasury

### 3.4 The Community Anchor ("Director Reyes")
- Nonprofit director, neighborhood association lead, community foundation program officer
- Wants to support local resilience and track community economic health
- May procure locally using credits as a policy choice
- CommonCredit value: local procurement tool; community wealth data; participatory budgeting infrastructure

### 3.5 The Network Administrator ("Admin")
- Runs onboarding, approvals, credit limits, disputes, reporting
- Acts as trade broker in Phase 1
- Needs: full ledger view, member management, dispute workflow, export tools
- CommonCredit value: a single dashboard to govern the network with integrity

---

## 4. Product Principles

These are not slogans. They are design constraints that govern every feature decision.

1. **Institution, not app.** Every UI decision should ask: does this build or erode the community's capacity to govern itself?

2. **Ledger as ground truth.** No balance is ever implied, estimated, or cached without reconciliation against the double-entry ledger.

3. **Transparency by default.** Network health metrics are public. Member balances are visible to admins and to the member. Governance decisions are recorded and referenceable.

4. **Consent-based governance.** Credit limit changes, rule changes, and treasury allocations require a documented process — not unilateral admin action.

5. **AI assists, humans decide.** AI may suggest matches, flag risks, and draft proposals. It may not deny credit, resolve disputes, or suppress member voice.

6. **No extractive design.** No ads. No data sales. No take-rate maximization. No lock-in. No speculative tokenization.

7. **Plain language.** Say "member credit" not "complementary currency." Say "your account is in debit" not "your balance is negative." Say "your credit limit" not "your line." Test every label on a first-time user.

8. **Demo-ready before day one.** The system must run with realistic seed data so it can be shown to a prospective community before a single real member signs up.

---

## 5. Feature Roadmap

### Phase 0: Institutional Design (Pre-software)
*Not a software phase. Prerequisites before any code ships.*

| Deliverable | Description |
|---|---|
| Legal structure | Cooperative articles, multi-stakeholder bylaws |
| Membership agreement | Rights, obligations, credit policy, dispute policy |
| Tax guidance | IRS barter exchange reporting context; accountant review |
| Governance charter | Proposal process, voting thresholds, recall mechanisms |
| Pilot community selection | 20–40 founding members with credible offers and real unmet needs |
| Supply/demand map | Inventory of local capacity and gaps before building anything |

**Gate:** 20–40 founding members signed on, supply/demand map complete.

---

### Phase 1: Concierge MVP
*Human trade broker + admin-managed ledger. Build trust before building features.*

**Core features:**

| Module | Features |
|---|---|
| Member registry | Application form, admin approval, profile, credit/debit limits, status |
| Marketplace | Offers directory, wants/needs listings, category search, availability |
| Ledger | Account balance, credit/debit limits, manual transaction posting (admin), transaction history |
| Invoicing | Invoice creation, approval, credit posting, receipt, CSV export |
| Reputation | Post-transaction rating (basic), endorsements between members |
| Admin dashboard | Full ledger view, member management, transaction queue, monthly statement generation |
| Reporting | Member statement, network totals, CSV export |
| Notifications | Email on transaction, invoice, statement |
| Dispute | Flag a transaction, admin-reviewed |

**Not in Phase 1:**
- Self-service transactions (admin posts all)
- Governance/voting
- Treasury
- Projects
- AI features
- Stripe (membership dues collected offline or via simple link)
- Mobile app

---

### Phase 2: Self-Service Network
*Members transact themselves. Trust infrastructure hardens.*

| Module | New features |
|---|---|
| Transactions | Self-service send/request flow with confirmation step |
| Credit limits | Member-initiated limit increase request + admin review workflow |
| Onboarding | Guided first-transaction assistant; "your first 10 transactions" campaign |
| Reputation | Multi-dimensional ratings (reliability, quality, timeliness, reciprocity); endorsement graph |
| Disputes | Member-initiated dispute; structured evidence submission; admin mediation workflow |
| Notifications | In-app + email; configurable preferences |
| Reporting | Network health dashboard (velocity, concentration, active members, unmet demand) |
| Blended payments | Record transactions with both credit and cash components |
| Accounting exports | QuickBooks-compatible CSV/OFX; taxable value estimates |

---

### Phase 3: Governance and Treasury
*Members vote on rules. Shared treasury funds commons projects.*

| Module | New features |
|---|---|
| Proposals | Create, edit, publish proposal; rich text body; supporting documents |
| Voting | One-member-one-vote; configurable quorum/threshold; voting deadline; tally + record |
| Credit policy | Governance-approved credit limit bands; voted rule changes |
| Dispute committee | Elected panel; structured case workflow; decision record; appeal path |
| Treasury | Network treasury account; credit + cash balance; inflow/outflow ledger |
| Treasury allocations | Governance-approved allocation to commons projects or solidarity fund |
| Participatory budgeting | Members submit spending proposals; ranked choice or consent voting |
| Network health dashboard | Public-facing; velocity, reciprocity health, supply gaps, commons contributions |

---

### Phase 4: AI-Assisted Coordination
*AI augments member governance. It does not replace it. Vendor: Claude API (Anthropic). No member transaction data used for model training.*

| AI feature | What it does | What it never does |
|---|---|---|
| Offer/need matching | Surfaces relevant offers to members with unmet needs | Auto-complete transactions |
| Circular trade paths | "These 3 members could form a trade loop" | Require members to accept |
| Risk detection | Flags concentration, velocity anomalies, stagnant balances | Auto-suspend members |
| Proposal assistant | Drafts proposal text from member notes | Block or filter proposals |
| Onboarding assistant | Guides new members through setup; explains credit | Make credit decisions |
| Network gap analysis | "The network lacks bookkeeping; here are 3 members who could offer it" | Auto-recruit |
| Monthly report | "State of the network" narrative auto-generated for governance | Replace governance meeting |
| Matching assistant | Surfaces the right answer to "Who can help me with X?" | Replace reputation system |

---

### Phase 5: Federation
*Local networks interoperate. Regional supply chains emerge.*

| Module | Features |
|---|---|
| Network identity | Stable network ID; public profile; governance charter published |
| Inter-network clearing | Credits transferred between federated networks at agreed exchange rates |
| Reputation portability | Verified reputation travels with a member across networks |
| Shared procurement | Multi-network buying pools for collective purchasing power |
| API | Public API for third-party integrations (accounting, logistics, membership systems) |
| Governance federation | Network-to-network governance agreements; shared standards body |
| Regional treasury | Cross-network solidarity fund; shared project finance |

---

## 6. Phase 1 Acceptance Criteria

These are the testable conditions that define Phase 1 as complete.

### Member Registry
- [ ] An applicant can submit a membership application with name, email, type (individual/business/co-op), bio, and at least one offer
- [ ] Admin can approve or reject applications with a note
- [ ] Approved members receive a welcome email with login instructions
- [ ] Each member has a unique account with a credit limit (default: +500 credits), debit limit (default: -200 credits), and opening balance of 0
- [ ] Admin can adjust credit/debit limits with a logged reason
- [ ] Credit limit increase requests are reviewed by the founding Credit Committee (3–5 elected founding members + admin); decision and rationale are logged and visible to the requesting member

### Marketplace
- [ ] Members can create offers (title, category, description, price in credits, availability, service area)
- [ ] Members can create needs/wants (title, category, urgency, description)
- [ ] Offers are browseable by category and keyword
- [ ] A member can view another member's profile, offers, and public reputation

### Ledger
- [ ] Every transaction creates two ledger entries (debit payer, credit payee) — double-entry, no exceptions
- [ ] The network balance always sums to zero — enforced at the database level
- [ ] Admin can post a transaction on behalf of two members with a description and amount
- [ ] A transaction cannot be posted if it would take the payer below their debit limit
- [ ] Transaction history is immutable — no deletes, only reversals with a logged reason

### Invoicing
- [ ] A member can create an invoice to another member (credit amount, optional cash amount, description, due date)
- [ ] The recipient can approve or reject the invoice with a note
- [ ] Approved invoices post automatically to the ledger
- [ ] All invoices and receipts are exportable as CSV

### Reputation
- [ ] After a completed transaction, both parties receive a prompt to leave a rating (1–5 stars + optional comment)
- [ ] A member can endorse another member (free text, visible on profile)
- [ ] Ratings are visible on member profiles

### Admin Dashboard
- [ ] Admin can see all accounts with current balances, credit limits, and status
- [ ] Admin can see all transactions with filter by date, member, amount, and status
- [ ] Admin can generate a monthly statement PDF/CSV for any member
- [ ] Admin can flag a dispute on any transaction

### Reporting
- [ ] Network summary: total members, total transactions, total volume, active members (last 30 days), average balance, most positive/negative accounts
- [ ] All data exportable as CSV

### Notifications
- [ ] Members receive email on: transaction confirmed, invoice received, invoice approved/rejected, monthly statement available
- [ ] Admin receives email on: new application, dispute flagged

---

## 7. Key Transaction Flows

### Flow 1: Simple Trade (Phase 1, Admin-Mediated)

```
Member A (buyer) finds Member B's offer
  → A contacts B via platform message or email
  → B agrees to provide service
  → Service delivered
  → A confirms delivery to admin (or B invoices A)
  → Admin posts transaction: A –100 credits, B +100 credits
  → Both parties receive confirmation email
  → Reputation prompt sent to both
```

### Flow 2: Invoice (Phase 1)

```
Member B creates invoice → Member A
  → A receives email notification
  → A reviews invoice in dashboard
  → A approves invoice
  → System checks: will this take A below debit limit?
    → Yes: post declined, admin notified
    → No: ledger updated, receipt generated
  → Both parties receive email with receipt
  → Invoice marked "Paid"
```

### Flow 3: Self-Service Transaction (Phase 2)

```
Member A opens "Send Credits" flow
  → Selects Member B
  → Enters amount, description, optional attachment
  → System previews: "Your balance will change from X to Y"
  → A confirms
  → System creates escrow hold on A's account
  → B receives notification: "Payment pending your confirmation"
  → B confirms (or disputes within 48 hours)
  → Hold released; ledger updated
  → Reputation prompt
```

### Flow 4: Blended Payment (Phase 2)

```
Carpenter accepts 60% credits / 40% cash
  → Creates invoice with:
      credit_amount: 240
      cash_amount: 160
      taxable_value: 400
      description: "Kitchen shelf installation"
  → Buyer approves
  → Credit component posts to ledger
  → Cash component recorded as memo (no ledger entry)
  → Combined receipt generated for both parties' accounting
```

### Flow 5: Credit Limit Increase (Phase 2)

```
Member submits request: "I'd like to increase my debit limit from 200 to 500"
  → Member provides context: trade history, new service launch, repayment plan
  → Admin reviews:
      - Transaction history (velocity, reciprocity, last 6 months)
      - Current balance
      - Offers available and quality
      - Endorsements
  → Admin approves/denies with explanation
  → Decision logged with reason
  → Member notified with plain-language explanation
```

### Flow 6: Project Pool (Phase 3)

```
Community member proposes "Repair the community kitchen"
  → Proposal published with budget: 2,000 credits from treasury
  → Members vote (quorum: 30%, pass: 60% yes)
  → Proposal passes → Treasury allocation created
  → Project created with task list
  → Members claim tasks: "I'll do electrical (200 credits)"
  → Admin or committee verifies completion
  → Treasury releases credits to contributor
  → Commons resource record updated: "Kitchen — maintained by commons"
```

### Flow 7: Governance Vote (Phase 3)

```
Proposal: "Increase default debit limit from 200 to 300 credits"
  → Proposer submits with rationale
  → 7-day comment period
  → Voting opens for 14 days
  → Each member: one vote (yes / no / abstain)
  → Tally at deadline: quorum met (35%), 70% yes
  → Decision enacted: new default debit limit = 300
  → Rule change logged in governance history
  → Members notified
```

---

## 8. Data Model

See entity relationship model in the original institutional brief. Key design decisions:

### Double-Entry Ledger Invariant
Every `Transaction` produces exactly two `LedgerEntry` rows:
- One debit (payer account)
- One credit (payee account)
- Sum of all ledger entries across all accounts = 0 (enforced by constraint)

### Credit vs. Debit Limits
- `credit_limit`: maximum positive balance allowed (guards concentration of credit)
- `debit_limit`: maximum negative balance allowed (guards default risk)
- Default Phase 1 values: credit_limit = +500, debit_limit = -200
- Both are adjustable by admin with logged reason

### Units
Phase 1: one unit = one CommonCredit (CC), roughly pegged to USD for pricing simplicity but **not convertible to USD**. The unit's value is determined by the community in governance.

### Blended Payments
`Transaction` has both `credit_amount` and `cash_amount` fields. Only `credit_amount` posts to the ledger. `cash_amount` is a memo field for accounting export and tax records.

### Taxable Value Tracking (decided: track from day one)
Since 1 CC = 1 USD, every transaction records:
- `taxable_value_usd`: `credit_amount + cash_amount` (the IRS fair-market-value equivalent)
- A year-end summary report is generated per member showing total taxable value of transactions for the calendar year
- Members receive a plain-language notice: "Credit transactions may have tax implications. Use the Year-End Summary to share with your accountant."
- The platform does not file 1099-B on behalf of members — it provides the data they need to do so

### Reputation is Multidimensional (Phase 2+)
Phase 1 reputation: simple 1–5 star + comment per transaction.
Phase 2: `ReputationEvent.dimension` field adds: reliability, quality, timeliness, reciprocity, communication.

### Governance Versioning
`Proposal` records are immutable after voting closes. `RuleChange` records link to the proposal that enacted them and the previous rule state, creating a full governance history.

---

## 9. Engineering Spec

### Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack TypeScript, server components, great DX, easy Vercel deploy |
| Language | TypeScript 5 | Type-safe ledger logic is non-negotiable |
| Database | PostgreSQL 16 | ACID transactions for double-entry ledger; robust constraint enforcement |
| ORM | Prisma 5 | Type-safe queries, migration tooling, easy seed scripts |
| Auth | Auth.js v5 (NextAuth) | Session-based; supports email magic link + credentials |
| UI | Tailwind CSS + shadcn/ui | Accessible, composable, no external component license issues |
| Email | Resend | Transactional email with React Email templates |
| Payments | Stripe | Membership dues only — never used for credit exchange |
| Testing | Vitest + React Testing Library + Playwright | Unit/integration/E2E coverage |
| Deployment | Vercel + Railway (Postgres) | Simple CI/CD; database on Railway for cost; easy swap to Supabase |
| Analytics | Posthog (self-hosted optional) | Privacy-respecting; no data selling |

### Commands

```bash
# Development
npm run dev          # Start Next.js dev server (port 3000)
npm run db:studio    # Open Prisma Studio (database GUI)

# Database
npm run db:migrate   # Run pending migrations (prisma migrate dev)
npm run db:generate  # Regenerate Prisma client after schema change
npm run db:seed      # Seed database with demo data
npm run db:reset     # Drop + recreate + seed (dev only)

# Build & Deploy
npm run build        # Production build
npm run start        # Start production server

# Quality
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit + integration tests
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright end-to-end tests
npm run test:all     # typecheck + lint + test + test:e2e

# Utilities
npm run export:csv   # Generate sample CSV exports (dev utility)
```

---

## 10. Project Structure

```
commoncredit/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (unauthenticated)
│   │   ├── login/
│   │   ├── register/
│   │   └── verify/
│   ├── (member)/                 # Member-facing routes
│   │   ├── dashboard/            # Account summary, recent transactions
│   │   ├── marketplace/          # Offers + needs directory
│   │   │   ├── offers/
│   │   │   └── needs/
│   │   ├── transactions/         # Transaction history, send/request
│   │   ├── invoices/             # Invoice creation + management
│   │   ├── profile/              # Member profile + reputation
│   │   ├── governance/           # Proposals + voting (Phase 3)
│   │   └── settings/
│   ├── (admin)/                  # Admin panel
│   │   ├── members/              # Member management + approvals
│   │   ├── ledger/               # Full ledger view + transaction posting
│   │   ├── disputes/             # Dispute queue + resolution
│   │   ├── reports/              # Network health + exports
│   │   ├── treasury/             # Treasury management (Phase 3)
│   │   └── governance/           # Proposal management (Phase 3)
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth.js handlers
│   │   ├── transactions/         # Transaction endpoints
│   │   ├── invoices/
│   │   ├── members/
│   │   ├── offers/
│   │   ├── needs/
│   │   ├── governance/           # Phase 3
│   │   └── exports/
│   ├── layout.tsx
│   ├── page.tsx                  # Public landing page
│   └── globals.css
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── ledger/                   # Ledger-specific components
│   │   ├── AccountSummary.tsx
│   │   ├── TransactionList.tsx
│   │   ├── BalanceChart.tsx
│   │   └── LedgerEntry.tsx
│   ├── marketplace/
│   │   ├── OfferCard.tsx
│   │   ├── NeedCard.tsx
│   │   └── CategoryFilter.tsx
│   ├── members/
│   │   ├── MemberCard.tsx
│   │   └── ReputationBadge.tsx
│   ├── governance/               # Phase 3
│   │   ├── ProposalCard.tsx
│   │   └── VoteForm.tsx
│   └── shared/
│       ├── PageHeader.tsx
│       ├── DataTable.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Auth.js config
│   ├── ledger.ts                 # Double-entry ledger logic (core)
│   ├── credit.ts                 # Credit limit enforcement
│   ├── email.ts                  # Email sending helpers
│   ├── exports.ts                # CSV/accounting export logic
│   ├── permissions.ts            # Role-based access checks
│   └── types.ts                  # Shared TypeScript types
│
├── prisma/
│   ├── schema.prisma             # Data model
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Demo data seed
│
├── tests/
│   ├── unit/
│   │   ├── ledger.test.ts        # Double-entry invariants
│   │   ├── credit.test.ts        # Limit enforcement logic
│   │   └── exports.test.ts
│   └── integration/
│       ├── transactions.test.ts
│       ├── invoices.test.ts
│       └── members.test.ts
│
├── e2e/
│   ├── member-journey.spec.ts    # Full member onboarding → first trade
│   ├── admin-ledger.spec.ts      # Admin posts transaction, views reports
│   └── invoice-flow.spec.ts
│
├── docs/
│   ├── architecture.md
│   ├── ledger-design.md          # Double-entry design decisions
│   └── governance-model.md
│
├── .env.example
├── SPEC.md                       # This file
└── README.md
```

---

## 11. Code Style

### TypeScript conventions

- Strict mode enabled: `"strict": true` in tsconfig
- No `any` — use `unknown` with type guards at system boundaries
- Prefer `type` over `interface` for plain data shapes; use `interface` for extensible contracts
- Server actions use the `"use server"` directive; client components use `"use client"` only when required

### Naming

| Thing | Convention | Example |
|---|---|---|
| Files/directories | kebab-case | `transaction-list.tsx` |
| Components | PascalCase | `TransactionList` |
| Functions/variables | camelCase | `postTransaction` |
| Constants | SCREAMING_SNAKE | `DEFAULT_DEBIT_LIMIT` |
| Prisma models | PascalCase | `LedgerEntry` |
| Database columns | snake_case (Prisma maps) | `created_at` |
| API routes | kebab-case | `/api/transactions/post` |

### The Ledger Rule

The double-entry constraint is the most important invariant in the system. It must be enforced at the database level, not just in application code.

```typescript
// lib/ledger.ts

export async function postTransaction(
  tx: PrismaTransactionClient,
  params: {
    payerAccountId: string
    payeeAccountId: string
    amount: number          // always positive; direction encoded by debit/credit
    description: string
    referenceId?: string    // invoice ID, project ID, etc.
  }
): Promise<Transaction> {
  const { payerAccountId, payeeAccountId, amount, description, referenceId } = params

  // Enforce credit limit before posting
  const payer = await tx.account.findUniqueOrThrow({ where: { id: payerAccountId } })
  if (payer.balance - amount < payer.debitLimit) {
    throw new InsufficientCreditError(
      `Transaction would take account ${payerAccountId} below its debit limit`
    )
  }

  const transaction = await tx.transaction.create({
    data: {
      payerAccountId,
      payeeAccountId,
      amount,
      description,
      referenceId,
      status: "POSTED",
    },
  })

  // Double-entry: two ledger entries, always
  await tx.ledgerEntry.createMany({
    data: [
      { transactionId: transaction.id, accountId: payerAccountId,  debit: amount, credit: 0 },
      { transactionId: transaction.id, accountId: payeeAccountId, debit: 0,      credit: amount },
    ],
  })

  // Update account balances atomically
  await Promise.all([
    tx.account.update({ where: { id: payerAccountId },  data: { balance: { decrement: amount } } }),
    tx.account.update({ where: { id: payeeAccountId }, data: { balance: { increment: amount } } }),
  ])

  return transaction
}
```

```typescript
// Usage in a server action — always wrapped in a Prisma transaction
import { prisma } from "@/lib/db"
import { postTransaction } from "@/lib/ledger"

export async function confirmInvoice(invoiceId: string) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } })
    await postTransaction(tx, {
      payerAccountId: invoice.buyerAccountId,
      payeeAccountId: invoice.sellerAccountId,
      amount: invoice.creditAmount,
      description: invoice.description,
      referenceId: invoice.id,
    })
    return tx.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } })
  })
}
```

### Error types

```typescript
// lib/types.ts
export class InsufficientCreditError extends Error {
  readonly code = "INSUFFICIENT_CREDIT"
}

export class MemberNotApprovedError extends Error {
  readonly code = "MEMBER_NOT_APPROVED"
}

export class LedgerInvariantError extends Error {
  readonly code = "LEDGER_INVARIANT_VIOLATION"
}
```

### Server Actions pattern

Prefer server actions over API routes for form submissions and mutations. Reserve API routes for webhook endpoints and third-party integrations.

```typescript
// app/(member)/invoices/actions.ts
"use server"

import { auth } from "@/lib/auth"
import { confirmInvoice } from "@/lib/ledger"
import { revalidatePath } from "next/cache"

export async function approveInvoiceAction(invoiceId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await confirmInvoice(invoiceId)
  revalidatePath("/invoices")
  revalidatePath("/dashboard")
}
```

---

## 12. Testing Strategy

### Philosophy

- **Ledger logic has 100% unit test coverage** — the double-entry invariant, credit limit enforcement, and reversal logic are tested exhaustively
- **Integration tests cover happy paths and error cases** for every transaction flow
- **E2E tests cover the member journey** from signup through first completed trade
- Never mock the database in integration tests — use a test Postgres database with transactional rollback per test
- Test at the level that gives the most signal for the least maintenance cost

### Test levels

| Level | Tool | Location | What it covers |
|---|---|---|---|
| Unit | Vitest | `tests/unit/` | Ledger math, credit logic, export formatting, pure functions |
| Integration | Vitest + Prisma test DB | `tests/integration/` | Full transaction flows, invoice lifecycle, member approval |
| Component | Vitest + RTL | Colocated `*.test.tsx` | UI components with realistic props |
| E2E | Playwright | `e2e/` | Full user journeys in a running app |

### Critical test cases (non-negotiable)

```
ledger.test.ts:
  ✓ postTransaction creates exactly two ledger entries
  ✓ network balance sums to zero after any transaction
  ✓ throws InsufficientCreditError when payer would breach debit limit
  ✓ throws InsufficientCreditError when payee would breach credit limit
  ✓ reversal creates two offsetting ledger entries
  ✓ transaction history is append-only (no deletes)

credit.test.ts:
  ✓ new member account starts at balance 0
  ✓ default debit limit is -200
  ✓ default credit limit is +500
  ✓ admin can increase/decrease limits with a logged reason
  ✓ limit change is recorded in audit log

invoice.test.ts:
  ✓ approved invoice posts to ledger
  ✓ rejected invoice does not touch ledger
  ✓ invoice cannot be approved if payer has insufficient credit
  ✓ blended invoice records both credit and cash amounts
```

### Coverage targets

- `lib/ledger.ts`: 100%
- `lib/credit.ts`: 100%
- `lib/exports.ts`: 90%+
- Overall: 80%+ statement coverage

---

## 13. Demo Seed Data

The seed populates a realistic demo network for the pilot city. Run with `npm run db:seed`.

### Network: "Millbrook Common Credit"
- 28 members across 8 categories
- Mix of individuals, small businesses, and one co-op
- Realistic transaction history (6 months)
- Variety of positive/negative balances
- One open dispute, one resolved dispute
- One open governance proposal (Phase 3 seed only)
- Treasury with partial allocation (Phase 3 seed only)

### Member categories and sample members

| Category | Members | Key offers |
|---|---|---|
| Wellness & Care | Sofia M. (massage), Yuki T. (yoga), Dr. Patel (naturopath) | Massage sessions, yoga classes, consultations |
| Creative Services | Marcus D. (photography), Lena K. (copywriting), Javi R. (web design) | Headshots, brand copy, websites |
| Food & Hospitality | The Crow Café (café), Fernwood Farm (CSA), Marta G. (catering) | Coffee credits, veg boxes, event catering |
| Repair & Making | Tom B. (bike repair), Sasha P. (electronics), Common Goods Co-op (tool library) | Bike tune-ups, device repair, tool lending |
| Professional Services | Keiko A. (bookkeeping), Rafi N. (legal consult), Dev S. (accounting) | Monthly books, contract review, tax prep |
| Space & Equipment | The Hive Cowork (desk time), River Studio (photo studio rental) | Day passes, hourly studio time |
| Transport | Pat V. (van hire), Cyclepath Couriers (delivery) | Van rental by day, local delivery |
| Anchor | Millbrook Neighbourhood House (nonprofit) | Venue hire, childcare coordination |

### Account balances (representative sample)

| Member | Balance | Debit Limit | Credit Limit | Status |
|---|---|---|---|---|
| Sofia M. | +340 | -200 | +500 | Active |
| The Crow Café | +180 | -300 | +600 | Active |
| Javi R. | -120 | -200 | +500 | Active |
| Tom B. | +60 | -200 | +500 | Active |
| Keiko A. | +290 | -200 | +500 | Active |
| Fernwood Farm | -80 | -200 | +500 | Active |
| Common Goods Co-op | +410 | -400 | +800 | Active (co-op limits) |
| New member | 0 | -200 | +500 | Pending approval |

### Sample transactions (seed history)

- Sofia → Javi: 200 credits — "Website refresh for massage practice"
- The Crow Café → Keiko: 150 credits — "Monthly bookkeeping, March"
- Fernwood Farm → The Crow Café: 80 credits — "Weekly veg box, 4 weeks"
- Tom B. → The Hive Cowork: 50 credits — "10-day desk pass"
- Marcus D. → Sofia M.: 120 credits — "Brand photography session"
- Common Goods Co-op → Dev S.: 90 credits — "Quarterly accounts"

### Demo credentials

```
Admin:  admin@millbrookcommons.coop  / demo-admin-2026
Member: sofia@sofiamassage.com       / demo-member-2026
```

---

## 14. Business Model

### Ownership structure

Multi-stakeholder cooperative with member classes:

| Class | Who | Governance weight |
|---|---|---|
| Individual members | Residents, freelancers | 1 vote |
| Business members | Local businesses, co-ops | 1 vote |
| Worker members | Staff, developers | 1 vote |
| Anchor members | Nonprofits, institutions | 1 vote |

One-member-one-vote for all governance. No investor veto. No board seats for capital.

### Revenue streams

| Source | Rate | Notes |
|---|---|---|
| Individual membership | $5–10/month | Reduced for low-income; free during pilot |
| Freelancer membership | $15/month | |
| Small business membership | $25–50/month | Based on revenue tier |
| Co-op membership | $30–60/month | |
| Anchor institution | $100–500/month | |
| Transaction fee | 0–0.5%, max 2 CC | Optional; voted by governance |
| Accounting export premium | $5/month add-on | QuickBooks/Xero integration |
| Network setup consulting | $2,000–5,000 one-time | For new local networks launching |
| Federation dues | TBD | Phase 5 |

### What we will never do

- Sell transaction data
- Issue speculative tokens
- Accept venture capital with control rights
- Charge take-rate-maximizing transaction fees
- Show ads
- Use opaque credit scoring
- Create lock-in through data export restrictions

---

## 15. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cold-start network effects (not enough diverse offers) | High | High | Human trade broker in Phase 1; curate supply/demand before launch; "most wanted" category |
| Free riding (members spend but don't offer) | Medium | High | Require credible offers before first debit; periodic balance review; contribution commitments |
| Default (member goes deep negative, disappears) | Medium | Medium | Low initial limits; endorsement-based increases; reserve fund; spending velocity limits |
| Governance capture (founders dominate) | Low-Medium | High | Cooperative structure; term limits; conflict-of-interest declarations; participatory budgeting |
| Tax/regulatory exposure | Medium | High | Legal review before launch; IRS barter exchange guidance; transparent reporting; no cash convertibility |
| Complexity/jargon barrier | High | Medium | Plain language; assisted first transaction; "member credit" not "complementary currency" |
| Ideological over-recruitment (theorists, not traders) | Medium | Medium | Lead with immediate utility; show concrete cash savings; track active transaction rate |
| Ledger bugs creating phantom balances | Low | Critical | 100% test coverage on ledger; DB-level constraint; daily reconciliation job |

---

## 16. Boundaries

### Always do

- Run `npm run test:all` before marking any task complete
- Wrap all ledger mutations in a Prisma `$transaction`
- Enforce credit/debit limits in `lib/ledger.ts`, not in route handlers
- Log every credit limit change with actor, reason, previous value, and new value
- Use TypeScript strict mode; resolve all type errors before committing
- Generate a monthly statement for every member (automated, scheduled job)
- Show members their full transaction history with no pagination limits
- Use plain language — test every new label against the persona glossary

### Ask first

- Changing the Prisma schema (migrations affect data integrity)
- Adding new member types or governance roles
- Changing default credit/debit limits
- Integrating a new third-party service
- Adding or removing columns from CSV exports (accounting clients depend on stable formats)
- Changing the ledger posting logic
- Any change to the Stripe integration
- Architectural changes (new service, cache layer, queue)

### Never do

- Delete ledger entries — reversals only
- Post a transaction that would violate a debit or credit limit without admin override
- Expose member balances to other members (balances are visible to the account holder and admins only)
- Use AI to auto-deny credit or auto-resolve disputes
- Commit secrets, API keys, or credentials to version control
- Bypass TypeScript type checking with `@ts-ignore` or `any` in ledger code
- Store cash payment amounts in the double-entry ledger (memo field only)
- Allow a member to vote in governance before they are approved and active
- Permanently remove a member without a cooperative board vote (sanction ladder is restorative only)
- Send member transaction data to a third-party AI provider without reviewing the data processing agreement
- Collect or retain personal data beyond what the CCPA-compliant membership agreement permits

---

## 17. Success Criteria by Phase

### Phase 1 (Concierge MVP)
- 50 approved members
- 100 completed transactions
- At least 10 distinct offer categories represented
- 60% of members active (at least 1 transaction) in any 30-day window
- Zero uncorrected ledger invariant violations
- Members report measurable cash savings or new sales (qualitative + quantitative)
- Admin can run full monthly cycle in under 2 hours

### Phase 2 (Self-Service Network)
- 150–300 members
- Self-service transaction rate > 80% (admin-mediated < 20%)
- Dispute rate < 5% of transactions
- Member retention (3-month) > 70%
- First blended payment transactions processing correctly
- QuickBooks CSV export validated by at least 2 business members

### Phase 3 (Governance and Treasury)
- At least one contested governance vote with quorum met
- Treasury funds at least one commons project
- Dispute committee successfully resolves at least 3 cases
- Governance participation rate > 25% of active members

### Phase 4 (AI-Assisted)
- AI-suggested matches result in at least 30% of new transactions
- Network gap report used by admin to actively recruit missing categories
- No AI decision made without human review and override capability demonstrated

### Phase 5 (Federation)
- At least 2 federated local networks transacting with each other
- Inter-network credit clearing tested with real transactions
- API consumed by at least one third-party integration

---

## 18. Decisions (formerly Open Questions)

All 8 pre-launch questions resolved as of June 2026.

| # | Question | Decision |
|---|---|---|
| 1 | Legal structure | US-based. Operating as informal pilot initially; cooperative registration (multi-stakeholder) to be filed before accepting dues at scale. Attorney review required before Phase 1 launch. |
| 2 | Tax reporting | Track `taxable_value_usd` on every transaction from day one (1 CC = 1 USD). Generate year-end summary report per member. Include plain-language tax disclaimer. Platform does not file 1099-B — provides data for members' accountants. |
| 3 | Unit definition | **1 CC = 1 USD.** Simplest peg; familiar for business pricing; clean taxable value calculation. Unit value may be revisited by governance in Phase 3. |
| 4 | Credit limit authority | **Founding Credit Committee** — 3–5 elected founding members plus admin. Decisions are logged with rationale and visible to the requesting member. No unilateral admin increases above a threshold TBD by committee. |
| 5 | Pilot community | **Co-op / solidarity economy network** with existing trust infrastructure. Specific community to be identified during Phase 0 supply/demand mapping. |
| 6 | Data hosting | **US-based** (Railway or Supabase US region). **CCPA** is the baseline privacy law. Data retention policy to be drafted as part of membership agreement before Phase 1 launch. |
| 7 | Dispute sanctions | **Restorative ladder only:** warning → reduced limits + repayment plan → temporary suspension (≤90 days) → mandatory mediation. **Permanent removal requires a cooperative board vote** — the platform never unilaterally expels a member. All decisions logged and appealable. |
| 8 | AI vendor (Phase 4) | **Claude API (Anthropic).** No training on member transaction data under Anthropic's API terms. Data processing agreement to be reviewed before Phase 4 launch. Interface contract to be defined in Phase 3 so vendor can be swapped if needed. |

---

*This spec is a living document. Update it when scope changes, decisions are made, or open questions are resolved. Commit changes to version control alongside the code that implements them.*
