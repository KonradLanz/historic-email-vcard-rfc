# Historic Email Address in vCard / CardDAV — Change Proposal Hub

> **Goal:** Flag an email address in a contact as *historic* — still linkable to old messages, but excluded from address-book autocomplete for new mail.

This repository coordinates **pull-request-style change proposals** across all affected layers of the stack:

| Layer | Upstream repo / spec | Change type | Direct link to patch target |
|---|---|---|---|
| Thunderbird **CardBook** add-on | [CardBook on GitLab](https://gitlab.com/CardBook/CardBook) | GitLab MR | [cardbookAutoComplete.js](https://gitlab.com/CardBook/CardBook/-/blob/master/src/cardbookAutoComplete.js) · [cardbookCards.js](https://gitlab.com/CardBook/CardBook/-/blob/master/src/cardbookCards.js) |
| **Thunderbird** core WebExtension API | [thunderbird/webext-docs](https://github.com/thunderbird/webext-docs) | GitHub Issue | [compose API](https://webextension-api.thunderbird.net/en/stable/compose.html) |
| **Kolab** / Roundcube | [roundcubemail on GitHub](https://github.com/roundcube/roundcubemail) | GitHub PR | [plugins/vcard_attachments](https://github.com/roundcube/roundcubemail/tree/master/plugins/vcard_attachments) |
| **vCard 4.0 RFC 6350** | [IETF Datatracker](https://datatracker.ietf.org/doc/html/rfc6350) | RFC errata / new draft | [§ 6.4.2 EMAIL](https://datatracker.ietf.org/doc/html/rfc6350#section-6.4.2) |
| **CardDAV RFC 6352** | [IETF Datatracker](https://datatracker.ietf.org/doc/html/rfc6352) | RFC draft | [§ 10.3.2 Address Data](https://datatracker.ietf.org/doc/html/rfc6352#section-10.3.2) |
| **jCard / JSON** | [RFC 7095](https://datatracker.ietf.org/doc/html/rfc7095) | RFC draft | [§ 3.3 Properties](https://datatracker.ietf.org/doc/html/rfc7095#section-3.3) |
| **Microformats h-card** | [microformats.org wiki](https://microformats.org/wiki/h-card) | Wiki proposal + GitHub PR | [mf2py parser](https://github.com/microformats/mf2py) |

## Documents in this repo

| File | Purpose |
|---|---|
| [`POSITION-PULL-REQUESTS-FOR-EVERYTHING.md`](POSITION-PULL-REQUESTS-FOR-EVERYTHING.md) | Position paper: every spec should accept Pull Requests |
| [`POSITION-AI-SPEC-REPO.md`](POSITION-AI-SPEC-REPO.md) | Position paper: AI-driven GitHub-like abstraction layer for all specs |
| [`CHANGE-PROPOSAL-VCARD-RFC6350.md`](CHANGE-PROPOSAL-VCARD-RFC6350.md) | Concrete vCard RFC change: `HISTORIC` type parameter |
| [`CHANGE-PROPOSAL-CARDBOOK.md`](CHANGE-PROPOSAL-CARDBOOK.md) | CardBook add-on UI & filter change |
| [`CHANGE-PROPOSAL-CARDBOOK-BOUNCE-SCAN.md`](../../blob/feature/contact-snapshot-versioning/CHANGE-PROPOSAL-CARDBOOK-BOUNCE-SCAN.md) | CardBook bounce-detection & mailbox scanner *(branch: feature/contact-snapshot-versioning)* |
| [`CHANGE-PROPOSAL-KOLAB.md`](CHANGE-PROPOSAL-KOLAB.md) | Kolab / Roundcube server-side change |
| [`CHANGE-PROPOSAL-MICROFORMATS.md`](CHANGE-PROPOSAL-MICROFORMATS.md) | Microformats h-card `historic` class proposal |
| [`GUIDE-FORK-AND-TEST.md`](../../blob/feature/contact-snapshot-versioning/GUIDE-FORK-AND-TEST.md) | How to fork CardBook on GitLab, apply patches, test locally *(branch: feature/contact-snapshot-versioning)* |
| [`patches/`](../../tree/feature/contact-snapshot-versioning/patches) | Ready-to-apply code patch fragments *(branch: feature/contact-snapshot-versioning)* |

## Links to related repos and specs

### GitLab
- **CardBook** (canonical): https://gitlab.com/CardBook/CardBook
- Fork target for your MR: `https://gitlab.com/YOUR-USERNAME/CardBook` (after forking)
- Files to patch: [`src/cardbookAutoComplete.js`](https://gitlab.com/CardBook/CardBook/-/blob/master/src/cardbookAutoComplete.js) · [`src/cardbookCards.js`](https://gitlab.com/CardBook/CardBook/-/blob/master/src/cardbookCards.js)

### GitHub
- Roundcube: https://github.com/roundcube/roundcubemail
- Thunderbird WebExtension API docs: https://github.com/thunderbird/webext-docs
- Microformats mf2py parser: https://github.com/microformats/mf2py
- Microformats mf2util: https://github.com/kylewm/mf2util

### IETF / W3C / Microformats
- RFC 6350 (vCard 4.0): https://datatracker.ietf.org/doc/html/rfc6350
- RFC 6352 (CardDAV): https://datatracker.ietf.org/doc/html/rfc6352
- RFC 3464 (Bounce/DSN format): https://datatracker.ietf.org/doc/html/rfc3464
- RFC 7095 (jCard): https://datatracker.ietf.org/doc/html/rfc7095
- Microformats h-card: https://microformats.org/wiki/h-card
- vcarddav mailing list: https://mailarchive.ietf.org/arch/browse/vcarddav/

## How to contribute

Open a **Pull Request** to this repo with changes to any document. Reference the upstream issue tracker or mailing list thread in your PR description. The goal is to keep all change vectors visible in one place while each upstream is addressed separately.

## Licence

All documents in this repository are released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
