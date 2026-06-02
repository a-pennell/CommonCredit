# CommonCredit — Domain Model

> Noun+Verb mapping and bounded context map  
> Derived from SPEC.md v0.2, June 2026

---

## 1. Noun + Verb Mapping

Every noun is an aggregate root or entity. Verbs are the operations that can be performed on it. Verbs marked **[P2]**, **[P3]**, **[P4]** are introduced in those phases; all others are Phase 1.

---

### Member
The person or organization participating in the network.

| Verb | Who can call it | Notes |
|---|---|---|
| `apply` | Applicant | Submits membership application |
| `approve` | Admin | Creates Account, sends welcome email |
| `reject` | Admin | With written reason; applicant notified |
| `suspend` | Admin / Dispute Committee | Sanction ladder step 3; ≤90 days |
| `reinstate` | Admin / Dispute Committee | After mediation or sanction period |
| `endorse` | Any approved member | Free-text; visible on profile |
| `requestLimitIncrease` | Member | Creates CreditLimitRequest **[P2]** |
| `expel` | Cooperative Board only | No platform-initiated permanent removal |

---

### MembershipApplication
The intake record for a prospective member.

| Verb | Who can call it | Notes |
|---|---|---|
| `submit` | Applicant | Includes bio, at least one Offer, contact |
| `review` | Admin | View application detail |
| `approve` | Admin | Triggers Member.approve |
| `reject` | Admin | With written reason |
| `defer` | Admin | Pending more information |
| `withdraw` | Applicant | Before decision |

---

### Account
The ledger account owned by a Member. One account per member in Phase 1.

| Verb | Who can call it | Notes |
|---|---|---|
| `open` | System | Created automatically on Member.approve |
| `credit` | System (Ledger) | Balance increases; always paired with a debit |
| `debit` | System (Ledger) | Balance decreases; checked against debitLimit |
| `hold` | System (Ledger) | Escrow for pending transaction **[P2]** |
| `release` | System (Ledger) | Releases escrow hold **[P2]** |
| `adjustLimit` | Admin / Credit Committee | Logged with reason; both creditLimit and debitLimit |
| `generateStatement` | Admin / System | Monthly; CSV or PDF |
| `close` | Cooperative Board only | Paired with Member.expel |

**Invariants:**
- `balance >= debitLimit` at all times (enforced at DB level)
- `balance <= creditLimit` at all times (enforced at DB level)
- Account.balance = sum of all LedgerEntry.credit - sum of all LedgerEntry.debit for this account

---

### Transaction
A completed or in-progress exchange between two members.

| Verb | Who can call it | Notes |
|---|---|---|
| `create` | Member (P2) / Admin (P1) | Draft state; no ledger entries yet |
| `confirm` | Payee | Moves to CONFIRMED; triggers post **[P2]** |
| `post` | System (Ledger) | Creates two LedgerEntry rows; atomically updates balances |
| `flag` | Either party / Admin | Opens a Dispute |
| `reverse` | Admin | Creates two offsetting LedgerEntry rows; reason required; original entries immutable |
| `export` | Member / Admin | Included in CSV / accounting export |

**Invariants:**
- `post` always creates exactly two LedgerEntry rows
- `reverse` never deletes — only offsets
- `credit_amount` alone posts to ledger; `cash_amount` is memo only
- `taxable_value_usd = credit_amount + cash_amount`

---

### LedgerEntry
An immutable accounting line. Never updated. Never deleted.

| Verb | Who can call it | Notes |
|---|---|---|
| `post` | System (Transaction.post only) | Created in pairs |
| `reconcile` | Admin / System | Audit: network total must equal zero |

---

### Offer
A good or service a member is willing to provide in exchange for credits.

