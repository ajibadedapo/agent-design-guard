# Rulveo rule extraction, first pass

A single-rater extraction of discrete, testable rules from the public documentation of three
design systems, for the button, dialog/modal, and destructive/critical-action components. Every
row in `rules-workbook.csv` cites the page it came from. Every number below was computed from that
CSV, not carried over from any prior document.

## Sources fetched

- GitHub Primer: button component page (https://primer.style/components/button), button guidelines
  (https://primer.style/product/components/button/guidelines), dialog component page
  (https://primer.style/components/dialog), dialog guidelines
  (https://primer.style/product/components/dialog/guidelines).
- IBM Carbon: button usage (https://carbondesignsystem.com/components/button/usage/) and modal usage
  (https://carbondesignsystem.com/components/modal/usage/). The live pages render as a JS app and
  truncated on fetch, so the text was read from the canonical MDX source in the carbon-website repo
  (src/pages/components/{button,modal}/usage.mdx) and cited back to the public usage URLs.
- GOV.UK Design System: button component (https://design-system.service.gov.uk/components/button/).
  GOV.UK has no modal/dialog component (the system deliberately avoids them), so the destructive and
  confirmation rules come from its button guidance instead.

## Taxonomy

Each rule is classified by what it would take to check it mechanically.

- Class A (node-local): checkable by looking at a single element and its props (the kind of thing a
  linter does per node). Example: a danger button cannot be icon-only.
- Class B (structural): a property of the element tree, not a single node. Example: one primary
  button per region, a danger button must be accompanied by a confirmation dialog, nothing
  navigational inside a modal. This is Rulveo's target class.
- Class C (content/semantic): about wording or meaning. Example: button labels should be a verb plus
  noun, or an icon must relate to the action.
- Class D (rendered/visual): needs the rendered result. Example: focus order, colour contrast,
  alignment, responsive behaviour, motion.

Two extra fields per rule:

- checkable (yes/no): whether the rule is mechanically checkable end to end from source, with no
  human judgement and no semantic annotation required. A rule whose trigger is a semantic notion
  like "a serious destructive action" is marked no, because deciding what counts as destructive is
  not mechanical. A rule whose trigger is a concrete prop or variant (for example the danger button
  variant, or a passive modal) is marked yes when the companion condition is a tree property.
- checked_by_tool_today: names a real tool if one checks the rule today, otherwise blank.

## Counts (computed from rules-workbook.csv)

Total rules extracted: 67

Per system:

- GitHub Primer: 24
- IBM Carbon: 33
- GOV.UK: 10

Class distribution:

- Class A (node-local): 11
- Class B (structural): 26
- Class C (content/semantic): 17
- Class D (rendered/visual): 13

Headline shares:

- Mechanically checkable end to end: 27 of 67 (40.3%)
- Structural / Class B: 26 of 67 (38.8%)
- Class B that is also mechanically checkable: 20 of 67 (29.9%)
- Checked by any existing tool today: 3 of 67 (4.5%)

The three rules with an existing tool are all partial overlaps with axe-core: Primer dialog title
required (aria-dialog-name), Carbon icon-only button tooltip required (button-name), and GOV.UK
button contrast at least 4.5:1 (colour-contrast). No tool found in this pass checks any of the
Class B structural rules.

Per system, checkable and Class B counts:

- GitHub Primer: 24 rules, 11 checkable, 10 Class B
- IBM Carbon: 33 rules, 14 checkable, 14 Class B
- GOV.UK: 10 rules, 2 checkable, 2 Class B

### Reading of the numbers

Structural rules are the single largest class (38.8%) and are almost entirely unserved: the only
tools that touch any rule in this set are accessibility checkers hitting node-local or contrast
concerns. That is the gap Rulveo aims at. The end-to-end checkable share (40.3%) is lower than the
Class B share might suggest because several Class B rules key off a semantic trigger (for example
"destructive action") that a static checker cannot decide on its own; those become checkable only
once the destructive action is annotated. When the trigger is a concrete variant or prop instead
(danger button, passive vs transactional modal), the structural rule is checkable as written.

## Caveats (honest)

- This is a first pass. It is a single-rater extraction: one person (one model run) read the pages
  and assigned every class and checkable flag. There was no second rater and no inter-rater
  agreement measure, so the class boundaries (especially A vs B and B-checkable vs B-not) carry
  unmeasured subjectivity.
- Limited page set. Only the button, dialog/modal, and button-adjacent destructive-action pages of
  three systems were read. Accessibility subpages, pattern libraries, and other components were not
  covered. The counts describe this slice, not the whole of any design system.
- Rule boundaries are a judgement call. Some source sentences bundle two ideas and some were split
  or merged. A different rater could reasonably land on a different total, which shifts every
  percentage. Treat the percentages as approximate, not exact.
- Carbon text came from the MDX source rather than the rendered page because the live SPA truncated
  on fetch. The wording matches the published usage guidance but was not re-verified against the
  rendered page in this pass.
- checkable is defined as fully mechanical from source with no annotation. That definition is
  deliberately strict and depresses the checkable share. Under a looser definition (checkable given
  a destructive-action annotation), several more Class B rules would flip to yes.
- checked_by_tool_today reflects tools known to this rater at extraction time. Absence of a named
  tool means none was identified, not a proof that none exists.
- Not peer reviewed.
