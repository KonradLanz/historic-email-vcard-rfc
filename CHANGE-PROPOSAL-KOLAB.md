# Change Proposal: Kolab / Roundcube — Historic Email Address Server-Side Support

**Targets:** Kolab Groupware server, Roundcube webmail  
**Upstream repositories:**  
- https://github.com/kolab-org (Kolab server)  
- https://github.com/roundcube/roundcubemail  
**Status:** Pre-PR, awaiting RFC draft reference  
**Parent proposal:** https://github.com/KonradLanz/historic-email-vcard-rfc

---

## 1. Background

Kolab is a standards-compliant groupware server built on IMAP, CalDAV, and CardDAV. Roundcube is the primary webmail and contact-management UI. Together they serve as both a CardDAV server (storing vCards) and a consumer of contact data for composing new messages.

---

## 2. Required Changes

### 2.1 CardDAV server — preserve `HISTORIC` type parameter

**Component:** Kolab's CardDAV layer (Cyrus / kolab-freebusy or equivalent vCard storage)

RFC 6352 Section 6.3.2 already requires that CardDAV servers preserve properties and parameters they do not understand. This change is therefore **no new server-side requirement** for storage.

However, if Kolab performs any normalisation or filtering of vCard type parameters (e.g., to restrict to a whitelist), the `HISTORIC` parameter MUST be added to the passthrough whitelist.

**Verification:** A vCard containing `EMAIL;TYPE=WORK,HISTORIC:old@x.com` uploaded via `PUT` to the CardDAV endpoint MUST be returned byte-for-byte identical (modulo server-injected properties like `REV`) on a subsequent `GET`.

### 2.2 Roundcube contacts UI

**Component:** `rcmail_contacts` / contact edit view

- Add a **"Historic"** checkbox to the email-address row in the contact editor, identical in function to the CardBook proposal.
- Display historic addresses in a visually distinct style (strikethrough + muted colour + tooltip).
- Store the `HISTORIC` type param in the vCard on save.

### 2.3 Roundcube autocomplete

**Component:** `rcube_addressbook::search()` and the autocomplete AJAX endpoint

- Extend the search result filtering to exclude `EMAIL` values with `TYPE=HISTORIC` from the default autocomplete response.
- Add a server-side preference `compose_historic_autocomplete` (default: `false`) that re-includes historic addresses when enabled.

### 2.4 Kolab mail delivery — contact linkage

**Component:** Kolab's LMTP/Sieve filter layer (if applicable)

- When resolving an incoming message's `From:` address to a contact, historic `EMAIL` values MUST still be considered for linkage.
- This ensures a message sent from `old@x.com` is still attributed to the correct contact card.

---

## 3. Test Cases

| Scenario | Expected result |
|---|---|
| CardDAV PUT with `HISTORIC` type param | Server stores and returns parameter unchanged |
| Roundcube compose autocomplete | Historic addresses absent from suggestions |
| Roundcube contact edit → mark historic | vCard updated, address shows strikethrough in UI |
| Incoming mail from historic address | Contact resolved, message linked to contact |

---

## 4. Upstream PR Plan

1. Open issue on `roundcube/roundcubemail` referencing the IETF draft.
2. Implement UI and autocomplete filter changes in a fork.
3. Open PR with this document in the description.
4. Open a parallel issue on `kolab-org` for the type-param passthrough verification.

---

*Open a PR here to refine the specification before upstream PRs are filed.*
