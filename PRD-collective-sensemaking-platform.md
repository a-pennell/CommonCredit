# Product Requirements Document
## Collective Sensemaking Platform

**Version:** 0.1 (Draft)
**Date:** 2026-06-01
**Status:** For review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem & Opportunity](#2-problem--opportunity)
3. [User Personas](#3-user-personas)
4. [User Stories & Acceptance Criteria](#4-user-stories--acceptance-criteria)
5. [Non-Goals](#5-non-goals)
6. [Product Roadmap Overview](#6-product-roadmap-overview)
7. [Phase 1 — Issue Memory & AI Synthesis (MVP)](#7-phase-1--issue-memory--ai-synthesis-mvp)
8. [Phase 2 — Deliberation & Perspective Mapping](#8-phase-2--deliberation--perspective-mapping)
9. [Phase 3 — Systems Mapping](#9-phase-3--systems-mapping)
10. [Phase 4 — Scenario Planning & Decision Support](#10-phase-4--scenario-planning--decision-support)
11. [Phase 5 — Monitoring & Adaptive Governance](#11-phase-5--monitoring--adaptive-governance)
12. [AI System Requirements](#12-ai-system-requirements)
13. [Technical Architecture](#13-technical-architecture)
14. [Domain Model](#14-domain-model)
15. [Governance Model (Platform Roles)](#15-governance-model-platform-roles)
16. [Design Principles](#16-design-principles)
17. [Competitive Landscape](#17-competitive-landscape)
18. [Business Model](#18-business-model)
19. [Success Metrics](#19-success-metrics)
20. [Risks & Mitigations](#20-risks--mitigations)

---

## 1. Executive Summary

### Problem Statement

Modern institutions do not merely lack information — they lack shared, navigable, revisable models of reality. Organizations have documents but not collective memory; dashboards but not causal understanding; AI summaries but not epistemic accountability. The result is repeated debates, fragmented understanding, polarized deliberation, and decisions that cannot be traced, contested, or learned from.

### Proposed Solution

A Collective Sensemaking Platform: a civic/institutional nervous system where communities can surface issues, map systems, understand stakeholder perspectives, deliberate under uncertainty, make traceable decisions, and preserve institutional learning over time. Not "Slack plus AI." Not "Miro plus voting." Infrastructure for democratic cognition.

### Success Criteria (12 months post-Phase 1 launch)

| Metric | Target |
|---|---|
| Annual Recurring Revenue | $500K ARR |
| Issue workspace completions | 200 workspaces taken from raw input to decision-ready |
| Decisions recorded on platform | 100 formal decisions with traceable reasoning |
| Stakeholder coverage | ≥ 75% of identified stakeholder groups represented per completed workspace |
| Retention | ≥ 70% of organizations renew after first issue cycle |

---

## 2. Problem & Opportunity

### 2.1 The Core Failure Modes

**Cognitive Balkanization.** Complex problems are distributed across many people, tools, documents, meetings, and lived experiences. Each fragment remains trapped in its own container — spreadsheets, public comments, policy memos, GIS maps, meeting notes. No one sees the whole system.

**Linear thinking in nonlinear systems.** Groups reason as if problems are linear ("add police, crime drops") when complex systems involve feedback loops, delays, tipping points, unintended consequences, and second-order effects.

**Data without understanding.** Institutions have more data than ever but data alone does not produce sensemaking. A housing dashboard can show rent burden rising and evictions increasing without explaining why these patterns co-evolved, which variables are leverage points, or where actors disagree about causality.

**Identity-protective cognition.** Public deliberation collapses into camps, slogans, and moral accusation because beliefs are socially situated. People ask not just "what is true?" but "what does believing this say about my group?"

**Lost institutional memory.** Organizations repeatedly forget why a decision was made, what alternatives were considered, what assumptions were accepted, who objected, and what happened afterward. Staff turnover accelerates this loop: less memory → repeated debates → decision fatigue → lower trust → more informal workarounds.

**Hidden uncertainty.** Most institutions present decisions as if based on stable facts when they rely on contested evidence, model assumptions, and political judgments. When uncertainty is hidden, disagreement becomes moralized ("you are wrong"). When visible, it becomes investigable ("we assign different probabilities to this scenario").

### 2.2 Market Opportunity

Civic engagement, participatory planning, and collective decision-making are growing needs:

- The public engagement consulting market is expanding as cities face climate migration, housing crises, and infrastructure pressure requiring genuine stakeholder input.
- Worker co-operatives, community land trusts, and nonprofit coalitions are growing in number and need governance infrastructure that matches their values.
- Government innovation offices are actively piloting digital deliberation tools but have no platform that integrates synthesis, causal modeling, and institutional memory.

Adjacent tools (Polis, Loomio, Decidim, Kumu, Miro) each solve one piece of the puzzle. No existing platform closes the full loop from raw input to structured model to deliberation to decision to monitored outcome.

---

## 3. User Personas

### Persona 1: The City Planner / Public Sector Strategist
**Name:** Renata, 38, Senior Planner, City Planning Department

**Context:** Manages complex community planning processes. Has hundreds of public comments, a dozen consultant reports, and four stakeholder advisory meetings — all in separate systems. Needs to synthesize this into a legitimate, traceable recommendation for council.

**Pain:** "I have too much input and no shared way to understand it. We lose half our reasoning every staff transition."

**Goal:** Turn messy input into a structured, defensible analysis that stakeholders can interrogate and trust.

**Success:** A completed issue workspace that surfaces the core conflicts, evidence base, and decision options — ready for deliberation with council.

---

### Persona 2: The Civic Consultant / Public Engagement Facilitator
**Name:** Marcus, 44, Principal, Public Engagement Consultancy

**Context:** Facilitates participatory processes for 10–15 municipal and nonprofit clients per year. Runs workshops, manages surveys, produces reports. Currently does synthesis manually in Word and Miro. Delivers reports that clients rarely revisit.

**Pain:** "I produce great work for the process, but two years later nobody can find it or understands why decisions were made. My deliverables have no shelf life."

**Goal:** A platform that makes their facilitation work durable, searchable, and epistemically accountable — and that clients keep paying for after the engagement ends.

**Success:** Issue memory that survives the engagement; clients who continue using the platform without the consultant's involvement.

---

### Persona 3: The Cooperative / Nonprofit Governance Lead
**Name:** Sofia, 33, Operations Director, Worker Co-op (30 members)

**Context:** Manages governance for a growing worker co-op. Decisions are made by consent but the process is slow, contentious, and forgetful. The same debates recur every year. Newer members lack context for why policies exist.

**Pain:** "We debate compensation and governance constantly, but we never seem to learn. Older members get frustrated. Newer members don't understand the history."

**Goal:** A system for tracking issues, perspectives, decisions, and the reasoning behind them — that new members can get up to speed on quickly.

**Success:** A searchable institutional memory where any member can understand why a decision was made, what was considered, and what changed.

---

### Persona 4: The Facilitator / Sensemaking Practitioner
**Name:** Dayo, 29, Systems Facilitator, Climate Resilience NGO

**Context:** Runs multi-stakeholder processes on climate adaptation for neighborhood coalitions. Skilled at systems mapping and facilitation but spends too much time on preparation and synthesis, not facilitation.

**Pain:** "I can run the workshop, but getting everyone on the same page before it — and preserving what came out — is a mess. I need scaffolding."

**Goal:** Tools to import raw materials, structure them into issue workspaces, run deliberations, and export decision records.

**Success:** Reduced prep time; richer, more structured facilitation artifacts; outcomes that persist beyond the workshop.

---

## 4. User Stories & Acceptance Criteria

### Epic 1: Issue Workspace (Phase 1)

**Story 1.1: Create and structure an issue**
> As a planner, I want to create an issue workspace so that my team has a shared, structured home for everything we know about this problem.

**Acceptance Criteria:**
- [ ] User can create an issue with: title, description, scope, status, assigned community/organization
- [ ] Issue workspace has labeled sections: overview, stakeholders, claims, evidence, themes, conflicts, open questions, decisions
- [ ] Issue creation takes < 2 minutes for an experienced user
- [ ] Workspace is accessible to all members with appropriate permissions

---

**Story 1.2: Import raw materials**
> As a planner, I want to upload documents, transcripts, and survey responses so that I don't have to manually re-enter information that already exists.

**Acceptance Criteria:**
- [ ] Supports upload of: PDF, DOCX, TXT, CSV, audio transcript (auto-transcribed), pasted text
- [ ] Each uploaded source is listed in the evidence library with: title, source type, upload date, uploader
- [ ] Upload processing completes in < 60 seconds for files under 50MB
- [ ] Processing failure returns a clear error message with suggested remedy
- [ ] Sources are linkable from claims, themes, and perspectives

---

**Story 1.3: AI theme synthesis**
> As a planner, I want the platform to cluster uploaded content into themes so that I can see the landscape of perspectives without reading everything manually.

**Acceptance Criteria:**
- [ ] AI clusters content into 5–15 labeled themes per issue (configurable)
- [ ] Each theme shows: label, summary sentence, count of source passages, representative quotes
- [ ] User can rename, merge, split, or dismiss any theme
- [ ] AI confidence score is displayed per theme (e.g. "strong signal" / "weak signal")
- [ ] Themes are derived only from uploaded sources — no hallucinated content
- [ ] Source passages for each theme are viewable inline

---

**Story 1.4: Claim extraction**
> As a facilitator, I want to see individual claims extracted from the source material so that I can track what is asserted, who asserts it, and what evidence supports it.

**Acceptance Criteria:**
- [ ] AI extracts claims from uploaded sources and displays them in a claim list
- [ ] Each claim shows: claim text, claim type (fact / causal / value / preference / assumption), source, confidence
- [ ] User can accept, edit, or reject AI-extracted claims
- [ ] User can manually add claims
- [ ] Claims can be linked to evidence sources
- [ ] Claims can be tagged as contested (triggering a conflict entry)

---

**Story 1.5: Stakeholder identification and perspective mapping**
> As a planner, I want to identify stakeholder groups and map their perspectives so that I can see whose voices are present, whose are missing, and how perspectives differ.

**Acceptance Criteria:**
- [ ] User can create stakeholder groups with: name, description, power level (high/medium/low), affectedness level (high/medium/low)
- [ ] Each stakeholder group has a perspective page with fields: concerns, desired outcomes, epistemic stance, evidence trusted, interventions supported/opposed
- [ ] AI can suggest perspectives from uploaded source material (e.g. "residents expressing fear of displacement")
- [ ] Platform flags stakeholder groups that are mentioned in source material but have no perspective entry ("missing voice alert")
- [ ] Perspectives are editable by users with appropriate roles and flaggable as contested

---

**Story 1.6: Decision records**
> As a governance lead, I want to record decisions in a structured format so that future participants understand what was decided, why, and what was considered.

**Acceptance Criteria:**
- [ ] Decision record captures: decision outcome, date, options considered, decision criteria, evidence relied on, assumptions made, dissenting views, outcome indicators
- [ ] Decision records are linked to the issue workspace they belong to
- [ ] Decision records are immutable after finalization (edit-and-version, not overwrite)
- [ ] Decision records are searchable across all issues in an organization
- [ ] Any member can view decision records; only Decision Stewards can finalize them

---

**Story 1.7: Searchable collective memory**
> As a new member of an organization, I want to search across all past issues and decisions so that I can understand why things are the way they are.

**Acceptance Criteria:**
- [ ] Full-text search across: issue workspaces, claims, evidence, perspectives, decision records, themes
- [ ] Semantic search returns results ranked by relevance, not just keyword match
- [ ] Search results show: source type, issue, date, excerpt
- [ ] Search returns results in < 2 seconds for organizations with up to 500 issues
- [ ] Results are filtered by: type, date range, stakeholder group, status

---

### Epic 2: Deliberation & Perspectives (Phase 2)

**Story 2.1: Structured deliberation around objects**
> As a facilitator, I want to structure deliberation around specific claims, proposals, and causal links — not open comment threads — so that the dialogue stays focused and traceable.

**Acceptance Criteria:**
- [ ] Users can open a deliberation session on any claim, proposal, causal link, or assumption
- [ ] Deliberation shows: object being debated, current position summary, supporting arguments, opposing arguments, uncertainties, related evidence
- [ ] Contributions are typed (support / oppose / question / refine / add evidence)
- [ ] AI summarizes the state of deliberation on demand without closing it prematurely
- [ ] Deliberation can be marked as resolved, ongoing, or unresolved

---

**Story 2.2: Agreement and disagreement visualization**
> As a facilitator, I want to see where stakeholders agree and disagree so that I can focus facilitation energy on live conflicts rather than settled questions.

**Acceptance Criteria:**
- [ ] Platform displays agreement/disagreement map per issue: clustered by stance, not individual
- [ ] Conflict type classification is shown: factual / causal / value / distributional / procedural / epistemic / temporal
- [ ] Minority reports are preserved and visible — not averaged out
- [ ] Bridge statements (claims most groups agree on) are surfaced

---

### Epic 3: Systems Mapping (Phase 3)

**Story 3.1: Build causal loop diagrams collaboratively**
> As a systems mapper, I want to create causal loop diagrams collaboratively so that the group can see the system structure behind the issue, not just isolated causal claims.

**Acceptance Criteria:**
- [ ] Users can create variables, causal links, polarity (same / opposite direction), delays, and feedback loop annotations
- [ ] Causal links can have: confidence level, evidence attachment, "contested" flag
- [ ] Platform identifies and labels reinforcing loops (R) and balancing loops (B) automatically
- [ ] Map versions are saved; users can compare two versions side by side
- [ ] AI suggests possible variables and causal links from the issue workspace content (with explicit human validation step — not auto-populated)
- [ ] Maps are exportable as SVG/PNG

---

### Epic 4: Scenario Planning & Decision Support (Phase 4)

**Story 4.1: Build and compare scenarios**
> As a planner, I want to create scenario sets so that the group can explore possible futures and understand the assumptions and trade-offs behind each.

**Acceptance Criteria:**
- [ ] Users can create scenarios with: title, time horizon, narrative description, assumptions, likely winners/losers, equity implications, early warning indicators
- [ ] Scenarios can be compared side-by-side on configurable criteria
- [ ] Each scenario is linked to the issue workspace and relevant system maps
- [ ] AI can generate a draft "stress test" of assumptions for each scenario

---

### Epic 5: Monitoring & Adaptive Governance (Phase 5)

**Story 5.1: Track outcome indicators**
> As a city planner, I want to track outcome indicators linked to a decision so that the organization learns whether its assumptions were correct and can update its models.

**Acceptance Criteria:**
- [ ] Users can define indicators with: name, metric type, baseline, target, current value, data source, update frequency
- [ ] Indicators are linked to decisions and visible in the decision record
- [ ] Platform generates "assumption audit" alerts when indicator data diverges from expected trajectory
- [ ] Post-decision reviews can be scheduled and linked to the original decision record

---

## 5. Non-Goals

The following are explicitly out of scope for all five phases unless revisited:

- **Real-time chat or messaging.** The platform is not a communication tool. Users communicate through structured objects (claims, deliberations, proposals), not chat threads.
- **Vote-only polling.** Polling without deliberation, evidence, or reasoning structure is a known failure mode the platform is designed to avoid.
- **Simulation / agent-based modeling.** The platform supports qualitative causal modeling but does not simulate quantitative system dynamics (this is outside feasibility for v1–v3).
- **Native video or meeting hosting.** Integrations with meeting tools (Zoom transcripts, etc.) are in scope; hosting is not.
- **Social media functionality.** No follower graphs, engagement metrics, or algorithmic feeds. These are structurally incompatible with the platform's epistemic goals.
- **Anonymous public participation at scale (Phase 1).** Polis-style mass opinion gathering is a future direction, not v1 scope.
- **Automated decision-making.** AI never makes or records a decision. AI assists human deliberation; humans decide.

---

## 6. Product Roadmap Overview

| Phase | Name | Core Value | Target Launch |
|---|---|---|---|
| 1 | Issue Memory & AI Synthesis | Turn messy input into structured, searchable issue workspaces | Q3 2026 |
| 2 | Deliberation & Perspective Mapping | Help groups understand and navigate disagreement | Q1 2027 |
| 3 | Systems Mapping | Represent causal complexity collaboratively | Q3 2027 |
| 4 | Scenario Planning & Decision Support | Choose under uncertainty with legitimate governance | Q2 2028 |
| 5 | Monitoring & Adaptive Governance | Close the learning loop from decision to outcome | Q4 2028 |

---

## 7. Phase 1 — Issue Memory & AI Synthesis (MVP)

### Goal
Turn messy civic and organizational input — public comments, transcripts, surveys, documents, meeting notes — into a structured, transparent, source-backed issue workspace that supports legitimate deliberation and decision-making.

### Target Users
City planning teams, civic consultants, co-op boards, nonprofit coalitions, participatory budgeting programs.

### Core Value Proposition
> "Upload 500 comments, 12 meeting transcripts, 8 policy documents. Get a structured issue map that everyone can interrogate, contest, and trace."

### Feature Set

| Feature | Description | Priority |
|---|---|---|
| Issue workspace | Structured home for one complex issue | P0 |
| Document/transcript import | PDF, DOCX, TXT, CSV, pasted text | P0 |
| AI theme clustering | Surfaces themes from uploaded sources | P0 |
| AI claim extraction | Extracts typed claims (fact/causal/value/assumption) | P0 |
| Evidence library | Source-backed, searchable repository | P0 |
| Stakeholder identification | Groups with power/affectedness levels | P0 |
| Perspective mapping | Per-stakeholder concern, stance, and desired outcome | P0 |
| Missing voice alerts | Flags stakeholders mentioned but unrepresented | P1 |
| Decision records | Structured capture of formal/informal decisions | P0 |
| Collective memory search | Semantic search across all issues and decisions | P1 |
| AI synthesis panel | On-demand synthesis of issue state | P1 |
| Organization & member management | Roles, permissions, communities | P0 |

### Phase 1 User Flow

```
User uploads raw input (documents, transcripts, comments)
  ↓
AI processes and extracts: themes, claims, stakeholders, evidence
  ↓
Human review: accept / edit / reject / add to AI extractions
  ↓
Facilitator organizes: stakeholder map, perspective pages, evidence links
  ↓
Issue workspace is structured: claims, conflicts, open questions, options
  ↓
Decision record is created: outcome, rationale, assumptions, dissent
  ↓
Workspace is preserved in searchable collective memory
```

### Phase 1 Interface Surfaces

| Surface | Purpose |
|---|---|
| Issue workspace | Central page for one complex issue |
| Evidence library | Source-backed knowledge base with search |
| AI synthesis panel | Themes, clusters, missing perspectives |
| Stakeholder + perspective view | Who is involved and how they see it |
| Decision record view | Structured record of formal decisions |
| Organization memory | Cross-issue search and history |

---

## 8. Phase 2 — Deliberation & Perspective Mapping

### Goal
Help groups understand, navigate, and structure disagreement. Move from "what happened in this meeting?" to "what is the state of our collective understanding?"

### New Features

| Feature | Description |
|---|---|
| Structured deliberation sessions | Deliberate on claims, proposals, causal links — not comment threads |
| Contribution typing | Support / oppose / question / refine / add evidence |
| Conflict type classification | Factual / causal / value / distributional / procedural / epistemic |
| Agreement/disagreement visualization | Clustered map of where stakeholders agree or disagree |
| Minority report preservation | Explicitly surfaced dissenting positions that are not averaged out |
| Bridge statement detection | Claims with broad cross-stakeholder agreement |
| Facilitation workflow | Guided process for structured deliberation sessions |
| Proposal comparison | Side-by-side view of competing interventions |

---

## 9. Phase 3 — Systems Mapping

### Goal
Let communities represent the causal complexity behind issues — not as static diagrams, but as collaborative, evidence-backed, contestable models.

### New Features

| Feature | Description |
|---|---|
| Causal loop diagram builder | Variables, links, polarity, delays, feedback loop identification |
| Evidence-backed causal links | Each link can cite source material |
| Uncertainty annotations | Confidence level and contested flags on links |
| Map versioning | Save, compare, and restore map versions |
| AI-assisted cartography | AI suggests variables/links; humans validate — not auto-populate |
| Multi-map support | Stakeholder maps, influence maps, theory of change maps |
| Map-to-issue linkage | Maps are browsable from issue workspaces |

### Map Types Supported

| Map Type | Use |
|---|---|
| Causal loop diagram | Feedback dynamics |
| Stakeholder map | Who is involved, affected, powerful, excluded |
| Influence map | Power, incentives, dependency |
| Theory of change map | How interventions are expected to work |
| Conflict map | Where values, interests, or facts clash |

---

## 10. Phase 4 — Scenario Planning & Decision Support

### Goal
Help groups explore possible futures and make legitimate, traceable decisions under uncertainty.

### New Features

| Feature | Description |
|---|---|
| Scenario builder | Create scenarios with assumptions, narratives, winners/losers |
| Scenario comparison | Side-by-side on configurable criteria |
| Decision matrix | Structured comparison of interventions across criteria |
| Trade-off visualization | Surfacing what different choices gain and sacrifice |
| Decision rules configuration | Consent, consensus, majority vote, ranked choice, quadratic voting |
| Participatory budgeting support | Structured allocation process with proposal tracking |
| Legitimacy checks | Surfacing stakeholder objections before decision finalization |

---

## 11. Phase 5 — Monitoring & Adaptive Governance

### Goal
Close the governance learning loop: from decision to action to monitoring to model update.

### New Features

| Feature | Description |
|---|---|
| Outcome indicators | Defined metrics linked to decisions |
| Indicator dashboard | Track current vs baseline vs target over time |
| Assumption audits | Alert when indicators diverge from expected trajectory |
| Post-decision reviews | Scheduled reviews linked to original decision records |
| Model drift alerts | Flagging when a system map's assumptions are now stale |
| Institutional learning reports | AI-synthesized summaries of what the organization has learned |

### The Core Learning Loop (Platform-Level Goal)

```
Perceive → Interpret → Model → Deliberate → Decide → Act → Monitor → Learn → Perceive
```

Phase 5 closes the loop between Act and Perceive, making the platform a learning system rather than a consultation tool.

---

## 12. AI System Requirements

### 12.1 AI Capabilities

| Capability | Description | Phase |
|---|---|---|
| Document ingestion & chunking | Extract structured content from PDFs, DOCX, transcripts | 1 |
| Theme clustering | Group passages by semantic similarity; surface labels and confidence | 1 |
| Claim extraction | Identify and type claims (fact/causal/value/assumption/preference) | 1 |
| Stakeholder detection | Identify referenced stakeholder groups from text | 1 |
| Perspective synthesis | Synthesize per-stakeholder concerns from scattered mentions | 1 |
| Agreement/disagreement analysis | Map where stakeholders converge or diverge | 2 |
| Conflict type classification | Classify disagreements by type (factual/value/causal/etc.) | 2 |
| Causal variable suggestion | Propose variables and links for system maps | 3 |
| Assumption stress testing | Generate adversarial questions for scenario assumptions | 4 |
| Institutional memory retrieval | Answer "have we debated this before?", "what did we decide?" | 1 |
| Uncertainty flagging | Flag claims lacking evidence, overconfident language, stale data | 1 |

### 12.2 AI Design Rules

1. **AI may propose structure; humans must validate structure.** AI extractions are surfaced as drafts. No AI-generated content becomes canonical without explicit human acceptance.

2. **Every AI synthesis must expose:** source material, confidence level, excluded content, minority views, assumptions, and alternative interpretations.

3. **Preserve plurality before synthesis.** AI should not summarize too early. Minority perspectives, emotional stakes, lived experience, and uncertainty must survive the synthesis step.

4. **AI is an epistemic safety system, not a productivity shortcut.** The primary AI value is helping groups see more — not deciding faster by flattening difference.

5. **Treat AI disagreement analysis as structured data, not resolution.** Classifying a conflict as "causal" does not resolve it. It makes it investigable.

### 12.3 AI Risk Mitigations

| Risk | Description | Mitigation |
|---|---|---|
| False consensus | AI over-summarizes disagreement | Preserve and surface minority reports; show disagreement count |
| Epistemic laundering | AI makes weak claims sound authoritative | Source-linked claims; confidence scores required |
| Depoliticization | Value conflicts appear technical | Explicit value conflict classification; values are not reducible to claims |
| Bias amplification | Dominant voices shape summaries | Stakeholder-weighted synthesis options; missing voice alerts |
| Premature closure | AI pushes toward decision too quickly | Open uncertainties must be explicitly resolved before decision finalization |
| Legibility capture | Only machine-readable input counts | Preserve narrative testimony as first-class evidence |

### 12.4 Evaluation Strategy

**Phase 1 AI benchmarks:**

| Metric | Method | Target |
|---|---|---|
| Theme recall | Human raters label themes independently; compare to AI | ≥ 80% recall |
| Claim accuracy | Human spot-check 50 claims per issue for correctness | ≥ 85% accurate |
| Stakeholder coverage | Compare AI-identified stakeholders to human-identified list | ≥ 90% recall |
| False consensus rate | Human review of synthesis outputs for suppressed minority views | < 10% suppression rate |
| Hallucination rate | Claims that cannot be traced to source material | 0% tolerance |

---

## 13. Technical Architecture

### 13.1 High-Level Architecture

```
Web Application (Collaborative Interface)
        ↓
Application API Layer
        ↓
┌─────────────────────────────────────────┐
│ Identity & Permissions    │ AI Orchestration Layer          │
│ Relational DB (core data) │ ├─ LLM Providers (TBD)          │
│ Graph DB (relationships)  │ ├─ Embedding Models              │
│ Vector Store (semantic)   │ ├─ Classification Models         │
│ Document Store (files)    │ └─ Synthesis Pipelines           │
│ Analytics Engine          │                                  │
└─────────────────────────────────────────┘
        ↓
Integration Layer
├─ Document sources (Google Docs, SharePoint, PDF)
├─ Meeting transcripts (Zoom, Teams, Otter)
├─ Survey tools (import)
├─ Chat platforms (Slack, Discord import)
└─ GIS / Open Data (Phase 3+)
```

### 13.2 Storage Strategy

| Store | Use |
|---|---|
| Relational DB | Organizations, members, issues, proposals, decisions, permissions, indicators |
| Graph DB | Stakeholders, claims, variables, causal links, evidence networks, feedback loops |
| Vector Store | Semantic search across transcripts, comments, documents, decision memory |
| Document Store | Files, source materials, attachments |
| Analytics Engine | Indicators, time series, monitoring (Phase 5) |

The domain is inherently graph-like: issues link to claims; claims link to evidence; evidence links to stakeholders; variables link to causal loops; decisions link to outcomes. A pure relational model would require excessive join complexity for the core query patterns.

### 13.3 Interface Surfaces

| Surface | Phase | Purpose |
|---|---|---|
| Issue workspace | 1 | Central structured home for one complex issue |
| Evidence library | 1 | Source-backed knowledge base |
| AI synthesis panel | 1 | Themes, clusters, missing perspectives |
| Stakeholder + perspective view | 1 | Who is involved, how they see the issue |
| Decision record view | 1 | Structured capture of decisions |
| Organization memory | 1 | Cross-issue semantic search |
| Deliberation room | 2 | Structured dialogue sessions |
| Map canvas | 3 | Systems, causal, stakeholder, conflict maps |
| Scenario studio | 4 | Futures and scenario comparison |
| Decision table | 4 | Intervention comparison and decision support |
| Indicator dashboard | 5 | Outcomes and feedback |
| Memory timeline | 5 | Past decisions, lessons, model changes |

### 13.4 Security & Privacy

- **Role-based access control** at organization, issue, and object level
- **Data residency options** for government and enterprise clients (TBD by region)
- **Audit log** for all AI syntheses and decision record changes
- **Immutable decision records** — finalized decisions are versioned, not overwritten
- **Contributor privacy options** — perspectives and contributions can be attributed to stakeholder group rather than individual name (configurable per community)
- **Source material retention policy** configurable by organization
- Compliance with GDPR and CCPA as baseline; government-specific compliance (FedRAMP, CJIS) as future enterprise tier

---

## 14. Domain Model

### Core Entities

| Entity | Description |
|---|---|
| Community | City, co-op, organization, neighborhood, network |
| Member | Person with role, affiliation, and permissions |
| Issue | A complex concern requiring shared understanding |
| StakeholderGroup | Person, group, role, institution, or affected public |
| Perspective | Stakeholder-specific interpretation of the issue |
| Claim | A proposition (typed: fact / causal / value / assumption / preference) |
| Evidence | Source, dataset, testimony, document, observation |
| Theme | AI-synthesized cluster of related content |
| Variable | A factor in a system map |
| CausalLink | Directional, polarized, weighted, contestable relationship between variables |
| FeedbackLoop | Reinforcing or balancing loop within a system map |
| SystemMap | Versioned collaborative model |
| Deliberation | Structured discussion around a specific object |
| Contribution | A typed input to a deliberation |
| Proposal | A candidate intervention or policy |
| Decision | Formal or informal collective choice with traceable reasoning |
| DecisionRecord | Immutable structured record of a decision |
| Scenario | Possible future state or pathway |
| Indicator | Tracked metric linked to a decision |
| Assumption | Belief used in reasoning but not fully established |
| Uncertainty | Explicit representation of unknown or contested information |

### Phase 1 Simplified Model

For the MVP, start with a subset:

```
Organization → Issue → Source (uploads)
Issue → Theme → Claim → Evidence
Issue → StakeholderGroup → Perspective
Issue → Proposal → DecisionRecord
Issue → Uncertainty
```

---

## 15. Governance Model (Platform Roles)

| Role | Capabilities |
|---|---|
| Participant | Submit perspectives, claims, evidence, deliberation contributions |
| Facilitator | Structure deliberation, merge duplicates, guide process, add stakeholders |
| Mapper | Create and edit system maps |
| Evidence Steward | Curate sources, assess credibility, flag stale evidence |
| Moderator | Enforce norms, flag harmful content |
| Decision Steward | Manage decision workflow, finalize decision records |
| Memory Steward | Maintain archives, update stale maps, curate institutional learning |
| Admin | Configure community, permissions, integrations, billing |
| AI Auditor | Review AI outputs, flag bias, hallucinations, false consensus |

**Design rule:** No role is siloed. Every member can view all non-private content. Role differentiation governs creation and finalization, not visibility.

### Decision Modes (Configurable Per Community)

- Consent (no strong objections)
- Consensus (full agreement)
- Majority vote
- Supermajority
- Ranked choice
- Quadratic voting
- Sortition panel recommendation
- Delegated decision
- Participatory budgeting
- Advisory deliberation with ratifying council

The platform makes the governance logic explicit and configurable. It does not impose one model.

---

## 16. Design Principles

### 1. Preserve plurality before synthesis
Capture minority perspectives, emotional stakes, lived experience, uncertainty, and context before any synthesis step. Synthesis is a derivative view, not the primary record.

### 2. Make claims source-backed
Every claim must be traceable to a person, document, dataset, testimony, study, or model. AI-generated claims that cannot be sourced are not surfaced.

### 3. Separate facts, values, assumptions, and preferences
The platform explicitly distinguishes:
- **Fact:** Median rent increased 18%.
- **Causal claim:** Short-term rentals contributed to rent increases.
- **Value:** Housing should be treated as a human need.
- **Preference:** I support banning short-term rentals.
- **Assumption:** Banning short-term rentals will return units to long-term rental supply.
- **Uncertainty:** We do not know how many units would actually convert.

### 4. Treat disagreement as structured data
Disagreement is not buried in comment threads. It becomes visible as: contested claims, contested causal links, contested values, contested evidence, contested priorities.

### 5. Keep humans coupled to the situation
The platform keeps people coupled to: affected communities, system dynamics, consequences, trade-offs, uncertainty, lived experience, and prior decisions. The interface should never make complexity disappear — it should make it navigable.

### 6. Contestability by default
Every AI synthesis, every claim, every map, and every decision record must be contestable: users can annotate, flag, dispute, or provide alternative interpretations.

### 7. Institutional memory as living document
Decision records and issue workspaces are not archives. They are live, searchable, linkable objects that connect to current issues, open questions, and outcome indicators.

---

## 17. Competitive Landscape

| Category | Examples | Limitation |
|---|---|---|
| Deliberation platforms | Polis, Loomio, Decidim | Weak systems modeling; no causal maps; limited memory |
| Collaborative whiteboards | Miro, FigJam, Kumu | Weak memory, governance, evidence structure |
| Knowledge bases | Notion, Confluence | Weak deliberation; no causal modeling; no governance workflows |
| Survey tools | Typeform, SurveyMonkey | Weak synthesis; no governance |
| BI dashboards | Tableau, PowerBI | Data display without plural interpretation or deliberation |
| AI meeting tools | Fireflies, Otter, Granola | Summaries without institutional reasoning or decision memory |
| Civic engagement tools | CitizenLab, Commonplace | Participation without deep sensemaking or causal modeling |
| Participatory budgeting | Pol.is, Participatory Budgeting Project | Scoped to allocation; no systems mapping or issue memory |

**Key differentiator:** No existing tool closes the full loop from raw input → structured issue map → stakeholder perspectives → deliberation → decision record → monitored outcome. This platform is the first designed around that full cycle as a single coherent system.

**Closest inspiration:** Polis (opinion mapping at scale) + Kumu (systems mapping) + Loomio (structured decision-making) + institutional memory + AI synthesis. But the proposed platform is designed around these as integrated capabilities, not bolted-together tools.

---

## 18. Business Model

### Pricing Models

| Model | Fit | Notes |
|---|---|---|
| SaaS per organization | Cities, nonprofits, co-ops, consultancies | Tiered by members, issues per year, storage |
| Per issue workspace | Public engagement consultants billing per project | Enables project-scoped purchasing |
| Enterprise civic license | Large municipalities, regional agencies | Custom pricing, data residency, dedicated support |
| Foundation-sponsored deployments | Community coalitions with philanthropic funding | Subsidized access; foundation pays license |
| Open-core | Public-interest legitimacy; community trust | Core platform open-source; advanced AI and enterprise features paid |

### Structural Recommendation

This platform mediates public understanding and institutional memory. Its governance and incentive structure should be coherent with that mission. A steward-owned, open-core, or public-benefit model is strongly preferred over pure venture capital logic. A platform structurally incentivized to maximize engagement, retention, or data extraction is in tension with its epistemic goals.

**Recommended initial structure:** Delaware Public Benefit Corporation or cooperative ownership, with open-core licensing for the base platform and commercial licensing for AI synthesis, enterprise integrations, and advanced governance features.

### Go-to-Market

**Phase 1 channels:**
- Direct sales to city innovation offices and planning departments (high-value, long cycle)
- Partnership with civic engagement consultancies (use platform as infrastructure for their practice)
- Community of practice marketing: systems thinkers, participatory planners, co-op governance practitioners
- Foundation grants for initial deployments (pilot partnerships with climate resilience, housing, or equity-focused funders)

---

## 19. Success Metrics

### Phase 1 (12 months post-launch)

| Metric | Measurement | Target |
|---|---|---|
| ARR | Sum of active annual contracts | $500K |
| Issue workspaces completed | Issues with all core sections filled and a decision record | 200 |
| Decisions recorded | Formal decisions with rationale, assumptions, and outcome indicators | 100 |
| Stakeholder coverage | % of identified stakeholder groups with filled perspective pages per completed workspace | ≥ 75% |
| Organizational retention | Organizations renewing after first issue cycle completes | ≥ 70% |
| AI accuracy | Human spot-check of AI-extracted claims and themes | ≥ 85% |
| Time-to-workspace | Time from account creation to first issue workspace with AI synthesis | < 30 minutes |

### Long-Term Platform Health Indicators

- Institutional memory reuse rate (searches against past decisions)
- Average stakeholder diversity score per workspace (breadth of represented groups)
- Contested AI synthesis rate (% of syntheses where humans added corrections)
- Decision traceability completeness (% of decisions with rationale + evidence + dissent)
- Post-decision review completion rate (Phase 5)

---

## 20. Risks & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| AI hallucination in claim extraction | High | Medium | Zero-tolerance policy; every claim requires source trace; human validation required before claim becomes canonical |
| AI false consensus suppressing minority views | High | High | Deliberate design: minority reports surfaced by default; clustering shows distribution, not averages |
| Platform becomes glorified document dump | Medium | High | Issue workspace completion scoring; missing voice alerts; facilitation guidance built into UX |
| Government procurement cycles delay revenue | High | High | Lead with consultancy and co-op segment to build revenue while gov pipeline develops |
| Complexity overwhelms Phase 1 users | Medium | Medium | Opinionated defaults, guided onboarding, facilitation templates; start with 1 issue at a time |
| Data privacy concerns in government deployments | High | Medium | Data residency options, GDPR/CCPA compliance baseline, on-premise option roadmapped |
| AI costs at scale (synthesis per issue) | Medium | Medium | Cache intermediate embeddings; batch synthesis; tiered AI depth by plan |
| Graph DB complexity slows Phase 1 development | Medium | Low | Start with relational DB for Phase 1; migrate to graph progressively as causal maps are introduced in Phase 3 |
| Low participation in deliberation features | Medium | Medium | Phase 2 is gated on Phase 1 traction; deliberation features follow demonstrated engagement |
| Competitive response from Notion/Confluence with AI | Low | Medium | The moat is not AI summarization — it is the structured domain model, governance workflows, and institutional memory designed for collective sensemaking, not knowledge bases |

---

## Appendix A: Example Issue Workspace (Housing Affordability)

**Issue:** Housing affordability crisis in a mid-size city

**System Drivers:**
- Rent burden rising fastest among households below 80% AMI
- New market-rate supply may reduce regional pressure but increase local displacement without protections
- Permitting delays, land costs, financing, zoning, and neighborhood opposition interact
- Stakeholders disagree about whether the core problem is scarcity, speculation, wages, or public underinvestment

**Stakeholder Perspectives:**
- Renters: fear displacement and instability
- Homeowners: fear neighborhood change and parking pressure
- Developers: cite permitting delays and financing costs
- Housing advocates: emphasize social housing and tenant protections
- Environmental groups: support density near transit
- Small businesses: worry about labor force displacement

**Contested Causal Links:**
- Upzoning → affordability
- Rent control → housing supply
- Short-term rentals → rent burden
- Public housing → neighborhood stability

**Decision Options:**
1. Upzone transit corridors
2. Create social housing authority
3. Expand community land trust
4. Restrict short-term rentals
5. Tenant right-to-counsel
6. Parking reform

**Outcome Indicators:**
- Rent burden (% of income on rent by AMI band)
- Eviction filings per month
- Vacancy rate
- New units by affordability level
- Displacement by census tract

---

*This PRD is a living document. Major revisions should be versioned and linked to this document. Decisions that modify scope, timeline, or success metrics should be recorded as Decision Records within the platform itself.*
