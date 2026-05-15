# Change Proposal: Bounce Detection & Mailbox-Scan for Historic Email Discovery

**Branch:** `feature/contact-snapshot-versioning`  
**Related:** `CHANGE-PROPOSAL-CARDBOOK.md` (X-HISTORIC flag), `CHANGE-PROPOSAL-VCARD-CONTACT-VERSIONING.md`  
**Status:** Draft — open for discussion  
**TB API baseline:** Thunderbird WebExtension MV3 (TB 128+)

---

## 1. Feature Overview

Two complementary modes for automatically discovering that an email address
associated with a contact has become invalid, and optionally flagging it as
`X-HISTORIC=TRUE` in the contact's vCard:

| Mode | Trigger | Latency |
|---|---|---|
| **Bounce Watcher** | New mail arrives in any folder | Real-time |
| **Mailbox Scanner** | User initiates a background scan | One-off / scheduled |

Both modes share the same **DSN parser**, **contact matcher**, and
**suggestion UI**. They differ only in how they source messages.

---

## 2. Standards Basis: DSN / Bounce Messages

### 2.1 RFC 3464 — Delivery Status Notifications

Bounce messages from standards-compliant MTAs are structured as
`multipart/report` with a `message/delivery-status` MIME part. [RFC 3464]

Key fields in the `message/delivery-status` part:

```
Final-Recipient: rfc822; old@example.com
Action: failed
Status: 5.1.1
Diagnostic-Code: smtp; 550 5.1.1 The email account that you tried to
  reach does not exist.
```

- `Action: failed` = permanent failure (hard bounce) → candidate for HISTORIC
- `Action: delayed` = temporary (soft bounce) → do NOT flag
- `Status: 5.x.x` = permanent; `4.x.x` = transient
- `Status: 5.1.1` = "bad destination mailbox address" — the definitive signal
- `Status: 5.1.2` = bad destination system
- `Status: 5.1.6` = mailbox has moved (may include forwarding address!)

### 2.2 Non-standard / freeform bounces

Many servers (especially older or misconfigured ones) send plain-text bounces
without a `message/delivery-status` part. A secondary heuristic parser should
check:

- `From:` contains `mailer-daemon`, `postmaster`, `MAILER-DAEMON`
  (case-insensitive)
- `Subject:` contains patterns: `Undeliverable`, `Delivery Status`,
  `Delivery Failure`, `Mail Delivery`, `Returned mail`, `NDR`
- Body contains `550`, `5.1.1`, `user unknown`, `no such user`,
  `does not exist`, `invalid address`
- Extract email address via regex from body text

Confidence scoring:

| Signal | Confidence |
|---|---|
| RFC 3464 `message/delivery-status` + `Action: failed` + `Status: 5.1.1` | High (auto-suggest) |
| RFC 3464 present but `Status: 5.1.6` (moved) | High + extract new address |
| Mailer-Daemon From + 550 in body + regex address match | Medium (prompt user) |
| Mailer-Daemon From only, no address extracted | Low (log only) |

---

## 3. Thunderbird WebExtension API Surface

All required APIs are available in TB 128+ MV3.

### 3.1 Bounce Watcher (real-time)

```javascript
// manifest.json permissions needed:
// "messagesRead", "accountsRead", "addressBooks"

browser.messages.onNewMailReceived.addListener(
  async (folder, messageList) => {
    for (const msg of messageList.messages) {
      await checkForBounce(msg);
    }
  },
  true  // monitorAllFolders — catches bounces routed to subfolders/filters
);

async function checkForBounce(msgHeader) {
  const full = await browser.messages.getFull(msgHeader.id);
  const dsnPart = findDSNPart(full);       // look for message/delivery-status
  const result = parseDSN(dsnPart, full);  // structured + heuristic
  if (result.confidence === 'high' || result.confidence === 'medium') {
    await suggestHistoric(result);
  }
}
```

### 3.2 Mailbox Scanner (background, user-initiated)

