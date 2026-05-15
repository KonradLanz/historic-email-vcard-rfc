# Change Proposal: Contact-Level Versioning in vCard / CardDAV

**Branch:** `feature/contact-snapshot-versioning`  
**Related proposals:** `CHANGE-PROPOSAL-VCARD-RFC6350.md` (TYPE=HISTORIC)  
**Status:** Draft — open for discussion  
**Venue:** IETF vcarddav list / RFC 6350 bis

---

## 1. Problem Statement

RFC 6350 treats a vCard as a *current-state snapshot* of a contact. There is no
first-class mechanism to:

1. Retrieve what a contact looked like at a past point in time (e.g., when an
   email was sent in 2018).
2. Preserve historical property values alongside current ones in a
   forward-compatible way.
3. Distinguish "I edited this field" from "this field became historically
   inactive" — the `TYPE=HISTORIC` proposal handles the latter at the property
   level, but not the former at the contact level.

This is the *whole-contact versioning* problem, complementary to the
per-property `TYPE=HISTORIC` flag.

---

## 2. What RFC 6350 Already Provides

### 2.1 `REV` — Revision Timestamp (§6.7.4)

```
REV:20180612T093000Z
```

- Cardinality `*1` — at most one per vCard.
- Records *when the current version was last modified*.
- **Not a version history** — it is overwritten on every save. There is no
  chain; previous `REV` values are silently lost.
- CardDAV servers expose the ETag for the current `.vcf` object, but do not
  mandate retaining prior ETags.

**Verdict:** Useful as a "last-modified" sentinel, but provides no history.

### 2.2 `UID` — Stable Contact Identity (§6.7.6)

```
UID:urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6
```

- Stable across edits — the same contact across time, devices, and sync
  contexts.
- Combined with `REV`, gives you: "this is contact X as of timestamp T."
- **Not a version number** — there is no sequence or hash chaining.

**Verdict:** The anchor for identity-across-versions, but not a version chain.

### 2.3 `PID` + `CLIENTPIDMAP` — Property-Level Source Tracking (§5.5, §6.7.7)

```
EMAIL;PID=4.1:old@example.com
CLIENTPIDMAP:4;urn:uuid:d89c9c7a-2e1b-4832-82de-7e992d95faa5
```

- Designed for **multi-source sync conflict resolution**, not time-based
  versioning.
- A `PID` tracks which source (client) last touched a property instance.
- Does not model "this property was active until date X."

**Verdict:** Not applicable to historical flagging, but compatible alongside it.

### 2.4 `ALTID` — Alternative Representations (§5.4)

```
EMAIL;ALTID=1:work@example.com
EMAIL;ALTID=1;LANGUAGE=de:work@example.de
```

- Groups multiple representations of the *same logical property* (e.g.,
  different localizations of the same address).
- Not intended for temporal variants; semantics are representational, not
  historical.

**Verdict:** Not a versioning tool; avoid overloading it for this purpose.

### 2.5 `X-` / `IANA` Extension Parameters

RFC 6350 §6.10 explicitly allows `X-` prefixed extension properties and
parameters bilaterally. Any implementation can already use:

```
EMAIL;X-HISTORIC-SINCE=20210101T000000Z:oldname@example.com
```

without a spec change. This is the lowest-friction path for early adopters.

---

## 3. The Gap: No Contact-Level Snapshot/Version Chain

RFC 6350 deliberately omits versioned history to keep the format simple. But
three real-world needs drive demand for it:

| Need | Current workaround | Problem |
|---|---|---|
| "What email address did this person have in 2019?" | None in vCard; must query mail archive | Decoupled from address book |
| Audit trail for enterprise/legal purposes | External system | No standard interop |
| Undo an accidental edit | CardDAV server-side (if supported) | Not portable |

---

## 4. Proposed Extension: `SNAPSHOT` Property + `X-REV-SEQ` Parameter

This proposal defines two optional, backward-compatible additions to vCard 4.0.

### 4.1 `X-REV-SEQ` Parameter (implementable today without IANA registration)

A monotonically increasing integer applied to the top-level `REV` property to
establish a version sequence:

```
REV;X-REV-SEQ=7:20240315T110000Z
```

- Clients increment on every save that changes any property.
- Combined with `UID`, creates a unique, orderable version identifier:
  `(UID, REV-SEQ)`.
- Backward-compatible: unknown parameters MUST be preserved by compliant
  CardDAV servers (RFC 6352 §6.3.2).

### 4.2 `SNAPSHOT` Property (requires RFC 6350 bis or new RFC)

A new property that embeds a complete prior-state vCard as a base64-encoded
blob, chained by sequence number:

```
SNAPSHOT;SEQ=6;REV=20231001T080000Z:
 BEGIN:VCARDbase64encodedpreviousvcard...END:VCARD
```

ABNF sketch:

```abnf
SNAPSHOT-param  = "SEQ=" 1*DIGIT / "REV=" timestamp / any-param
SNAPSHOT-value  = base64
```

- `SEQ` references the `X-REV-SEQ` of the embedded prior state.
- `REV` is the timestamp *of that snapshot*, not the current card.
- Multiple `SNAPSHOT` properties MAY appear (cardinality `*`), each with a
  unique `SEQ`.
- Implementations that do not understand `SNAPSHOT` MUST preserve it
  (unknown-property passthrough, RFC 6350 §6.10).

### 4.3 Interaction with `TYPE=HISTORIC`

The `TYPE=HISTORIC` proposal (see `CHANGE-PROPOSAL-VCARD-RFC6350.md`) marks a
*current-version* property as historically inactive. `SNAPSHOT` preserves
*past versions* of the whole card. They are orthogonal and complementary:

