/**
 * PATCH: cardbookContact.js — Phase 1
 * Historic email flag: parser + serializer
 *
 * HOW TO APPLY:
 * Search for the EMAIL case in the vCard property parser.
 * Replace the push() call and add the serializer change.
 * See GUIDE-FORK-AND-TEST.md Part 3, Patch File 1 for full context.
 *
 * Coordination repo: https://github.com/KonradLanz/historic-email-vcard-rfc
 */

// ─── PARSER CHANGE ────────────────────────────────────────────────────────────
// Find: the EMAIL case inside the vCard property switch/if block
// Replace the push() call with this:

/*
case "EMAIL":
  aCard.emails.push({
    value:         property.value,
    type:          getParam(property, "TYPE"),
    pref:          getParam(property, "PREF"),
    // Phase 1 — Historic email flag
    // Reads X-HISTORIC;X-HISTORIC-SINCE from vCard.
    // Falls back to false / null if param absent (backward compat).
    historic:      getParam(property, "X-HISTORIC") === "TRUE",
    historicSince: getParam(property, "X-HISTORIC-SINCE") || null,
  });
  break;
*/

// ─── SERIALIZER CHANGE ────────────────────────────────────────────────────────
// Find: the line that writes EMAIL back to vCard text.
// It will look like:
//   output += "EMAIL" + buildTypeParam(email) + ":" + email.value + "\r\n";
// Replace with:

/*
  let emailParams = buildTypeParam(email);
  if (email.historic) {
    emailParams += ";X-HISTORIC=TRUE";
    if (email.historicSince) {
      // ISO 8601 compact: 20250515T163200Z
      emailParams += ";X-HISTORIC-SINCE=" + email.historicSince;
    }
  }
  output += "EMAIL" + emailParams + ":" + email.value + "\r\n";
*/

// ─── NOTES ────────────────────────────────────────────────────────────────────
// X-HISTORIC is an X- parameter per RFC 6350 §5.1.
// RFC 6352 §10.3.2 requires compliant CardDAV servers (incl. Kolab) to
// preserve unknown X- parameters on round-trip — no server change needed.
// Clients that don't know X-HISTORIC simply see a normal EMAIL property.
