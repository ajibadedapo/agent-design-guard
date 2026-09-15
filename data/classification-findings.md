# Most design-system rules are checkable. Almost none are checked.

*Draft of §4 (empirical grounding) for the design-language conformance position paper. Companion workbook: `design-rule-classification.xlsx`.*

## What was done

Every documented rule on a sample of pages from five public design systems — GitHub Primer, IBM Carbon, Shopify Polaris, Adobe Spectrum and GOV.UK — was extracted and classified against the constraint taxonomy from §3.3. "Rule" means any sentence phrased as should / must / never / only / avoid / prefer. Descriptions and anatomy were ignored.

Sample per system: the button component, the dialog or modal component (or pattern), and where one exists a destructive-action or confirmation pattern. That is deliberately the densest part of any design system. 212 rules were classified.

Two systems are under-sampled for reasons that are themselves findings. Spectrum's guideline site renders only with JavaScript, so its rules are not retrievable as text without a browser. Polaris's current documentation on shopify.dev lists component properties only; the usage guidance survives solely on the legacy React site, which is marked deprecated. Both should be re-sampled from mirrored sources before publication.

## Headline figures

| Measure | Count | Share |
|---|---|---|
| Statically checkable (classes V, K, P, S, PL, R) | 132 | 62% |
| Dynamically checkable (class D) | 32 | 15% |
| **Mechanically checkable, static or dynamic** | **164** | **77%** |
| Intent, not formalisable (class I) | 48 | 23% |
| Checked today by any tool, fully | 12 | 6% |
| Checked today, including partial coverage | 22 | 10% |
| Structural rules (S) checked by any tool today | 3 of 68 | 4% |
| **Verification gap: checkable but unchecked** | **142** | **67%** |

Three quarters of what design systems ask for can be decided by a machine, and roughly one in ten of those rules is currently decided by one.

## Distribution by class

| Class | Primer | Carbon | Polaris | Spectrum | GOV.UK | Total | Share |
|---|---|---|---|---|---|---|---|
| V Value | 3 | 13 | 2 | 2 | 0 | 20 | 9% |
| K Kind | 1 | 1 | 1 | 0 | 1 | 4 | 2% |
| P Property | 10 | 12 | 4 | 3 | 2 | 31 | 15% |
| S Structural | 17 | 31 | 11 | 4 | 5 | 68 | 32% |
| PL Platform | 1 | 1 | 0 | 0 | 1 | 3 | 1% |
| R Responsive | 3 | 1 | 1 | 1 | 0 | 6 | 3% |
| D Dynamic | 11 | 17 | 1 | 1 | 2 | 32 | 15% |
| I Intent | 16 | 16 | 9 | 2 | 5 | 48 | 23% |
| Total | 62 | 92 | 29 | 13 | 16 | 212 | |

The single largest class is structural (32%) — cardinality, containment, accompaniment and ordering over the interface tree. This is the class that existing tooling covers least (three rules, all of them accessibility side-effects rather than the design rule itself) and the class that the non-compositionality argument in §3.4 says per-component linting cannot reach. It is also the class that grows fastest as documentation matures: Carbon, the most mature system in the sample, is 34% structural by count and publishes explicit tables of allowed and forbidden button combinations.

Value and kind rules together are 11%. This is the entire territory of today's design-system linting.

## What the structural rules look like

Eight rule shapes account for nearly every structural rule across all five systems:

- **cardinality**(role, scope, max) — one primary per page, per dialog, per group; at most two secondary page actions; no more than two filled buttons in a card
- **accompaniment**(role, requires, scope) — a danger trigger requires a confirmation; an icon-only button requires a tooltip; a secondary button requires a primary
- **ordering**(roles, container) — cancel outermost left, primary outermost right; delete at the bottom of an action list; primary on top in vertical stacks
- **containment**(kind, forbidden-inside) — no data table, tabs, accordion, side navigation or navigating link inside a modal; no form inside a side sheet
- **sibling-consistency**(property, group) — same size, same width, all-or-no icons within a button group
- **allowed-combination**(variants, group) — Carbon's enumerated two- and three-button tables
- **literal-list**(property, allow | deny) — labels never in {Yes, OK, Confirm, Done}; toggle label exactly "Turn on" or "Turn off"
- **conditional**(containment ⇒ property) — a dialog containing an input must be full-screen on narrow viewports; a dialog containing a form must not dismiss on backdrop click

These eight are the core vocabulary the specification language needs. 56% of all rules are expressible in the draft YAML from the position paper as written; a further 20% need small extensions, chiefly numeric thresholds the documentation leaves vague ("too many", "sparingly"), cross-region equality (the page-actions primary must match the title-bar primary), and hooks for runtime checks. Only the intent class is out of reach.

## Where intent actually lives

The 23% classified as intent falls into four recurring kinds, and naming them matters because each has a different remedy:

1. **Reversibility and blast radius.** "No confirmation for reversible actions"; "type-to-confirm only for wide impact"; "warning buttons only for what cannot be undone." These are conditional on a property of the *data operation*, not the UI. They become checkable the moment the codebase annotates actions with reversibility — a one-word attribute, and a plausible convention to propose.
2. **Purpose-based substitution.** "Don't use a button group to indicate selection; use a segmented control." Requires knowing what the group is for. Partly recoverable from behaviour (does selection state exist?).
3. **Content grammar.** {verb}+{noun}, "never a noun-only label", "never mislead." Needs language understanding; a small model could score it, but it is not a decision procedure.
4. **Restraint.** "Use sparingly", "avoid overuse", "not every page needs a primary." Structural in shape, but the threshold is a judgement. These convert to class S the moment an organisation picks a number.

Very little of the intent class is aesthetic. The "taste problem" is real but it is a small fraction of what design systems actually write down; most stated intent is missing data, not missing formalism.

## Contradictions between systems

A shared checker must treat these as parameters, not defaults:

- Icon position: Carbon right of label, Polaris left.
- Nested dialogs: Carbon never, Primer up to two.
- Primary alignment: Carbon left on pages and right in dialogs; GOV.UK left of the form; Primer right in dialog footers.
- Destructive confirmation: Primer forbids confirmation for reversible actions; GOV.UK requires an extra step for serious ones. Compatible, but only once reversibility is known.

That the rules disagree is the argument for a language rather than a linter: the shapes are shared, the values are not.

## What this does and doesn't establish

It establishes that the checkable-but-unchecked gap is large and that its centre of mass is structural. It does not yet establish the shares to better than about ten points: this is one rater, one pass, four pages per system, and two systems under-sampled. Before a full paper it needs a second rater and inter-rater agreement, the full documentation of at least three systems rather than three pages, and re-sampling of Spectrum and Polaris from complete sources.

It also surfaces a boundary the single-tree model does not cover: several rules are structural *across screens* (redirect to the parent after deletion; warning style only on the final confirmation screen). These are the flow constraints listed as an open problem in §9, and they appeared unprompted in a sample this small, which suggests the extension is needed sooner rather than later.

## Immediate implications

For the checker: implement the eight structural shapes first. Tokens and kinds are 11% of the problem and already have tools.

For the specification: add three things to the draft — numeric thresholds as adopter-supplied parameters, an optional reversibility attribute on actions, and cross-region equality.

For the pitch: the one-line version is now a number. *Three quarters of what your design system asks for is machine-checkable. Ten percent of it is checked.*
