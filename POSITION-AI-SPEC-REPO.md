# Position Paper: An AI-Driven GitHub-Like Repository as an Abstraction Layer for All Specifications

**Status:** Draft for community review  
**Author:** Konrad Lanz (GrEEV.com KG / ETSI)  
**Date:** 2026-05  
**Repository:** https://github.com/KonradLanz/historic-email-vcard-rfc

---

## Abstract

This paper proposes an AI-assisted, GitHub-like repository system that acts as a **universal abstraction layer** over all technical specifications — RFCs, ISO norms, ETSI standards, W3C Recommendations, microformat wikis, and open-source documentation. The system allows any stakeholder to open a single Pull Request (PR) that the AI layer decomposes into coordinated downstream change proposals across every affected specification and implementation, tracks their lifecycle, and synthesises consensus signals back to the originator. The goal is to reduce the latency and expertise barrier for cross-cutting changes from years to weeks.

---

## 1. Motivation

Interoperability standards are deeply interdependent. A single gap — such as the absence of a `HISTORIC` type parameter on the `EMAIL` property in RFC 6350 — propagates across:

- the RFC itself (syntax, semantics)
- one or more server implementations (Kolab, Dovecot, Nextcloud)
- one or more client implementations (Thunderbird/CardBook, Apple Contacts, Evolution)
- a JSON serialisation spec (jCard, RFC 7095)
- a microformat convention (h-card)
- potentially a UI accessibility guideline (screen-reader semantics for "historic" address)

Today, a person who identifies this gap must:

1. Discover that five separate venues govern the change.
2. Subscribe to five mailing lists or GitHub organisations.
3. Write five separate, appropriately formatted proposals.
4. Attend (or at least read) five separate review processes.
5. Wait for the slowest of the five to converge before shipping an end-to-end solution.

This is not a coordination failure of individuals; it is a *structural* failure of the specification ecosystem. AI assistance and a unified repository model can fix it.

---

## 2. The Proposed System

### 2.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│            AI-SPEC-REPO  (abstraction layer)             │
│                                                          │
│  ┌────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │  Unified   │   │  AI Change   │   │  Cross-Repo   │  │
│  │  PR Inbox  │──▶│  Decomposer  │──▶│  PR Tracker   │  │
│  └────────────┘   └──────────────┘   └───────────────┘  │
│        │                                     │           │
│        ▼                                     ▼           │
│  ┌────────────┐                    ┌─────────────────┐   │
│  │  Spec      │                    │  Status Board   │   │
│  │  Knowledge │                    │  (all upstreams)│   │
│  │  Graph     │                    └─────────────────┘   │
│  └────────────┘                                          │
└──────────────────────────────────────────────────────────┘
         │                │               │
         ▼                ▼               ▼
   IETF Datatracker   GitHub repos   Microformat wiki
   (RFC drafts)       (code PRs)     (wiki edits)
```

### 2.2 Core Components

#### 2.2.1 Unified PR Inbox

Any stakeholder — an individual developer, a standards body member, or an AI assistant itself — opens a PR in the AI-Spec-Repo with a *human-readable* description of the desired change. No knowledge of the downstream venues is required at this stage. Example:

```
Title: Allow marking an email address in a vCard as historic
Body:  When a contact has changed email addresses, clients should
       still be able to link old messages to the contact, but the
       old address should not appear in autocomplete for new mail.
```

#### 2.2.2 AI Change Decomposer

An LLM-based agent with access to the Spec Knowledge Graph:

1. **Identifies** all specifications and implementations that must change.
2. **Drafts** each downstream change in the format required by that venue (Internet-Draft XML for IETF, Markdown diff for GitHub, wiki-edit diff for microformats).
3. **Opens** draft PRs or issues in all downstream venues, cross-referencing the parent PR.
4. **Generates** a test-suite stub that implementations can use to verify conformance.

#### 2.2.3 Spec Knowledge Graph

A graph database mapping:

- Specifications → sections → normative text
- Implementations → features → referenced spec sections
- Dependencies between specifications (RFC A normatively references RFC B)
- Implementation status per spec section

This graph is maintained through a combination of automated ingestion (Datatracker API, GitHub indexing) and human curation via PRs to the graph itself.

#### 2.2.4 Cross-Repo PR Tracker

Aggregates status from all downstream venues:

```
Parent PR #42: "Historic email address in vCard"
├── RFC 6350 amend — IETF draft-lanz-vcard-historic-00   [OPEN, AD review]
├── RFC 6352 amend — IETF draft-lanz-carddav-historic-00 [OPEN, WG last call]
├── CardBook MR !774                                      [MERGED ✓]
├── Kolab PR #2891                                        [OPEN, review requested]
├── Microformats wiki proposal                            [OPEN, discussion]
└── Test suite PR                                         [MERGED ✓]
```

The parent PR cannot be marked `DONE` until all children reach terminal states.

---

## 3. Analogy: Package Managers for Specifications

Software package managers (npm, pip, cargo) solved the analogous problem for code dependencies: a single `package.json` entry coordinates transitive dependency resolution. The AI-Spec-Repo is a *change-propagation manager* for specifications — a `spec.lock` file that pins the set of coordinated changes required to implement a cross-cutting feature.

---

## 4. Relationship to Existing Infrastructure

| Existing tool | Role in the new system |
|---|---|
| IETF Datatracker | Downstream venue for RFC drafts; API provides status |
| GitHub / GitLab / Forgejo | Downstream venue for code changes and spec repos |
| W3C GitHub repos | Downstream venue for W3C Recommendations |
| Microformats wiki | Downstream venue; bridged via wiki-API or PR-to-git |
| ETSI portal | Downstream venue; ETSI STF work items |
| IANA registries | Side-effect venue for new parameter registration |

The AI-Spec-Repo does not replace any of these; it orchestrates across them.

---

## 5. Governance and Trust

The abstraction layer must not become a bottleneck or a single point of capture:

- The system itself is **open-source**, self-hostable (Forgejo-compatible), and governed by a multi-stakeholder board.
- AI-drafted downstream proposals are clearly labelled `[AI-draft, human review required]`.
- The AI may *propose* but never *merge* — all downstream merges require human approval in the downstream venue.
- The Spec Knowledge Graph is a **public commons**, curated via PRs with the same review standards as the specs themselves.
- **Privacy:** No personal data is stored beyond what is already public in specifications and commit logs.

---

## 6. Phased Rollout

### Phase 1 — Manual coordination layer (now)
This repository. Human-maintained cross-reference table. Manual upstream PRs. Demonstrates the value of linked change tracking.

### Phase 2 — Semi-automated tracking
A bot (GitHub Actions / Forgejo CI) monitors downstream PRs, updates the status table automatically, and pings stakeholders when all but one downstream are merged.

### Phase 3 — AI decomposition
An LLM agent drafts downstream proposals from the unified PR description. A human reviews and approves each draft before opening it upstream.

### Phase 4 — Full AI-Spec-Repo
The complete system described above. The AI-drafting pipeline becomes a community service, publicly accessible as a web UI and API.

---

## 7. Conclusion

The complexity of interoperability standards is not going to decrease. The number of implementation surfaces — edge devices, cloud services, identity wallets, AI agents — is growing faster than the number of people willing to engage in standards processes. An AI-assisted abstraction layer that lowers the cost of cross-cutting change proposals is not a luxury; it is a necessary infrastructure investment for a functional, interoperable digital commons.

The Pull Request is already the dominant metaphor for collaborative change in software. It is time to make it the dominant metaphor for collaborative change in *everything that software depends on*.

---

*This document is open for PRs in the repository above.*
