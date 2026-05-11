# Change Proposal: Temporal Validity Parameters for vCard 4.0 Properties

**Branch:** `feature/temporal-validity-params`  
**Targets:** RFC 6350 (vCard Format Specification), RFC 6352 (CardDAV), RFC 7095 (jCard)  
**Status:** Pre-draft — bigger change, longer IETF timeline  
**Relation to `main`:** This branch supersedes the simpler `HISTORIC` boolean flag proposed in `CHANGE-PROPOSAL-VCARD-RFC6350.md` on `main`. The `HISTORIC` flag remains suitable as a minimal/fast-track change; this proposal is the *correct* long-term design.

**Intellectual inspiration:** Hugh Darwen & C.J. Date — *Tutorial D* / *The Third Manifesto* — temporal databases, valid-time and transaction-time semantics (see also: ISO SQL:2011 temporal tables, TSQL2).

**Parent proposal:** https://github.com/KonradLanz/historic-email-vcard-rfc

---

## 1. Motivation: Why a Boolean Flag is Insufficient

The `HISTORIC` type parameter proposed on `main` answers the question *"is this address still in use?"* with a binary yes/no. Real-world contact histories are richer:

- An email address was valid **from** 2012 **until** 2019, then reactivated in 2023.
- A phone number was a direct line **until** a corporate restructure; the number still exists but now reaches a different person.
- An address was valid **from** an approximate year when exact date is unknown.
- A value is valid **from** a known date with no known end (still current).
- A value has an end date but no known start (historical import).

A boolean `HISTORIC` flag collapses all of this to a single bit. A `[VALID-SINCE, VALID-UNTIL]` interval preserves the full temporal structure, is backward-compatible (a `HISTORIC` flag is exactly the case where `VALID-UNTIL` < now and `VALID-SINCE` is absent or irrelevant), and aligns vCard with how relational databases have handled temporal data since **ISO SQL:2011**.

---

## 2. Theoretical Grounding: Darwen/Date Temporal Relational Theory

Hugh Darwen and C.J. Date's **Tutorial D** formalises two orthogonal time axes for any fact:

| Axis | Meaning in Tutorial D | vCard analogue |
|---|---|---|
| **Valid time** | When the fact was true in reality | When the email address was in use |
| **Transaction time** | When the fact was recorded in the database | When the vCard was last modified (`REV`) |

vCard already has transaction time via the `REV` property. What it lacks is **valid time** at the *property-value level*.

In Tutorial D terms, each vCard property value is a row in a relation. Adding valid-time intervals to property values turns the vCard into a **temporal relation** — a first-class representation of a contact's history, not just their current state.

This is not academic: SQL:2011 `PERIOD FOR VALID_TIME` and `AS OF` queries are now supported by PostgreSQL (via temporal extensions), Oracle, and MariaDB. Kolab/Roundcube stores contacts in relational databases; aligning vCard temporal semantics with SQL:2011 temporal tables creates a clean mapping between the wire format and the storage layer.

---

## 3. Proposed Parameters

### 3.1 `VALID-SINCE`

```
Parameter name: VALID-SINCE
Applies to:     Any property that carries a value identifying a communication
                endpoint or location: EMAIL, TEL, ADR, URL, IMPP, GEO, KEY
Value type:     date-and-or-time (as per RFC 6350 §4.3)
Cardinality:    *1 (at most one per property instance)
Default:        absent = unknown / time immemorial
Example:        VALID-SINCE=2015-03-01
                VALID-SINCE=2015  (year precision)
```

Semantics: The property value became applicable to this entity at or after the given point in time. Before this point the value SHOULD NOT be used for new communications and SHOULD be displayed with a temporal caveat.

### 3.2 `VALID-UNTIL`

```
Parameter name: VALID-UNTIL
Applies to:     Same set as VALID-SINCE
Value type:     date-and-or-time
Cardinality:    *1
Default:        absent = still current / open end
Example:        VALID-UNTIL=2022-12-31
```

Semantics: The property value ceased to be applicable to this entity after the given point in time. A value where `VALID-UNTIL` < current-date MUST NOT be offered in autocomplete for new communications. Applications MAY use it for contact-linkage to historical messages.

### 3.3 Derived concept: "historic" = `VALID-UNTIL` < now

The `HISTORIC` type param from `main` is exactly the degenerate case:

```
EMAIL;TYPE=HISTORIC:old@x.com
```

is semantically equivalent to:

```
EMAIL;VALID-UNTIL=<some-past-date>:old@x.com
```

Implementations that cannot yet parse `VALID-UNTIL` can fall back to `TYPE=HISTORIC` for the simple case. Both parameters SHOULD be emitted during a transition period.

### 3.4 PREF interaction

A value with `VALID-UNTIL` < now MUST NOT carry `PREF`. If both are present, `PREF` MUST be ignored. The `VALID-SINCE`/`VALID-UNTIL` interval takes precedence over `PREF` for determining whether a value is actionable.

---

## 4. Example vCard

