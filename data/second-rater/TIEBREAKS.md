# Tie-break rules for adjudicating rater disagreements

Two independent raters (rater 1 = `gold-classification.csv`, rater 2 =
`machine-rater2.csv`) agreed on 136/212 rows and diverged on 76. The rules below
tighten the taxonomy at the boundaries where they actually diverged, and were
used to assign a single adjudicated class to every row in
`adjudicated-classification.csv`. Each rule is illustrated with one disputed ID.

## The rules

**TB1 — Value vs Dynamic: a fixed number/token is V, not D.**
A rule that fixes a specific pixel value, spacing, token, or colour-pairing is V:
it is checkable statically against source. D is reserved for what is knowable only
after render: contrast ratio, measured overflow/reflow/width, real focus/tab
order, actual geometry.
Example: **R027** (content stays inside a 16px safe area) is V, not D.

**TB2 — Value vs Property: raw style value is V, declared prop is P.**
A constraint on a raw CSS/style value a linter reads from the stylesheet
(text-align, icon side, colour match, wrap / no-ellipsis, full-bleed) is V. P is
reserved for a single component's declared props, prop enums, or prop
combinations (size=sm|md|lg, variant, loading⇒disabled, a required `title` prop,
"has a label or an icon").
Example: **R069** (label left-aligned, never centered) is V; **R155** (every
action has a text label, an icon, or both) is P.

**TB3 — Dynamic vs Structural: judge the requirement, not the trigger.**
If the requirement is the presence / containment / ordering / count of a static
node in the composed tree, and the trigger is a rendered layout condition (e.g.
the body overflows), it is S with a runtime-trigger note. It stays D when
verifying needs real focus/keyboard/tab order, measured geometry, or an async
state/flow (validation, server failure, loading sequence, redirect).
Example: **R025** (add a footer divider when the body scrolls) is S; **R055**,
**R146**, **R148** (async failure/loading state) stay D.

**TB4 — Property vs Intent: mechanical string check is P, meaning is I.**
Label casing, a literal blacklist/whitelist of words, a format pattern, or a
mechanical action→icon / target⇒icon mapping is P. It is I when deciding needs
understanding the action's meaning or reversibility, or the label matching what
the action does.
Example: **R121** (avoid Done/OK) is P; **R129** (title and button must reflect
the action) is I.

**TB5 — Structural vs Intent: soft cardinality keeps its count proxy.**
A count / ordering / combination rule scoped to a region is S even when the
threshold is soft ("too many", "overuse", "sparingly", "keep small"), because the
mechanical proxy is a count. It is I only when there is no structural proxy at
all, just taste or purpose.
Example: **R203** (too many secondary buttons) is S; **R188** (do not overuse the
accent colour) is S.

**TB6 — Kind, purpose-gates, and role→prop mappings.**
Choosing which element/component to use (link vs button, one component
substituted for another) is K when the choice is mechanical from a role or
attribute (href, start-tag). It is I when the substitution is gated on a purpose
you must infer ("used to indicate selection", "background-process alert"). And a
rule whose consequent is a prop mapped from the component's own role/variant is
P, not S.
Example: **R064** (use a link, not a button, for navigation) is K; **R017**
(don't use ButtonGroup to indicate selection) is I; **R133** (passive modals
close on outside click, transactional do not) is P.

## Honest note on status

This is a *machine* adjudication. Its only purpose is to tighten the taxonomy's
tie-break rules and produce a consistent reference labelling at the boundaries
where the two raters diverged; it is not itself an independent human rating and
must not be counted as a third rater or as ground truth. An independent human
rater (Akinruli Oluwaseun) remains the rater of record. Their labels, not these,
are what should be paired with rater 1 (or rater 2) when an agreement figure
(e.g. Cohen's kappa) is computed and cited to a reviewer. Treat this file and
`adjudicated-classification.csv` as an internal rubric-sharpening artifact only.
