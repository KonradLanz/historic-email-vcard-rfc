# Phase 1: Forking CardBook & Testing Locally
## Historic Email Flag — Autocomplete Filter + Contact Editor Toggle

---

## Overview

This guide walks you through:
1. Forking CardBook on GitLab
2. Cloning your fork locally
3. Applying the Phase 1 patch (3 files changed)
4. Installing your patched version as a **temporary add-on** in Thunderbird
5. Switching back and forth between your fork and the official CardBook **without losing your contacts or settings**

Estimated time: ~45 minutes for setup, then live-edit/reload in seconds.

---

## Part 1 — Fork on GitLab

1. Go to **https://gitlab.com/CardBook/CardBook**
2. Click the **Fork** button (top-right)
3. Choose your personal GitLab namespace
4. Your fork is now at `https://gitlab.com/YOUR-USERNAME/CardBook`

---

## Part 2 — Clone locally

```bash
git clone https://gitlab.com/YOUR-USERNAME/CardBook.git
cd CardBook

# Add upstream so you can pull future updates
git remote add upstream https://gitlab.com/CardBook/CardBook.git

# Create your feature branch
git checkout -b feature/historic-email-flag
```

---

## Part 3 — The Phase 1 Patch

Phase 1 touches **3 files**. The changes are minimal and surgical.

### What changes and why

| File | Change | Why |
|---|---|---|
| `src/cardbookAutoComplete.js` | Skip addresses with `X-HISTORIC=TRUE` in suggestions | Core goal: prevent autocomplete of dead addresses |
| `src/cardbookContact.js` | Parse `X-HISTORIC` param from vCard; expose as `.historic` boolean | So the rest of the code can check it |
| `src/chrome/content/cardbook.xhtml` | Add "Historic" checkbox next to each email field | Let user set the flag manually |

---

### Patch File 1: `src/cardbookContact.js`

Find the email property parsing block. It will look something like:

```javascript
// EXISTING — somewhere around email property handling
case "EMAIL":
  aCard.emails.push({
    value: property.value,
    type:  getParam(property, "TYPE"),
    pref:  getParam(property, "PREF"),
  });
  break;
```

**Change it to:**

```javascript
case "EMAIL":
  aCard.emails.push({
    value:    property.value,
    type:     getParam(property, "TYPE"),
    pref:     getParam(property, "PREF"),
    // Phase 1: X-HISTORIC flag
    historic: getParam(property, "X-HISTORIC") === "TRUE",
    historicSince: getParam(property, "X-HISTORIC-SINCE") || null,
  });
  break;
```

And in the **serializer** (where the contact is written back to vCard text),
find where EMAIL properties are emitted and add:

```javascript
// EXISTING serializer
output += "EMAIL" + buildTypeParam(email) + ":" + email.value + "\r\n";

// CHANGE TO:
let emailParams = buildTypeParam(email);
if (email.historic) {
  emailParams += ";X-HISTORIC=TRUE";
  if (email.historicSince) {
    emailParams += ";X-HISTORIC-SINCE=" + email.historicSince;
  }
}
output += "EMAIL" + emailParams + ":" + email.value + "\r\n";
```

---

### Patch File 2: `src/cardbookAutoComplete.js`

Find the loop that pushes email address results:

```javascript
// EXISTING
for (let email of contact.emails) {
  results.push({
    value: email.value,
    label: contact.fn + " <" + email.value + ">",
  });
}
```

**Change it to:**

```javascript
for (let email of contact.emails) {
  // Phase 1: skip historic addresses in autocomplete
  if (email.historic) {
    continue;
  }
  results.push({
    value: email.value,
    label: contact.fn + " <" + email.value + ">",
  });
}
```

That is literally the entire autocomplete change — one `if (email.historic) continue;`.

---

### Patch File 3: Contact editor UI

In the contact editor template, find where email rows are rendered.
Add a checkbox at the end of each row:

```html
<!-- EXISTING email row -->
<div class="email-row">
  <input type="text" class="email-value" />
  <select class="email-type">...</select>

  <!-- ADD THIS -->
  <label class="historic-label"
         title="Mark as no longer active. Stays linked to old mail
                but won't appear in autocomplete.">
    <input type="checkbox"
           class="email-historic"
           data-index="{{index}}" />
    Historic
  </label>
</div>
```

And the JS event handler in the save function:

```javascript
document.querySelectorAll(".email-historic").forEach((checkbox) => {
  const index = parseInt(checkbox.dataset.index);
  contact.emails[index].historic = checkbox.checked;
  if (checkbox.checked && !contact.emails[index].historicSince) {
    contact.emails[index].historicSince =
      new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }
});
```

