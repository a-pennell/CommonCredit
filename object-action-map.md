# Object–Action Map
## Collective Sensemaking Platform

Objects are the platform's core nouns. Actions are the verbs users perform on them.
Organized by domain area, then by phase introduced.

---

## Legend

**Action categories:**
- **Core** — fundamental CRUD and lifecycle operations
- **Domain** — platform-specific business operations
- **AI** — AI-assisted actions (always require human confirmation)
- **Governance** — role-gated operations affecting legitimacy or permanence

---

## Domain Area 1: Workspace & Organization

### Organization
| Action | Category | Notes |
|---|---|---|
| Create | Core | |
| View | Core | |
| Edit (name, type, settings) | Core | Admin only |
| Archive | Core | Admin only |
| Configure decision modes | Governance | Which modes are available to communities within |
| Configure role permissions | Governance | Admin only |
| Export all data | Core | Admin only |
| Invite Member | Core | |
| Remove Member | Core | Admin only |

---

### Member
| Action | Category | Notes |
|---|---|---|
| Invite | Core | |
| View profile | Core | |
| Edit profile | Core | Self only |
| Assign Role | Governance | Admin only |
| Change Role | Governance | Admin only |
| Deactivate | Core | Admin only |

---

### Issue
| Action | Category | Notes |
|---|---|---|
| Create | Core | |
| View | Core | |
| Edit (title, description, scope, status) | Core | |
| Archive | Core | |
| Delete | Core | Admin only; only before publishing |
| Publish | Domain | Makes workspace visible to all participants |
| Duplicate | Domain | Clone structure without source material |
| Link to Issue | Domain | Connect related issues |
| Set Status | Domain | Draft / Active / Deliberating / Decided / Monitoring |
| Generate synthesis | AI | Full-issue AI summary on demand |
| Export | Core | PDF or structured JSON |

---

## Domain Area 2: Source Material & Evidence

### Source (uploaded document / transcript / dataset)
| Action | Category | Notes |
|---|---|---|
| Upload | Core | PDF, DOCX, TXT, CSV, audio |
| Import via URL | Core | Link to web resource |
| Paste text | Core | Inline input |
| View | Core | |
| Download | Core | |
| Edit metadata | Core | Title, source type, date, credibility rating |
| Tag | Domain | Link to stakeholder group or theme |
| Archive | Core | |
| Process | AI | Trigger extraction of claims, themes, stakeholders |
| Re-process | AI | Re-run extraction after edits |

---

### Evidence Link
| Action | Category | Notes |
|---|---|---|
| Create | Core | Attach a source to a claim or causal link |
| View | Core | |
| Remove | Core | |
| Annotate | Domain | Add context note to the link |
| Dispute | Domain | Flag the evidence as contested or unreliable |

---

## Domain Area 3: Sensemaking Objects

### Theme
| Action | Category | Notes |
|---|---|---|
| Generate | AI | Cluster source content into labeled themes |
| Accept | Governance | Confirm AI-generated theme as canonical |
| Edit | Core | Rename, revise description |
| Reject | Core | Dismiss AI-generated theme |
| Merge | Domain | Combine two themes into one |
| Split | Domain | Divide one theme into two |
| Link Claims | Domain | Associate claims with a theme |

---

### Claim
| Action | Category | Notes |
|---|---|---|
| Create | Core | Manual entry |
| Extract | AI | AI-generated from source material; requires human acceptance |
| Accept | Governance | Confirm extracted claim as canonical |
| Edit | Core | |
| Reject | Core | Dismiss extracted claim |
| Classify | Domain | Type: Fact / Causal / Value / Assumption / Preference |
| Contest | Domain | Mark claim as disputed; triggers Conflict entry |
| Link Evidence | Domain | Attach supporting source(s) |
| Link to Theme | Domain | |
| Archive | Core | |

---