```
BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6
REV;X-REV-SEQ=3:20260515T140000Z
FN:Jane Doe
EMAIL;PREF=1:jane@newdomain.example
EMAIL;TYPE=HISTORIC:jane@olddomain.example
SNAPSHOT;SEQ=2;REV=20230101T000000Z:QkVHSU46VkNBUkQKVkVSU0lPTjo...
SNAPSHOT;SEQ=1;REV=20200601T000000Z:QkVHSU46VkNBUkQKVkVSU0lPTjo...
END:VCARD
```

Reading this card:
- The *current* email is `jane@newdomain.example`.
- `jane@olddomain.example` is kept as `TYPE=HISTORIC` so MUAs can link old
  emails to this contact.
- SEQ=2 snapshot contains the card as of 2023-01-01 (when the old address was
  still current).
- SEQ=1 snapshot is the initial creation state.

---

## 5. CardDAV Considerations

CardDAV (RFC 6352) stores vCards as opaque blobs behind ETags. It has no native
concept of object-level versioning beyond ETag chaining.

### 5.1 What CardDAV servers MUST already do

RFC 6352 §6.3.2: servers MUST return unknown properties as-is on `GET` if they
were `PUT` by the client. This means `SNAPSHOT` survives a round-trip today
without any server change, as long as the server does not strip unknown
properties (non-compliant behavior, but it happens).

### 5.2 Optional server-side SNAPSHOT generation

A compliant CardDAV server COULD:
1. On every `PUT`, compare the incoming vCard with the stored one.
2. If changed, generate a new `SNAPSHOT` entry from the previous state and
   inject it into the new vCard before storing.
3. Expose a `DAV:version-history` report (from DeltaV, RFC 3253) pointing to
   the ETag history.

This is an optional optimization; it is not required for the proposal to work.

### 5.3 Kolab-specific note

Kolab's storage backend uses IMAP annotations for vCard metadata. The
`SNAPSHOT` property would be stored inside the `.vcf` blob and would
transparently survive Kolab's CardDAV passthrough, provided the passthrough
whitelist includes unknown vCard properties (see
`CHANGE-PROPOSAL-KOLAB.md`).

---

## 6. Microformats Mapping

The microformats h-card specification does not currently have a versioning
concept. A companion proposal for h-card would add:

```html
<div class="h-card">
  <span class="p-rev" title="20260515T140000Z">Last updated May 2026</span>
  <span class="u-snapshot" hidden>data:text/vcard;base64,...</span>
</div>
```

This is a low-priority addition; the primary value is in the vCard/CardDAV
layer.

---

## 7. Forward/Backward Compatibility Matrix

| Consumer | Behaviour with `SNAPSHOT` + `X-REV-SEQ` |
|---|---|
| RFC 6350 compliant parser, no SNAPSHOT support | Preserves unknown properties; ignores gracefully |
| RFC 6350 non-compliant parser (strips unknowns) | Loses snapshots — same as today for any extension |
| CardDAV server (RFC 6352 compliant) | Stores/returns opaque blob; snapshots survive |
| Thunderbird CardBook (patched) | Renders historic emails via snapshot lookup |
| Kolab/Roundcube (patched) | Autocomplete filters historic addresses across snapshots |
| MUA with no CardBook/HISTORIC support | Sees all email addresses as current — no regression |

The proposal is **additive and non-breaking**. Clients that do not understand
`SNAPSHOT` simply treat the contact as a current-state-only vCard, which is
exactly how all existing clients behave today.

---

## 8. Open Questions

1. **Size concern:** A contact with 10 snapshots embedding full vCards could
   become large. Should `SNAPSHOT` embed a full vCard or a diff (RFC 6902
   JSON Patch style)?
2. **IANA registration path:** Should this go as a standalone Internet-Draft,
   or as part of an RFC 6350 bis effort?
3. **`X-REV-SEQ` vs. a proper `VERSION-SEQ` parameter:** Using `X-` prefix
   allows immediate experimentation; an IANA-registered parameter would be
   preferred long-term.
4. **Interaction with vCard Extensions for JSContact (RFC 9553):** The JSContact
   format defines `updated` (equivalent to `REV`) but also has no version
   history. A parallel proposal for JSContact would be needed.

---

## 9. Relationship to This Repository's Broader Goals

This branch demonstrates the **AI-Spec-Repo abstraction layer** described in
`POSITION-AI-SPEC-REPO.md`: a single PR that spans:

- An RFC 6350 extension proposal (this document)
- A CardDAV behaviour note (§5)
- A Kolab implementation note (§5.3)
- A microformats mapping sketch (§6)

All in one place, with traceable links to the per-component change proposals,
illustrating that cross-cutting standards changes are navigable when they share
a common PR-based coordination hub.

---

## References

- [RFC 6350] vCard Format Specification — https://www.rfc-editor.org/rfc/rfc6350
- [RFC 6352] CardDAV: vCard Extensions to WebDAV — https://www.rfc-editor.org/rfc/rfc6352
- [RFC 3253] Versioning Extensions to WebDAV (DeltaV) — https://www.rfc-editor.org/rfc/rfc3253
- [RFC 9553] JSContact: A JSON Representation of Contact Data — https://www.rfc-editor.org/rfc/rfc9553
- [TYPE=HISTORIC proposal] ./CHANGE-PROPOSAL-VCARD-RFC6350.md
- [Kolab proposal] ./CHANGE-PROPOSAL-KOLAB.md
- [Microformats proposal] ./CHANGE-PROPOSAL-MICROFORMATS.md