---

## Part 4 — Install in Thunderbird (Developer Mode, no uninstall needed)

### The key insight

Thunderbird's **Temporary Add-on** loads an unpacked extension directly from
a folder on disk. It coexists with the installed version *only if you disable
the official one first*. Your CardBook **data** (contacts, sync accounts) lives
in your Thunderbird profile folder — not inside the extension. Disabling or
swapping the extension never deletes or affects your contacts.

### Setup (one-time)

1. Open Thunderbird → **Tools → Add-on Manager** (`Ctrl+Shift+A`)
2. Find **CardBook** → click the toggle to **DISABLE** it
3. Open a new tab → go to **`about:debugging`**
4. Click **"This Thunderbird"** in the left sidebar
5. Click **"Load Temporary Add-on..."**
6. Navigate to your local clone → select **`manifest.json`** → Open

Your patched CardBook is now running against your real contacts.

### Live-edit / reload (no Thunderbird restart)

After any code change:
1. Go to `about:debugging`
2. Click **Reload** (↺) next to your temporary CardBook entry
3. Change is live in ~2 seconds.

### Switching back to official CardBook (~10 seconds)

```
1. about:debugging → Remove your temporary add-on
2. Add-on Manager → re-enable official CardBook
```

### Switching back to your fork (~10 seconds)

```
1. Add-on Manager → disable official CardBook
2. about:debugging → Load Temporary Add-on → manifest.json
```

---

## Part 5 — Test checklist

### Test 1: Set a historic flag
- Open CardBook → open any contact
- Check "Historic" on one email address → save
- Re-open contact → checkbox still checked ✓
- View raw vCard → `X-HISTORIC=TRUE` present on that EMAIL line ✓

### Test 2: Autocomplete filter
- Open new compose window → type the contact's name
- Historic address does NOT appear in suggestions ✓
- Other addresses still appear ✓

### Test 3: Old mail still links to contact
- Find an old email to/from the now-historic address
- Click sender → CardBook opens that contact ✓
- Historic address visible in contact, just marked ✓

### Test 4: Kolab roundtrip
- Flag an address → wait for CardBook to sync to Kolab
- Edit any other field in Roundcube → save
- Back in CardBook → refresh → `X-HISTORIC=TRUE` still present ✓
  (Roundcube must not strip unknown X- params)

---

## Part 6 — Commit and push to your fork

```bash
git add src/cardbookContact.js \
        src/cardbookAutoComplete.js \
        src/chrome/content/cardbook.xhtml

git commit -m "feat: add X-HISTORIC email flag (Phase 1)

- Parser: surfaces X-HISTORIC param as boolean on email objects
- Serializer: writes X-HISTORIC=TRUE and X-HISTORIC-SINCE back to vCard
- Autocomplete: skips historic addresses in compose suggestions
- Editor: adds Historic checkbox to each email field in contact editor

Backward compatible: X- params are preserved by RFC 6352 compliant
servers (Kolab). Clients that don't understand the param see a normal
email address with no behaviour change.

Part of: https://github.com/KonradLanz/historic-email-vcard-rfc"

git push origin feature/historic-email-flag
```

Then open a Merge Request:
- **From:** `YOUR-USERNAME/CardBook:feature/historic-email-flag`
- **To:** `CardBook/CardBook:master`
- **Title:** `feat: mark email addresses as historic (X-HISTORIC param)`
- **Description:** link to https://github.com/KonradLanz/historic-email-vcard-rfc

---

## Part 7 — Profile safety

Your Thunderbird profile lives at:

| OS | Path |
|---|---|
| Linux | `~/.thunderbird/<profile-id>/` |
| macOS | `~/Library/Thunderbird/Profiles/<profile-id>/` |
| Windows | `%APPDATA%\Thunderbird\Profiles\<profile-id>\` |

CardBook data is in `<profile>/calendar-data/` and synced CardDAV — not in the XPI.

**Backup before starting:**
```bash
cp -r ~/.thunderbird/<your-profile-id> ~/tb-profile-backup-$(date +%Y%m%d)
```

---

## Quick reference toggle table

| Mode | Official CardBook | Your Fork |
|---|---|---|
| Normal daily work | ✅ Enabled | ✗ Not loaded |
| Testing your patch | ✗ Disabled | ✅ Loaded via about:debugging |
| Switching time | ~10 seconds | ~10 seconds |
| Contacts affected? | Never | Never |