### Assumption
| Action | Category | Notes |
|---|---|---|
| Create | Core | |
| Edit | Core | |
| Mark as Tested | Domain | Record outcome of testing the assumption |
| Mark as Violated | Domain | Record that the assumption was proven wrong |
| Link to Claim | Domain | |
| Link to Decision | Domain | |
| Link to Scenario | Domain | |
| Archive | Core | |

---

### Uncertainty
| Action | Category | Notes |
|---|---|---|
| Create | Core | |
| Edit | Core | |
| Classify | Domain | Type: data gap / model / value / future / contested |
| Resolve | Domain | Mark as resolved with explanation |
| Escalate | Domain | Elevate as a blocking uncertainty requiring deliberation |
| Link to Claim | Domain | |
| Link to Causal Link | Domain | |

---

## Domain Area 4: Stakeholder & Perspective

### Stakeholder Group
| Action | Category | Notes |
|---|---|---|
| Create | Core | |
| Edit (name, description, power level, affectedness) | Core | |
| Delete | Core | |
| Assign Members | Domain | Link platform members to a group |
| Flag as Missing | Domain | Mark a group as identified but unrepresented |
| Link to Issue | Domain | |

---

### Perspective
| Action | Category | Notes |
|---|---|---|
| Create | Core | Per stakeholder group × issue |
| Edit | Core | |
| Publish | Governance | Make perspective visible to all |
| Draft (AI) | AI | Generate draft perspective from source mentions |
| Contest | Domain | Flag perspective as misrepresenting the group |
| Link Claims | Domain | Associate claims that originate from this perspective |
| Annotate | Domain | Add facilitator notes |

---

## Domain Area 5: Deliberation

### Deliberation
| Action | Category | Notes |
|---|---|---|
| Open | Governance | Facilitator or Decision Steward initiates |
| Close | Governance | |
| Suspend | Governance | Pause without closing |
| Reopen | Governance | |
| Configure | Domain | Format, facilitation mode, decision rule |
| Invite Participants | Domain | |
| Summarize (AI) | AI | On-demand synthesis of current deliberation state |
| Link Object | Domain | Attach deliberation to a claim, proposal, causal link, or assumption |

---

### Contribution
| Action | Category | Notes |
|---|---|---|
| Submit | Core | |
| Edit | Core | Within edit window only |
| Retract | Core | |
| Classify | Domain | Type: Support / Oppose / Question / Refine / Add Evidence |
| Endorse | Domain | Signal agreement without adding new content |
| Flag | Domain | Flag for moderation |

---

## Domain Area 6: Systems Mapping *(Phase 3)*

### System Map
| Action | Category | Notes |
|---|---|---|
| Create | Core | |
| Edit | Core | |
| Publish | Governance | Make visible to all participants |
| Version | Domain | Save a named snapshot |
| Compare Versions | Domain | Side-by-side diff of two versions |
| Clone | Domain | Fork map for alternate model exploration |
| Export | Core | SVG, PNG |
| Link to Issue | Domain | |
| Archive | Core | |

---

### Variable
| Action | Category | Notes |
|---|---|---|
| Create | Core | |
| Edit | Core | |
| Delete | Core | |
| Link (as source or target of Causal Link) | Domain | |
| Suggest | AI | AI proposes variables from issue workspace |

---

### Causal Link
| Action | Category | Notes |
|---|---|---|
| Create | Core | Connect two variables |
| Edit | Core | |
| Delete | Core | |
| Set Polarity | Domain | Same direction (+) / Opposite direction (–) |
| Set Strength | Domain | Strong / Moderate / Weak |
| Add Delay | Domain | Mark that effect takes time |
| Set Confidence | Domain | High / Medium / Low / Unknown |
| Contest | Domain | Flag as disputed |
| Link Evidence | Domain | |
| Suggest | AI | AI proposes links from issue workspace |

---