```javascript
async function scanMailboxForBounces(options = {}) {
  // options: { accountId, fromDate, includeSubFolders: true }
  const accounts = await browser.accounts.list();
  for (const account of accounts) {
    const folders = await browser.folders.getSubFolders(account, true);
    for (const folder of folders) {
      let page = await browser.messages.list(folder.id);
      while (true) {
        for (const msg of page.messages) {
          await checkForBounce(msg);
          // yield to event loop to avoid blocking UI
          await new Promise(r => setTimeout(r, 0));
        }
        if (!page.id) break;
        page = await browser.messages.continueList(page.id);
      }
    }
  }
}
```

`browser.messages.continueList()` handles pagination natively —
no risk of loading the entire mailbox into memory at once. [TB WebExt API]

### 3.3 Reverse scan: find emails in mailbox matching a contact

Given a contact whose current email addresses are known, find all messages
sent to or received from any of their addresses (including candidate historic
ones not yet in the vCard):

```javascript
async function findMessagesForContact(contact) {
  const allAddresses = contact.emails.map(e => e.value);
  // Also search by display name as a fuzzy signal
  const results = [];
  for (const addr of allAddresses) {
    const page = await browser.messages.query({
      author: addr,
      includeSubFolders: true,
      messagesPerPage: 50
    });
    results.push(...page.messages);
  }
  // Deduplicate by headerMessageId
  return [...new Map(results.map(m => [m.headerMessageId, m])).values()];
}
```

This enables the **reverse direction**: given a contact, find all mail
conversations involving them, surface addresses that appear in those mails but
are *not yet in the contact*, and ask: "Was `oldname@company.com` also this
person?"

---

## 4. Contact Matching Algorithm

When a bounce or a candidate address is found, it must be associated with a
CardBook contact. Matching is fuzzy and multi-signal:

```
Input: bounced address  →  old@company.com

Step 1: Exact match
  — Search CardBook contacts for EMAIL = old@company.com
  — If found: direct match, confidence = EXACT

Step 2: Domain + name heuristic
  — Parse local-part: "old" → not useful alone
  — Look at the original message that bounced:
      To: old@company.com, From: me@mydomain.com
      In-Reply-To or References header → find the original thread
      Resolve original To: header → the person's name in "Name <addr>" format
  — Search CardBook by display name (partial match)
  — Confidence: MEDIUM if name matches, LOW if only domain matches

Step 3: Thread context
  — If the bounce is a reply to a sent message, retrieve that sent message
  — The To:/CC: of the sent message is the candidate contact
  — Cross-reference all email addresses in that thread against CardBook
  — Confidence: HIGH if a contact already has a similar address
    (e.g. new@company.com exists in contact, bounce is for old@company.com
     at same domain)

Step 4: Present to user
  — For EXACT matches: auto-flag with undo notification
  — For HIGH/MEDIUM: show suggestion panel (see §5)
  — For LOW: log to CardBook's audit panel, no automatic action
```

---

## 5. User Interaction Design

### 5.1 Instant bounce notification (Bounce Watcher mode)

When a new hard-bounce arrives and a contact match is found, show a
non-intrusive notification bar in the message reading pane:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📭  Bounce detected for old@company.com                         │
│     Likely contact: Jane Doe  ·  Match confidence: HIGH         │
│                                                                  │
│  [Mark as Historic in CardBook]  [View Contact]  [Ignore]       │
└─────────────────────────────────────────────────────────────────┘
```

If `Status: 5.1.6` (address moved) and a forwarding address is found in the
DSN:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📭  old@company.com has moved to new@otherdomain.com            │
│     Likely contact: Jane Doe                                     │
│                                                                  │
│  [Mark old as Historic + Add new address]  [View Contact]  [Ignore] │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Mailbox Scanner results panel

A dedicated CardBook panel (sidebar or tab) showing:

```
Mailbox Scan Results                    [Re-scan]  [Apply All]  [Dismiss All]
─────────────────────────────────────────────────────────────────────────────
● Jane Doe        old@company.com → bounce 2024-03-12  [Mark Historic] [Skip]
● Bob Smith       bob@oldco.net   → bounce 2023-11-05  [Mark Historic] [Skip]
? Unknown sender  ghost@example.com  — no contact match  [Create Contact] [Skip]
─────────────────────────────────────────────────────────────────────────────
Found 3 bounced addresses in 12,450 messages scanned.
```

### 5.3 Reverse scan: "Find all mail from this contact"

In the CardBook contact view, a new button:

```
[🔍 Find all mail from this contact]
```

Opens a Thunderbird message search tab pre-filtered to all known + historic
email addresses for that contact. Addresses found in those mails that are not
yet in the contact are surfaced:

```
We found messages involving these addresses not in Jane Doe's contact:
  • j.doe@former-employer.com  (14 messages, last: 2021-06-30)
  [Add as Historic]  [Add as Current]  [Ignore]
