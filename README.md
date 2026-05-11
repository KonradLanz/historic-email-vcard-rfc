# Historic Email Address in vCard / CardDAV — Change Proposal Hub

> **Goal:** Flag an email address in a contact as *historic* — still linkable to old messages, but excluded from address-book autocomplete for new mail.

This repository coordinates **pull-request-style change proposals** across all affected layers of the stack:

| Layer | Upstream repo / spec | Change type |
|---|---|---|
| Thunderbird **CardBook** add-on | [CardBook on GitLab](https://gitlab.com/CardBook/CardBook) | Code PR |
| **Thunderbird** core (address-book autocomplete) | [comm-central](https://hg.mozilla.org/comm-central/) | Code patch / bug |
| **Kolab** server + Roundcube | [Kolab Now / Roundcube](https://github.com/roundcube/roundcubemail) | Code PR |
| **vCard 4.0 RFC 6350** | [IETF Datatracker](https://datatracker.ietf.org/doc/html/rfc6350) | RFC errata / new draft |
| **CardDAV RFC 4791 / 6352** | [IETF Datatracker](https://datatracker.ietf.org/doc/html/rfc6352) | RFC draft |
| **jCard / JSON** | [RFC 7095](https://datatracker.ietf.org/doc/html/rfc7095) | RFC draft |
| **Microformats h-card** | [microformats.org wiki](https://microformats.org/wiki/h-card) | Wiki proposal PR |

## Documents in this repo

| File | Purpose |
|---|---|
| [`POSITION-PULL-REQUESTS-FOR-EVERYTHING.md`](POSITION-PULL-REQUESTS-FOR-EVERYTHING.md) | Position paper: every spec should accept Pull Requests |
| [`POSITION-AI-SPEC-REPO.md`](POSITION-AI-SPEC-REPO.md) | Position paper: AI-driven GitHub-like abstraction layer for all specs |
| [`CHANGE-PROPOSAL-VCARD-RFC6350.md`](CHANGE-PROPOSAL-VCARD-RFC6350.md) | Concrete vCard RFC change: `HISTORIC` type parameter |
| [`CHANGE-PROPOSAL-CARDBOOK.md`](CHANGE-PROPOSAL-CARDBOOK.md) | CardBook add-on UI & filter change |
| [`CHANGE-PROPOSAL-KOLAB.md`](CHANGE-PROPOSAL-KOLAB.md) | Kolab / Roundcube server-side change |
| [`CHANGE-PROPOSAL-MICROFORMATS.md`](CHANGE-PROPOSAL-MICROFORMATS.md) | Microformats h-card `historic` class proposal |

## How to contribute

Open a **Pull Request** to this repo with changes to any document. Reference the upstream issue tracker or mailing list thread in your PR description. The goal is to keep all change vectors visible in one place while each upstream is addressed separately.

## Licence

All documents in this repository are released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