### Feedback Loop
| Action | Category | Notes |
|---|---|---|
| Identify | Domain | Auto-detect or manually mark a loop |
| Classify | Domain | Reinforcing (R) / Balancing (B) |
| Name | Core | |
| Annotate | Domain | Add explanatory note |
| Link to Issue | Domain | Surface loop in issue workspace |

---

## Domain Area 7: Proposals & Decisions

### Proposal
| Action | Category | Notes |
|---|---|---|
| Draft | Core | |
| Submit | Domain | Make visible to participants |
| Revise | Core | |
| Support | Domain | Signal backing |
| Oppose | Domain | Signal objection with reason |
| Compare | Domain | Side-by-side against other proposals |
| Advance to Decision | Governance | Decision Steward moves proposal to decision workflow |
| Archive | Core | |

---

### Decision Record
| Action | Category | Notes |
|---|---|---|
| Draft | Core | |
| Record Outcome | Domain | |
| Record Options Considered | Domain | |
| Record Criteria | Domain | |
| Record Assumptions | Domain | |
| Record Dissent | Domain | Explicitly capture minority objections |
| Record Evidence Used | Domain | |
| Finalize | Governance | Immutable after this point |
| Link Indicators | Domain | |
| Schedule Review | Domain | Set a post-decision review date |
| Export | Core | PDF or structured JSON |

---

## Domain Area 8: Scenario Planning *(Phase 4)*

### Scenario
| Action | Category | Notes |
|---|---|---|
| Create | Core | |
| Edit | Core | |
| Add Assumptions | Domain | |
| Publish | Governance | |
| Compare | Domain | Side-by-side against other scenarios |
| Stress Test | AI | AI generates adversarial questions against scenario assumptions |
| Archive | Core | |

---

## Domain Area 9: Monitoring *(Phase 5)*

### Indicator
| Action | Category | Notes |
|---|---|---|
| Define | Core | Set name, metric type, baseline, target, source, frequency |
| Update | Domain | Add a new data point |
| Link to Decision | Domain | |
| Trigger Alert | Domain | Automated when actual diverges from expected |
| Resolve Alert | Domain | Acknowledge and explain divergence |

---

## Cross-Cutting Actions (apply across multiple objects)

| Action | Applies To | Notes |
|---|---|---|
| Comment | Issues, Claims, Maps, Decisions | Free-form annotation |
| Mention (@) | All objects | Notify a member |
| History / Changelog | All objects | Audit log of changes |
| Search | All objects | Full-text and semantic |
| Share / Permalink | All objects | Stable URLs for direct linking |
| Restore from History | All editable objects | Roll back to a prior version |
| Bulk Import | Sources, Claims, Stakeholders | Structured CSV/JSON import |
| Bulk Export | All | Full data portability |

---

## Action × Role Matrix (Phase 1)

| Action | Participant | Facilitator | Evidence Steward | Decision Steward | Admin |
|---|---|---|---|---|---|
| Create Issue | ✓ | ✓ | — | ✓ | ✓ |
| Publish Issue | — | ✓ | — | ✓ | ✓ |
| Upload Source | ✓ | ✓ | ✓ | ✓ | ✓ |
| Accept AI Claim | — | ✓ | ✓ | ✓ | ✓ |
| Create Stakeholder Group | ✓ | ✓ | — | ✓ | ✓ |
| Edit Perspective | ✓ (own group) | ✓ | — | ✓ | ✓ |
| Contest Claim | ✓ | ✓ | ✓ | ✓ | ✓ |
| Open Deliberation | — | ✓ | — | ✓ | ✓ |
| Submit Contribution | ✓ | ✓ | ✓ | ✓ | ✓ |
| Draft Decision Record | — | — | — | ✓ | ✓ |
| Finalize Decision Record | — | — | — | ✓ | ✓ |
| Record Dissent | ✓ | ✓ | ✓ | ✓ | ✓ |
| Configure Org | — | — | — | — | ✓ |
