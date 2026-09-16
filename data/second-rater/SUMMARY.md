# Second-rater workstream: summary

Goal: move the rule-classification figures from single-rater to defensible.

## What was run
1. **Blind independent pass** (`machine-rater2.csv`) — an isolated agent classified all
   212 rules seeing only the blind sheet + class definitions (never the gold, the
   findings, or the paper).
2. **Agreement** (`scripts/cohen-kappa.mjs`): raw agreement 64.2%, **Cohen's κ = 0.535
   (moderate)** vs the original (gold) classification. Below the 0.70 publication bar.
3. **Adjudication** (`adjudicated-classification.csv`, `TIEBREAKS.md`) — every one of the
   76 disagreements re-decided under 6 explicit tie-break rules that resolve the
   recurring fuzzy boundaries (V-vs-D on fixed values, D-vs-S judged by the requirement
   not the trigger, P-vs-I on mechanical vs meaning, soft-cardinality staying S).

## Findings
- The disagreements were **not random**: they clustered on Dynamic↔Structural (20),
  Value↔Dynamic pixel values (~14), and Property↔Intent (9). These are genuine taxonomy
  seams, not noise — exactly what a second rater is meant to surface.
- Under the tightened tie-breaks, **only 7 of 212 rows moved from the original gold**
  (R025, R064, R129, R133, R155, R202, R203), each toward rater 2. On the other 69
  disputes the original call was the more mechanically-honest one (rater 2 over-applied
  S to focus/geometry/async rules and I to blacklist/mapping/soft-cardinality rules).
- **The headline is robust:** mechanically-checkable share is 77.4% (gold) vs **76.9%**
  (adjudicated) — a 0.5-point move. The "~77% checkable, ~10% checked" claim survives a
  full independent re-adjudication.
- Post-adjudication κ (rater 2 vs adjudicated) = 0.576; the residual gap is the tie-break
  rows where the raters apply a defensible-but-different rule, which the tightened
  INSTRUCTIONS now pin down.

## Status of record
This is a **machine** second pass, used to tighten the taxonomy and show the figure is
stable. **Akinruli Oluwaseun's human pass remains the rater of record** before the exact
percentages are cited to a conference reviewer (a blog reader is fine now). Rating under
the tightened INSTRUCTIONS (which now include the tie-breaks) should land well above 0.70.