| Verb | Who can call it | Notes |
|---|---|---|
| `create` | Member | Draft |
| `publish` | Member | Visible in marketplace |
| `edit` | Member | While not claimed |
| `unpublish` | Member | Hidden from marketplace |
| `claim` | Buyer | Expresses intent to purchase **[P2]** |
| `fulfill` | Seller | Marks as delivered; triggers reputation prompt |
| `renew` | Member | Extend availability |
| `expire` | System | After `available_until` date passes |
| `suggest` | AI **[P4]** | AI surfaces offer to member with matching Need |

---

### Need
A good or service a member is seeking.

| Verb | Who can call it | Notes |
|---|---|---|
| `create` | Member | |
| `publish` | Member | Visible in marketplace |
| `respond` | Any member | Offer to meet the need |
| `fulfill` | Member who posted | Marks as met |
| `withdraw` | Member | |
| `expire` | System | After `needed_by` date |
| `match` | AI **[P4]** | AI links Need to relevant Offers |

---

### Invoice
A formal payment request from one member to another.

| Verb | Who can call it | Notes |
|---|---|---|
| `create` | Seller | Includes credit_amount, optional cash_amount, description, due date |
| `send` | Seller | Notifies buyer |
| `approve` | Buyer | Triggers Transaction.post |
| `reject` | Buyer | With note; no ledger entry |
| `cancel` | Seller | Before approval |
| `export` | Either party | CSV with taxable_value_usd |
| `remind` | System | Automated reminder before due date |
| `overdueFlag` | System | Flags if past due date; notifies admin |

---

### CreditLimitRequest
A member's formal request to change their Account limits. **[P2]**

| Verb | Who can call it | Notes |
|---|---|---|
| `submit` | Member | Includes trade history context, repayment plan |
| `review` | Credit Committee | Views history, offers, endorsements |
| `approve` | Credit Committee | Triggers Account.adjustLimit; reason logged |
| `deny` | Credit Committee | Plain-language explanation sent to member |
| `appeal` | Member | Escalates to full committee review |
| `withdraw` | Member | Before decision |

---

### ReputationEvent
A post-transaction rating. Multidimensional from Phase 2.

| Verb | Who can call it | Notes |
|---|---|---|
| `create` | Either party | After transaction confirmed; prompted automatically |
| `edit` | Author | Within 48-hour window only |
| `dispute` | Subject | Flags for admin review if inaccurate **[P2]** |

**Phase 1:** single 1–5 star + comment  
**Phase 2+:** dimensions: reliability, quality, timeliness, reciprocity, communication

---

### Endorsement
A free-text peer endorsement, separate from transaction ratings.

| Verb | Who can call it | Notes |
|---|---|---|
| `write` | Any approved member | Visible on recipient's profile |
| `revoke` | Author | Removes from profile |

---

### Dispute
A formal conflict record tied to a transaction or member relationship.

| Verb | Who can call it | Notes |
|---|---|---|
| `open` | Either party / Admin | Linked to Transaction |
| `submitEvidence` | Either party | Uploads, notes, timeline |
| `assign` | Admin | To mediator or committee **[P3]** |
| `mediate` | Mediator | Structured dialogue |
| `decide` | Committee / Admin | Written decision record |
| `sanction` | Committee / Admin | Applies sanction from ladder (never permanent removal) |
| `appeal` | Either party | Escalates decision |
| `close` | Admin / Committee | Resolution recorded |

**Sanction ladder:** warning → reduced limits + repayment plan → suspension ≤90 days  
**Expulsion:** cooperative board vote only — never via this flow

---

### Proposal
A governance proposal subject to member vote. **[P3]**

| Verb | Who can call it | Notes |
|---|---|---|
| `draft` | Any approved member | Rich text; supporting docs |
| `publish` | Proposer | Starts comment period |
| `comment` | Any approved member | During comment window |
| `openVoting` | System / Admin | After comment period closes |
| `vote` | Any approved member | Yes / No / Abstain; one per member |
| `closeVoting` | System | At voting deadline |
| `tally` | System | Checks quorum and threshold |
| `enact` | System | Creates RuleChange or TreasuryAllocation |
| `fail` | System | Quorum not met or threshold not reached |
| `archive` | System | After enact or fail |

