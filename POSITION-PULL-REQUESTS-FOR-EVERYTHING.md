# Position Paper: Every Technical Specification Should Accept Pull Requests

**Status:** Draft for community review  
**Author:** Konrad Lanz (GrEEV.com KG / ETSI)  
**Date:** 2026-05  
**Repository:** https://github.com/KonradLanz/historic-email-vcard-rfc

---

## Abstract

The Pull Request (PR) model, pioneered by distributed version-control platforms, has become the most legible, auditable, and participatory mechanism humanity has yet devised for collaborative change to a shared text corpus. This paper argues that every technical specification — IETF RFCs, W3C Recommendations, ETSI standards, OASIS documents, ISO norms, microformat wikis, and open-source software documentation — should adopt the PR model as its primary change-management interface, replacing or supplementing opaque mailing-list threads, committee ballots, and informal errata processes.

---

## 1. The Problem

Today's specification landscape suffers from a structural mismatch:

- **Proposers** (implementers, researchers, end-users) identify a concrete need — for example, the absence of a `HISTORIC` type on `EMAIL` properties in vCard (RFC 6350).
- **Affected parties** are distributed across many unconnected systems: a Thunderbird add-on, a mail server, a CalDAV/CardDAV server, a microformat wiki, and one or more IETF working groups.
- **Change proposals** today flow as: an email to a mailing list → a long thread → an editorial decision → a new RFC draft → a publication cycle that may take years.
- **Implementations** change independently, diverge from drafts, and the change surface is invisible to anyone not already subscribed to the right list.

The result is high latency, low discoverability, and a participation barrier that systematically excludes implementers with the most direct feedback.

---

## 2. What a Pull Request Provides

A PR is not merely a code-diff tool. It is an *epistemically structured collaboration primitive* with the following properties:

| Property | What it means for specifications |
|---|---|
| **Atomic scope** | A PR bundles a precise, reviewable delta — not a vague "we should change X" |
| **Branching** | Experimental proposals live in isolation until consensus; the main branch is always stable |
| **Inline review** | Reviewers comment on the exact sentence being changed, reducing ambiguity |
| **Audit trail** | Every accept, reject, and conversation is permanently and publicly archived |
| **CI/CD hooks** | Automated checks (link validation, RFC-lint, terminology consistency) run on every PR |
| **Linking** | A PR can reference upstream issues, downstream implementation PRs, and test suites |
| **Forking** | Minority positions can fork the spec, compete, and later merge — exactly as open-source projects do |

All of these are absent from, or weakly approximated by, the current mailing-list / ballot model.

---

## 3. Precedents and Evidence

- **WHATWG** moved the HTML Living Standard to GitHub in 2019; the number of outside contributions tripled within twelve months.
- **IETF** has increasingly published working-group documents on GitHub (e.g., HTTP Working Group at https://github.com/httpwg). The tooling is there; adoption is uneven.
- **W3C** publishes many specs on GitHub but review workflows differ wildly between working groups.
- **OpenAPI Specification** (formerly Swagger) is maintained entirely on GitHub with PRs; it is among the fastest-evolving API-description standards in history.
- **ECMA TC39** uses a stage-based GitHub proposal process for JavaScript evolution — widely regarded as a model of transparent, incremental standardisation.
- **Microformats** uses a wiki; proposals arrive as wiki edits or mailing-list posts — a low barrier but no structured review, no diff, no CI.

The pattern is clear: specs maintained with PR workflows iterate faster, attract more contributors, and produce fewer implementation divergences.

---

## 4. Objections and Responses

### 4.1 "Standards bodies require formal membership and IP agreements"

*Response:* PRs are not votes. A PR is a structured proposal. The formal body can still apply its IPR policy and ballot process to *accept* a PR. GitHub or a self-hosted Forgejo instance can be the drafting environment while the formal ballot remains the ratification mechanism. IETF's Datatracker already supports GitHub integration.

### 4.2 "Non-technical stakeholders cannot use GitHub"

*Response:* The web UI for GitHub issues and PR review requires no programming skill. Organisations like the United Nations, WHO, and multiple national governments have used GitHub for policy documents. For those who cannot use it, email-to-issue bridges (already standard on many open-source projects) preserve the mailing-list workflow as a first-class input channel.

### 4.3 "Bikeshedding will overwhelm working groups"

*Response:* This already happens on mailing lists, where it is harder to close. A PR has a clear open/closed/merged state. Maintainers can label, milestone, and triage. Draft status (`[WIP]` or GitHub Draft PR) keeps noise away from reviewers until the proposer is ready.

### 4.4 "Version stability is paramount in standards"

*Response:* Git tags and signed releases provide cryptographically verifiable snapshots of the canonical text at any point in time — stronger guarantees than PDF publication alone.

---

## 5. A Concrete Multi-Layer Example

This repository itself is the example. The need to flag an email address as *historic* in a vCard contact requires coordinated changes across:

1. RFC 6350 (vCard) — a new type parameter `HISTORIC`
2. RFC 6352 (CardDAV) — server MUST preserve unknown type parameters
3. Thunderbird CardBook add-on — UI toggle + autocomplete filter
4. Kolab / Roundcube — server-side storage and sync
5. Microformats h-card — a `historic` class convention

With today's tooling, these five changes would be proposed in five different venues with no cross-reference. With a PR-first approach:

- This repository holds the *position* and links to each downstream PR.
- Each downstream PR links back here.
- A bot can aggregate status across all five PRs into a single dashboard.
- Implementers can subscribe to *one* issue to track progress across the entire dependency graph.

---

## 6. Recommendations

1. **IETF, W3C, ETSI, ISO:** Adopt GitHub (or a self-hosted Forgejo/GitLab) as the canonical drafting environment for all new work items. PRs become the primary change-input mechanism; formal ballots remain the ratification gate.

2. **Microformat editors:** Migrate the wiki to a Git-backed repository with PR-based edit proposals. The wiki can remain a rendered view of the repo.

3. **Open-source projects** (Thunderbird, Kolab, Roundcube): When a change is driven by a spec gap, always file a corresponding issue in the spec's repository and cross-reference.

4. **Tooling vendors:** Build lightweight "spec PR" dashboards that aggregate open proposals across IETF Datatracker, GitHub, and W3C TrackerHub into a single feed, filterable by protocol area.

5. **AI assistants:** When a gap is identified, automatically draft a PR to the relevant spec repository alongside the implementation PR — lowering the barrier to zero.

---

## 7. Conclusion

The Pull Request is the closest thing to a universal collaborative-change primitive that software engineering has produced. Its adoption is not a matter of preference for a particular platform; it is adoption of a *structured epistemics of change*: atomic, auditable, linkable, automatable, and open. Every specification that governs interoperable technology deserves this level of collaborative rigour.

---

*This document is open for PRs in the repository above.*
