# Change Proposal: CardBook (Thunderbird Add-On) — Historic Email UI & Autocomplete Filter

**Targets:** CardBook Thunderbird add-on  
**Upstream repository:** https://gitlab.com/CardBook/CardBook  
**Status:** Pre-PR, awaiting RFC draft reference  
**Parent proposal:** https://github.com/KonradLanz/historic-email-rfc

---

## 1. Background

[CardBook](https://gitlab.com/CardBook/CardBook) is the primary CardDAV-capable address book add-on for Thunderbird. It renders vCard properties and feeds contact data to Thunderbird's autocomplete engine for composing new messages.

Currently CardBook has no concept of a *historic* email address. All `EMAIL` values in a contact are treated equally for autocomplete purposes.

---

## 2. Required Changes

### 2.1 vCard parser — preserve `HISTORIC` type param

**File (indicative):** `CardBook/chrome/content/cardbookRepository.js` (or equivalent parser module)

- When parsing a vCard `EMAIL` property, check the type-param list for `HISTORIC`.
- Store the boolean flag in the in-memory contact model: `email.historic = true`.
- Ensure round-trip: when serialising a contact back to vCard, the `HISTORIC` type param MUST be preserved even if CardBook does not otherwise modify the property.

### 2.2 UI — contact editor

**Location:** Contact edit view for email addresses

- Add a checkbox or toggle labelled **"Historic (no longer in use)"** next to each email address row.
- When checked, display the address in a visually distinct style (e.g., strikethrough or muted colour, with a tooltip explaining the semantics).
- The toggle writes/removes the `HISTORIC` type param in the underlying vCard.

**Accessibility:** The historic state MUST be communicated via `aria-label` or equivalent; do not rely on colour alone.

### 2.3 Autocomplete filter

**Location:** The module that feeds addresses to Thunderbird's `nsIAbDirectory` / `nsIAbCard` autocomplete provider.

- When building the autocomplete result set for a new message, **exclude** any `EMAIL` values where `historic === true`.
- The filter MUST be applied regardless of whether the user is in "To:", "Cc:", or "Bcc:" fields.
- A user preference (`extensions.cardbook.autocomplete.showHistoric`, default `false`) allows power users to override this filter.

### 2.4 Search and link view

- When Thunderbird searches for a contact by email (e.g., to display the sender's name in an old received message), historic addresses MUST still match.
- The contact display panel MAY show a "historic address" badge next to the matched address.

---

## 3. Test Cases

| Scenario | Expected result |
|---|---|
| vCard with `EMAIL;TYPE=HISTORIC:old@x.com` imported | Address stored, `historic=true`, not in autocomplete |
| User toggles "Historic" in editor | `HISTORIC` added to type param, address removed from autocomplete |
| User sends email to old@x.com via autocomplete | Address NOT suggested (unless pref overridden) |
| Old message received from old@x.com | Contact resolved correctly, "historic" badge shown |
| vCard exported after edit | `EMAIL;TYPE=WORK,HISTORIC:old@x.com` present in output |

---

## 4. Upstream PR Plan

1. Open a GitLab issue on CardBook referencing this document and the IETF draft.
2. Fork CardBook, implement the parser and UI changes.
3. Open a Merge Request with this document linked in the description.
4. CC Thunderbird address book team (comm-central) to coordinate autocomplete API changes if needed.

---

*Open a PR here to refine the technical specification before the upstream MR is filed.*