**Immutability:** Proposal body is locked once voting opens.

---

### Vote
A single member's vote on a Proposal. **[P3]**

| Verb | Who can call it | Notes |
|---|---|---|
| `cast` | Approved member | Yes / No / Abstain |
| `change` | Voter | Before voting deadline only |
| `withdraw` | Voter | Before voting deadline |

---

### RuleChange
An immutable record of a governance decision that changed network policy. **[P3]**

| Verb | Who can call it | Notes |
|---|---|---|
| `create` | System (from enacted Proposal) | Stores previous rule state + new rule state |
| `view` | Any member | Governance history is public |
| `supersede` | System | When a subsequent Proposal changes the same rule |

---

### Treasury
The network's shared financial account. **[P3]**

| Verb | Who can call it | Notes |
|---|---|---|
| `receive` | System | Inflow: dues, fees, donations, surplus |
| `allocate` | System (from enacted Proposal) | Creates TreasuryAllocation |
| `reserve` | Admin | Set aside for contingency |
| `release` | System (on task verification) | Transfers credits to contributor |
| `report` | Admin / System | Balance, inflows, outflows, allocations |
| `reconcile` | Admin | Audit against ledger |

---

### TreasuryAllocation
A governance-approved commitment to spend from the Treasury. **[P3]**

| Verb | Who can call it | Notes |
|---|---|---|
| `create` | System (from enacted Proposal) | Linked to Proposal |
| `release` | System / Admin | Credits transferred to Project or member |
| `cancel` | Governance vote | If project abandoned; returns credits to Treasury |

---

### Project
A commons work initiative funded by TreasuryAllocation. **[P3]**

| Verb | Who can call it | Notes |
|---|---|---|
| `create` | System (from enacted Proposal) | |
| `publishTasks` | Project steward | Breaks work into claimable tasks |
| `claimTask` | Any member | Member self-assigns a task |
| `submitWork` | Task holder | Work submitted for verification |
| `verifyWork` | Admin / Committee | Confirms completion |
| `payContributor` | System (on verify) | Treasury releases credits |
| `complete` | Admin | All tasks verified; asset record created |
| `archive` | Admin | |

---

### CommonsResource
A shared physical or digital asset owned by the network. **[P3]**

| Verb | Who can call it | Notes |
|---|---|---|
| `register` | Admin / Steward | Created when a Project completes or asset donated |
| `book` | Member | Reserve access slot |
| `release` | Member / System | End booking |
| `maintain` | Steward | Log maintenance event |
| `transfer` | Admin | Change steward |
| `decommission` | Governance vote | Remove from commons |

---

### Statement
A periodic accounting summary for a member.

| Verb | Who can call it | Notes |
|---|---|---|
| `generate` | System (scheduled monthly) | All transactions, running balance, credit usage |
| `send` | System | Email to member |
| `export` | Member / Admin | CSV or PDF |

---

### TaxSummary
Annual taxable value summary for a member.

| Verb | Who can call it | Notes |
|---|---|---|
| `generate` | System (scheduled annually) | Sum of taxable_value_usd by member |
| `send` | System | Email January 1 for prior year |
| `export` | Member | CSV for accountant |

---

### NetworkReport
Network health metrics for admin and public dashboard.

| Verb | Who can call it | Notes |
|---|---|---|
| `generate` | System (scheduled) / Admin | Volume, velocity, reciprocity, gaps, defaults |
| `publish` | System | To public network health dashboard **[P3]** |
| `narrate` | AI **[P4]** | "State of the network" plain-language summary |
| `export` | Admin | CSV |

---

## 2. Domain Map — Bounded Contexts

Nine bounded contexts. Each owns its aggregate roots and enforces its own invariants. Dependency arrows show which context depends on which.