```vcard
BEGIN:VCARD
VERSION:4.0
FN:Konrad Lanz
EMAIL;TYPE=WORK;PREF=1:konrad.current@example.com
EMAIL;TYPE=WORK;VALID-SINCE=2018-01-01;VALID-UNTIL=2022-12-31:konrad.old@example.com
EMAIL;TYPE=WORK;VALID-SINCE=2010-01-01;VALID-UNTIL=2017-12-31:konrad.older@iaik.tugraz.at
TEL;TYPE=VOICE;PREF=1;VALID-SINCE=2020-06-01:+43 316 000000
TEL;TYPE=VOICE;VALID-UNTIL=2020-05-31:+43 316 999999
END:VCARD
```

This single vCard now contains the complete reachability history of the contact. A mail client can use `VALID-UNTIL` to suppress the IAIK address from autocomplete while still resolving messages from 2011 to the correct contact card.

---

## 5. jCard (RFC 7095) Mapping

In jCard, parameters are represented as a JSON object. The temporal parameters become:

```json
[
  "email",
  { "type": "work", "valid-since": "2018-01-01", "valid-until": "2022-12-31" },
  "text",
  "konrad.old@example.com"
]
```

---

## 6. Microformats h-card Mapping

Branch `feature/temporal-validity-params` supersedes the `historic` class proposal with data attributes:

```html
<a class="u-email"
   data-valid-since="2018-01-01"
   data-valid-until="2022-12-31"
   href="mailto:konrad.old@example.com">konrad.old@example.com</a>
```

Parsers emit:

```json
{
  "value": "konrad.old@example.com",
  "valid-since": "2018-01-01",
  "valid-until": "2022-12-31"
}
```

The `historic` boolean class (from `main`) remains valid as a shorthand for consumers that do not need temporal precision.

---

## 7. Analogues in Existing vCard Parameters

The question "does vCard already have annotated/qualified parameters?" — yes, in several places:

| Existing param | What it qualifies | Notes |
|---|---|---|
| `PREF=1..100` | Preference rank among values | Numeric ordering already on individual values |
| `TYPE=WORK\|HOME\|...` | Context of use | Multi-valued, extensible |
| `ALTID` | Groups related values across languages/scripts | Cross-property linkage |
| `PID` | Property-instance identifier for sync | Used by CardDAV for per-value tracking |
| `MEDIATYPE` | MIME type of URI value | Per-value annotation |
| `CALSCALE` | Calendar system for date values | Per-value annotation |
| `GEO` on `ADR` | Geographic coordinates for a specific address | Per-value compound annotation |
| `TZ` on `ADR` | Timezone for a specific address | Per-value annotation |

**Key observation:** `GEO` and `TZ` as parameters on `ADR` are exactly the precedent. RFC 6350 §6.3.1 explicitly allows `GEO` as a parameter on `ADR` to give geographic coordinates for *that specific address*. This is a per-value annotation of the same kind as `VALID-SINCE`/`VALID-UNTIL`. The temporal parameters proposed here follow the same pattern.

**`ALTID`** is particularly relevant: it groups property instances that represent the same "thing" in different representations (e.g., same phone number in international and local format). `VALID-SINCE`/`VALID-UNTIL` could be combined with `ALTID` to group the history of a single "email slot" across multiple values.

---

## 8. Comparison with the `HISTORIC` Flag Approach (`main`)

| Criterion | `TYPE=HISTORIC` (main) | `VALID-SINCE`/`VALID-UNTIL` (this branch) |
|---|---|---|
| Complexity | Minimal | Moderate |
| Expressiveness | Binary: in-use / not | Full interval: start, end, open ends |
| Multiple past addresses | No ordering | Chronological reconstruction possible |
| SQL:2011 / temporal DB alignment | No | Yes |
| Backward compat | Excellent | Good (unknown params preserved) |
| IETF timeline | Short (errata-style) | Longer (new draft, WG needed) |
| Client implementation effort | Trivial | Low–moderate |
| Recommended for | Quick wins, minimal clients | Long-term correct design |

**Recommendation:** Ship `TYPE=HISTORIC` on `main` as a fast-track minimal change. Pursue `VALID-SINCE`/`VALID-UNTIL` as the full revision on this branch. Once the full revision is adopted, `TYPE=HISTORIC` becomes a deprecated alias for `VALID-UNTIL=<past-date>`.

---

## 9. IANA Registration (proposed)

Two new rows in the "vCard Parameters" IANA registry:

| Parameter | Value type | Applies to | Reference |
|---|---|---|---|
| VALID-SINCE | date-and-or-time | EMAIL, TEL, ADR, URL, IMPP, GEO, KEY | [this-RFC] |
| VALID-UNTIL | date-and-or-time | EMAIL, TEL, ADR, URL, IMPP, GEO, KEY | [this-RFC] |

---

## 10. Next Steps

1. Merge `main` `HISTORIC` flag proposal as the minimal fast-track change.
2. Recruit co-authors familiar with SQL:2011 temporal semantics and the vcarddav community.
3. Review TSQL2 and ISO SQL:2011 Part 2 temporal table syntax for alignment.
4. Submit `draft-lanz-vcard-temporal-validity-00` to IETF.
5. Open parallel issues in CardBook and Roundcube referencing the draft.
6. Explore whether `ALTID` grouping can link the history of a single "email slot".

---

*This branch is open for PRs. The goal is to refine this proposal to the point where a clean Internet-Draft XML file can be generated from it.*
