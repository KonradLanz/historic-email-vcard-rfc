# Change Proposal: `HISTORIC` Type Parameter for `EMAIL` (and other properties) in vCard 4.0

**Targets:** RFC 6350 (vCard Format Specification)  
**IETF Working Group:** vcarddav (concluded) / dispatch → new individual draft  
**Status:** Pre-draft, seeking co-authors  
**Upstream:** https://datatracker.ietf.org/doc/html/rfc6350  
**Parent proposal:** https://github.com/KonradLanz/historic-email-vcard-rfc

---

## 1. Problem Statement

RFC 6350 Section 5.2 defines type parameters for property values, including `WORK`, `HOME`, `PREF`, and others. There is currently no standardised mechanism to indicate that a property value — most commonly an `EMAIL` or `TEL` address — is *historic*: no longer in active use but still valid for record-linkage purposes (e.g., threading old email messages to the correct contact).

Implementations handle this in ad-hoc ways:
- Deleting the old address (breaks linkage to old messages)
- Keeping it alongside the new address with no distinction (causes autocomplete pollution)
- Using a non-standard `X-HISTORIC` parameter (interoperability failure)

---

## 2. Proposed Change

### 2.1 New type-param value

Add `HISTORIC` to the type-param registry for the following properties:
- `EMAIL`
- `TEL`
- `URL`
- `IMPP`
- `ADR` (physical address, less common but consistent)

**Semantics:** A value marked `HISTORIC` was previously used for communication with this entity but is no longer accepted or checked by them. Applications SHOULD NOT present `HISTORIC` values to users in contexts where a new communication would be initiated (e.g., autocomplete for composing a new message). Applications MAY present `HISTORIC` values in contexts where linking to existing communications is useful (e.g., "did this message come from a known contact?").

**Relation to PREF:** `HISTORIC` and `PREF` are mutually exclusive on the same value; a `HISTORIC` value MUST NOT also carry `PREF=1`. An implementation that encounters both SHOULD strip `PREF`.

### 2.2 Example vCard snippet

```
EMAIL;TYPE=WORK,HISTORIC:konrad.old@example.com
EMAIL;TYPE=WORK,PREF=1:konrad.new@example.com
```

### 2.3 IANA registration

A new row in the "vCard Property Value Parameters" IANA registry:

| Parameter | Status | Reference |
|---|---|---|
| HISTORIC | Standards Track | [this-RFC] |

---

## 3. Backward Compatibility

- Clients that do not understand `HISTORIC` will display the old address alongside the new one — the current (already broken) behaviour. No regression.
- Servers MUST preserve unknown type parameters per RFC 6352 Section 6.3.2. No server-side change is required unless the server implements autocomplete filtering (see `CHANGE-PROPOSAL-KOLAB.md`).

---

## 4. Interaction with Related RFCs

| RFC | Impact |
|---|---|
| RFC 6352 (CardDAV) | Server MUST NOT strip unknown type params — already required; clarification note helpful |
| RFC 7095 (jCard) | `"historic"` becomes a valid string in the type array: `["work","historic"]` |
| RFC 6473 (vCard KIND:application) | No impact |
| RFC 8605 (vCard Format Extensions: ICANN) | No impact |

---

## 5. Next Steps

1. Recruit co-authors from vcarddav alumni and CardDAV implementers.
2. Submit as `draft-lanz-vcard-historic-00` to IETF.
3. Request review from dispatch WG.
4. Open issues in CardBook and Kolab trackers referencing the draft.

---

*Open a PR to this file to suggest edits before the I-D is submitted.*
