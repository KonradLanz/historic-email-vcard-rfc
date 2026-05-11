# Historic / Temporal Email Address in vCard / CardDAV — Change Proposal Hub

> **Goal:** Flag an email address in a contact as *historic* — still linkable to old messages, but excluded from address-book autocomplete for new mail.

This repository coordinates **pull-request-style change proposals** across all affected layers of the stack.

## Two tracks

| Track | Branch | Proposal | Timeline |
|---|---|---|---|
| **Minimal / fast-track** | `main` | `TYPE=HISTORIC` boolean flag on `EMAIL` (and related properties) | Short — errata-style RFC addendum |
| **Full temporal validity** | [`feature/temporal-validity-params`](../../tree/feature/temporal-validity-params) | `VALID-SINCE` / `VALID-UNTIL` interval parameters on any vCard property value (inspired by Hugh Darwen / Tutorial D temporal relational theory, ISO SQL:2011) | Longer — new IETF working draft |

> **Design note:** A `HISTORIC` boolean is the degenerate case of `VALID-UNTIL < now` with no `VALID-SINCE`. The minimal track ships quickly and is backward-compatible. The temporal track is the architecturally correct long-term design. Once the temporal parameters are adopted, `TYPE=HISTORIC` becomes a deprecated alias.

---

## Affected layers

| Layer | Upstream repo / spec | Change type |
|---|---|---|
| **vCard 4.0 RFC 6350** | [IETF Datatracker](https://datatracker.ietf.org/doc/html/rfc6350) | RFC errata / new draft |
| **CardDAV RFC 4791 / 6352** | [IETF Datatracker](https://datatracker.ietf.org/doc/html/rfc6352) | RFC draft |
| **jCard / JSON RFC 7095** | [IETF Datatracker](https://datatracker.ietf.org/doc/html/rfc7095) | RFC draft |
| Thunderbird **CardBook** add-on | [CardBook on GitLab](https://gitlab.com/CardBook/CardBook) | Code MR |
| **Thunderbird** core autocomplete | [comm-central](https://hg.mozilla.org/comm-central/) | Code patch / bug |
| **Kolab** server + Roundcube | [roundcubemail](https://github.com/roundcube/roundcubemail) | Code PR |
| **Microformats h-card** | [microformats.org wiki](https://microformats.org/wiki/h-card) | Wiki proposal + parser PR |

---

## Documents — `main` (minimal track)

| File | Purpose |
|---|---|
| [`POSITION-PULL-REQUESTS-FOR-EVERYTHING.md`](POSITION-PULL-REQUESTS-FOR-EVERYTHING.md) | Position paper: every spec should accept Pull Requests |
| [`POSITION-AI-SPEC-REPO.md`](POSITION-AI-SPEC-REPO.md) | Position paper: AI-driven GitHub-like abstraction layer for all specs |
| [`CHANGE-PROPOSAL-VCARD-RFC6350.md`](CHANGE-PROPOSAL-VCARD-RFC6350.md) | vCard RFC change: `TYPE=HISTORIC` parameter |
| [`CHANGE-PROPOSAL-CARDBOOK.md`](CHANGE-PROPOSAL-CARDBOOK.md) | CardBook add-on UI & filter change |
| [`CHANGE-PROPOSAL-KOLAB.md`](CHANGE-PROPOSAL-KOLAB.md) | Kolab / Roundcube server-side change |
| [`CHANGE-PROPOSAL-MICROFORMATS.md`](CHANGE-PROPOSAL-MICROFORMATS.md) | Microformats h-card `historic` class proposal |

## Documents — `feature/temporal-validity-params` (full track)

| File | Purpose |
|---|---|
| [`CHANGE-PROPOSAL-VCARD-TEMPORAL-VALIDITY.md`](../../blob/feature/temporal-validity-params/CHANGE-PROPOSAL-VCARD-TEMPORAL-VALIDITY.md) | Full `VALID-SINCE`/`VALID-UNTIL` interval proposal with Tutorial D rationale, jCard mapping, h-card mapping, and existing-parameter precedents |

---

## Existing per-value annotation precedents in RFC 6350

The temporal parameters are not without precedent. RFC 6350 already allows per-value annotations:

- `GEO` as a parameter on `ADR` — geographic coordinates for *that specific address*
- `TZ` as a parameter on `ADR` — timezone for that address
- `PREF=1..100` — preference rank per value
- `ALTID` — groups related values (e.g. for temporal history of one "email slot")
- `PID` — per-value instance identifier used by CardDAV sync

`VALID-SINCE`/`VALID-UNTIL` follows exactly the same pattern as `GEO`/`TZ` on `ADR`.

---

## How to contribute

- Open a **Pull Request to `main`** for improvements to the minimal `HISTORIC` flag proposals.
- Open a **Pull Request to `feature/temporal-validity-params`** to refine the full temporal validity proposal.
- Reference the upstream issue tracker or mailing list thread in your PR description.

## Licence

All documents in this repository are released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
