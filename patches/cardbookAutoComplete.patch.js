/**
 * PATCH: cardbookAutoComplete.js — Phase 1
 * Skip historic email addresses in compose autocomplete suggestions.
 *
 * HOW TO APPLY:
 * Find the for...of loop that pushes email addresses into the results array.
 * Add the one-line guard shown below.
 *
 * Coordination repo: https://github.com/KonradLanz/historic-email-vcard-rfc
 */

// ─── AUTOCOMPLETE FILTER ─────────────────────────────────────────────────────
// Find: the results.push() loop over contact.emails
// Add the historic guard at the top of the loop body:

/*
for (let email of contact.emails) {

  // Phase 1: do not suggest historic addresses when composing new mail.
  // The address is NOT deleted — it still links old received/sent mail
  // to this contact. It simply won't surface as a suggestion.
  if (email.historic) {
    continue;
  }

  results.push({
    value: email.value,
    label: contact.fn + " <" + email.value + ">",
    // ... rest of existing push properties unchanged
  });
}
*/

// ─── COMPOSE-WINDOW WARNING (Phase 2 — not in this patch) ────────────────────
// When a user REPLIES to an old mail, the To: field is pre-filled with
// the old address from message headers (bypassing autocomplete).
// Phase 2 will add a banner warning to the compose window in that case.
// This requires a composeScripts manifest entry and onBeforeSend hook.
// Filed as: https://github.com/KonradLanz/historic-email-vcard-rfc
//           → CHANGE-PROPOSAL-CARDBOOK.md §Phase-2