```
┌─────────────────────────────────────────────────────────────────┐
│  CORE DOMAINS  (most differentiated — build these first)        │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │     LEDGER          │    │        EXCHANGE              │   │
│  │  (double-entry)     │    │  (offers, needs, matching)   │   │
│  │                     │    │                              │   │
│  │  Account            │    │  Offer                       │   │
│  │  Transaction        │    │  Need                        │   │
│  │  LedgerEntry        │    │                              │   │
│  │                     │    │  Depends on: Membership,     │   │
│  │  Invariant:         │    │  Ledger (for pricing)        │   │
│  │  Σ all entries = 0  │    └──────────────────────────────┘   │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SUPPORTING DOMAINS  (important but not differentiating)        │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │   MEMBERSHIP     │  │   INVOICING    │  │    TRUST       │  │
│  │                  │  │                │  │                │  │
│  │  Member          │  │  Invoice       │  │  Reputation-   │  │
│  │  MemberApp-      │  │                │  │  Event         │  │
│  │  lication        │  │  Depends on:   │  │  Endorsement   │  │
│  │  CreditLimit-    │  │  Membership,   │  │                │  │
│  │  Request         │  │  Ledger        │  │  Depends on:   │  │
│  │                  │  │                │  │  Membership,   │  │
│  │  Depends on:     │  └────────────────┘  │  Transaction   │  │
│  │  Ledger (opens   │                      └────────────────┘  │
│  │  Account)        │                                          │
│  └──────────────────┘                                          │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │    DISPUTES      │  │  GOVERNANCE    │  │  TREASURY &    │  │
│  │                  │  │                │  │  COMMONS       │  │
│  │  Dispute         │  │  Proposal      │  │                │  │
│  │  Sanction ladder │  │  Vote          │  │  Treasury      │  │
│  │                  │  │  RuleChange    │  │  Treasury-     │  │
│  │  Depends on:     │  │                │  │  Allocation    │  │
│  │  Membership,     │  │  Depends on:   │  │  Project       │  │
│  │  Transaction,    │  │  Membership    │  │  ProjectTask   │  │
│  │  Ledger (for     │  │  (who can      │  │  Commons-      │  │
│  │  limit changes)  │  │  vote),        │  │  Resource      │  │
│  │                  │  │  Treasury      │  │                │  │
│  └──────────────────┘  └────────────────┘  │  Depends on:   │  │
│                                            │  Governance,   │  │
│                                            │  Ledger,       │  │
│                                            │  Membership    │  │
│                                            └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  GENERIC SUBDOMAINS  (commodity-like — use libraries/tools)     │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │    REPORTING     │  │ NOTIFICATIONS  │  │     AUTH       │  │
│  │                  │  │                │  │                │  │
│  │  Statement       │  │  Notification  │  │  Session       │  │
│  │  TaxSummary      │  │                │  │  Permission    │  │
│  │  NetworkReport   │  │  Crosses all   │  │                │  │
│  │                  │  │  domains       │  │  Crosses all   │  │
│  │  Depends on:     │  │                │  │  domains       │  │
│  │  Ledger,         │  │                │  │                │  │
│  │  Membership,     │  │                │  │                │  │
│  │  Exchange        │  │                │  │                │  │
│  └──────────────────┘  └────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Context Dependency Graph

```
Auth ──────────────────────────────────→ (all contexts depend on Auth)
Notifications ─────────────────────────→ (all contexts publish events to Notifications)

