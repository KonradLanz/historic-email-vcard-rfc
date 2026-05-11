# Change Proposal: Microformats h-card — `historic` Class for Email and Tel Values

**Targets:** Microformats2 `h-card` property vocabulary  
**Upstream:** https://microformats.org/wiki/h-card  
**Process:** Microformats wiki edit + mailing list discussion (microformats@microformats.org)  
**Status:** Pre-proposal  
**Parent proposal:** https://github.com/KonradLanz/historic-email-vcard-rfc

---

## 1. Background

`h-card` is the Microformats2 vocabulary for representing contact information in HTML. Properties include `u-email`, `p-tel`, `u-url`, and others. There is no current mechanism to indicate that a value is historic.

Microformats are typically embedded in public HTML pages (personal homepages, organisation pages) and parsed by search engines, social readers, and contact importers. A historic email address on a public page may still appear in autocomplete data derived from web crawls.

---

## 2. Proposed Vocabulary Addition

### 2.1 `historic` value class

Add `historic` as a recognised value modifier class for `u-email`, `p-tel`, `u-url`, and `u-impp` properties within an `h-card`.

**HTML example:**

```html
<div class="h-card">
  <a class="u-email" href="mailto:konrad.new@example.com">konrad.new@example.com</a>
  <a class="u-email historic" href="mailto:konrad.old@example.com">konrad.old@example.com</a>
</div>
```

### 2.2 Parser semantics

Microformats2 parsers that encounter a `historic` class on a property value SHOULD:

- Include the value in the parsed output with an additional `"historic": true` flag in the value object.
- **Not** promote the value to `PREF` status.

**Parsed JSON output example:**

```json
{
  "type": ["h-card"],
  "properties": {
    "email": [
      {"value": "konrad.new@example.com"},
      {"value": "konrad.old@example.com", "historic": true}
    ]
  }
}
```

### 2.3 Mapping to vCard

When an h-card is converted to vCard (e.g., by a browser extension or a server-side import), a `u-email historic` value SHOULD be rendered as:

```
EMAIL;TYPE=HISTORIC:konrad.old@example.com
```

---

## 3. Backward Compatibility

- Existing parsers ignore unknown classes; `historic` on a `u-email` will be treated as an additional email address — the current (already ambiguous) situation.
- No existing h-card content is invalidated.

---

## 4. Next Steps

1. Start a thread on the microformats discuss mailing list.
2. Edit the [h-card wiki page](https://microformats.org/wiki/h-card) to add `historic` to the property notes for `u-email` and related properties.
3. Open a PR to the [microformats2-parsing spec](https://github.com/microformats/microformats2-parsing) to update parser rules.
4. Update the [mf2py](https://github.com/microformats/mf2py) and [mf2util](https://github.com/kylewm/mf2util) parsers.

---

*Open a PR here to refine the proposal before it is posted to the microformats mailing list.*