```

---

## 6. CardBook Internal Data Flow

```
Thunderbird message event
         │
         ▼
   DSN Parser (RFC 3464 + heuristic)
         │
         ├── confidence: HIGH ──▶ auto-flag + undo toast
         │
         ├── confidence: MEDIUM ─▶ suggestion panel
         │
         └── confidence: LOW ───▶ audit log only
                  │
                  ▼
         Contact Matcher
          (exact → domain+name → thread context)
                  │
                  ▼
         CardBook contact store
          EMAIL;X-HISTORIC=TRUE;X-HISTORIC-SINCE=<date>:old@example.com
                  │
                  ▼
         CardDAV PUT → Kolab (passthrough, no server change)
```

The `X-HISTORIC-SINCE` parameter (a timestamp) is added automatically when
the flag is set from a bounce, recording the date the address became invalid.
This is complementary to the `REV` / `SNAPSHOT` versioning chain.

---

## 7. Privacy & User Control

- **No automatic changes without user confirmation** except for EXACT-match
  HIGH-confidence bounces, which show an undo notification.
- **Opt-in scan** — the mailbox scanner never runs automatically without
  explicit user action.
- **Local only** — all matching runs in the TB process, nothing sent to any
  server.
- **Audit log** — every auto-flag is recorded in a CardBook log panel with
  timestamp, source message ID, and the rule that triggered it.
- **Bulk undo** — a single "Undo last scan" action reverts all flags applied
  in the most recent scan session.

---

## 8. Implementation Phases

| Phase | Scope | Effort | TB API used |
|---|---|---|---|
| **1** | Bounce Watcher: RFC 3464 detection + EXACT match auto-flag | Small | `onNewMailReceived`, `getFull` |
| **2** | Bounce Watcher: heuristic freeform bounce + MEDIUM match suggestion | Medium | `getFull`, `query` |
| **3** | Mailbox Scanner panel with progress UI | Medium | `list`, `continueList` |
| **4** | Reverse scan: find mail for contact + surface unknown addresses | Medium | `query` by author/recipient |
| **5** | `Status: 5.1.6` moved-address detection + new address suggestion | Small | RFC 3464 DSN field |

Phases 1 and 5 are the highest value/effort ratio and should be implemented
first. Phase 3 is the most user-visible and can be a compelling demo for the
CardBook MR.

---

## 9. API Gaps & Thunderbird Core Requests

The following are missing from the current TB WebExtension API and should be
filed as feature requests at https://github.com/thunderbird/webext-docs:

| Gap | Impact | Workaround |
|---|---|---|
| No `onBeforeSend` hook with cancellation | Cannot block send to historic address | Show warning on compose window load only |
| `browser.messages.query()` cannot filter by MIME content-type | Cannot query for `multipart/report` messages directly | Scan all messages, filter in JS |
| No `browser.compose.onRecipientChange` event | Cannot warn in real-time as user types | Poll recipients on compose window focus |

Filing these as TB WebExtension API proposals in parallel with the CardBook
MR would benefit the entire Thunderbird extension ecosystem.

---

## References

- [RFC 3464] DSN format — https://www.rfc-editor.org/rfc/rfc3464
- [RFC 3462] Multipart/report — https://www.rfc-editor.org/rfc/rfc3462
- [TB messages API] — https://webextension-api.thunderbird.net/en/mv3/messages.html
- [TB WebExtension docs] — https://github.com/thunderbird/webext-docs
- [CardBook GitLab] — https://gitlab.com/CardBook/CardBook
- [X-HISTORIC proposal] — ./CHANGE-PROPOSAL-CARDBOOK.md
- [Contact versioning] — ./CHANGE-PROPOSAL-VCARD-CONTACT-VERSIONING.md