Membership ──────────────────────────→ Ledger (open Account on approval)
Exchange ────────────────────────────→ Membership (member must be approved to offer)
Exchange ────────────────────────────→ Ledger (pricing reference)
Invoicing ───────────────────────────→ Membership (buyer/seller identity)
Invoicing ───────────────────────────→ Ledger (Invoice.approve triggers Transaction.post)
Trust ───────────────────────────────→ Membership (reputation belongs to a member)
Trust ───────────────────────────────→ Ledger (reputation event linked to transaction)
Disputes ────────────────────────────→ Membership (parties to the dispute)
Disputes ────────────────────────────→ Ledger (sanction may adjust Account limits)
Disputes ────────────────────────────→ Transaction (dispute is against a transaction)
Governance ──────────────────────────→ Membership (one member = one vote)
Governance ──────────────────────────→ Treasury (allocation via enacted Proposal)
Treasury & Commons ──────────────────→ Ledger (treasury holds an Account)
Treasury & Commons ──────────────────→ Governance (allocation requires Proposal.enact)
Treasury & Commons ──────────────────→ Membership (contributors receive credits)
Reporting ───────────────────────────→ Ledger (statements, tax summaries)
Reporting ───────────────────────────→ Membership (per-member reports)
Reporting ───────────────────────────→ Exchange (supply/demand gap analysis)
```

---

## 4. Phase Ownership

Which contexts are active in each phase:

| Context | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Ledger | ✓ core | ✓ | ✓ | ✓ | ✓ |
| Exchange | ✓ basic | ✓ enhanced | ✓ | ✓ AI | ✓ federated |
| Membership | ✓ admin-mediated | ✓ self-service | ✓ | ✓ | ✓ |
| Invoicing | ✓ | ✓ blended | ✓ | ✓ | ✓ |
| Trust | ✓ basic rep | ✓ multidim | ✓ | ✓ AI | ✓ portable |
| Disputes | ✓ flagging | ✓ workflow | ✓ committee | ✓ | ✓ |
| Governance | — | — | ✓ | ✓ | ✓ federated |
| Treasury & Commons | — | — | ✓ | ✓ | ✓ |
| Reporting | ✓ basic | ✓ | ✓ public dash | ✓ AI narrative | ✓ |
| Notifications | ✓ email | ✓ in-app | ✓ | ✓ | ✓ |
| Auth | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 5. Cross-Context Integration Points

These are the seams where one context calls into another. They are the most fragile points in the system and should be treated as explicit interfaces.

| From | To | Trigger | What crosses the boundary |
|---|---|---|---|
| Membership | Ledger | Member approved | Open Account with default limits |
| Invoicing | Ledger | Invoice approved | Post Transaction (credit_amount) |
| Invoicing | Ledger | Invoice approved | Record taxable_value_usd |
| Disputes | Membership | Sanction applied | Update Member.status |
| Disputes | Ledger | Sanction applied | Adjust Account.debitLimit |
| Governance | Treasury | Proposal enacted | Create TreasuryAllocation |
| Treasury | Ledger | Work verified | Post credit to contributor Account |
| Trust | Transaction | Transaction confirmed | Create ReputationEvent prompt |
| Reporting | Ledger | Monthly schedule | Aggregate LedgerEntry for Statement |
| Reporting | Ledger | Annual schedule | Aggregate taxable_value_usd for TaxSummary |
| AI (P4) | Exchange | On-demand | Read Offers/Needs; write match suggestions (read-only cross-context) |
| AI (P4) | Reporting | On-demand | Read NetworkReport; write narrative summary |

---

## 6. Aggregate Roots (for Prisma schema organisation)

| Aggregate Root | Owns (children) |
|---|---|
| `Member` | `MembershipApplication`, `Endorsement`, `CreditLimitRequest` |
| `Account` | `LedgerEntry` (via Transaction) |
| `Transaction` | `LedgerEntry` (exactly 2), `ReputationEvent` |
| `Offer` | (leaf) |
| `Need` | (leaf) |
| `Invoice` | (leaf — references Transaction after approval) |
| `Dispute` | `DisputeEvidence`, `DisputeDecision` |
| `Proposal` | `Vote`, `RuleChange` (if enacted) |
| `Treasury` | `TreasuryAllocation` |
| `Project` | `ProjectTask` |
| `CommonsResource` | `BookingRecord`, `MaintenanceLog` |
| `Statement` | (leaf) |
| `TaxSummary` | (leaf) |
| `NetworkReport` | (leaf) |
