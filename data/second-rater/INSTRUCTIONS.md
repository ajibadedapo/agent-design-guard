# Second-rater task: classify design-system rules

Thanks for doing this. It is a blind inter-rater check for a study on how much of a
design system's documented rules are mechanically checkable. Your independent
classification lets us report an agreement score (Cohen's kappa) instead of a
single person's opinion.

## What you're doing

Open `blind-rating-sheet.csv`. Each row is one documented rule taken verbatim (or
lightly paraphrased) from a public design system (Primer, Carbon, Polaris,
Spectrum, GOV.UK). For each row, put **one class letter** in the last column
(`Your class`), based only on the rule text and the class definitions below.

- Do **at least the first 40 rows** (that is enough for a kappa check).
- Do **all 212** if you're willing; that turns it into a full two-rater dataset.
- Please **do not** look at the position paper, the findings write-up, or any
  existing classification first. The whole point is that you decide independently.
- One letter per row. If you're genuinely torn between two, pick the one the rule
  is *mostly* about and note the other in a trailing comment after a `#` (optional).

## The classes

Ask, in order: *what information would a checker need to decide this rule?*

| Letter | Name | It constrains | Quick test |
|---|---|---|---|
| **V** | Value | A property value must be a design token | "use the token, not a raw colour/spacing/number" |
| **K** | Kind | Which element/component is allowed | "use `<Button>`, never a native `<button>`"; "component X is deprecated" |
| **P** | Property | A single component's props / prop combinations | "size must be sm/md/lg"; "if variant=danger then requiresConfirmation" (all within one component's props) |
| **S** | Structural | Relationships **between** nodes in the tree | count ("one primary per region"), containment ("no link inside a modal"), accompaniment ("danger needs a confirmation"), ordering ("cancel before confirm") |
| **PL** | Platform | Different realisation per platform/locale | "web uses a Dialog, mobile uses a BottomSheet" |
| **R** | Responsive | Changes with viewport / container size | "table on desktop, card list on mobile"; "full-screen dialog below Npx" |
| **D** | Dynamic | Only decidable after it renders/runs | contrast ratio, real focus order, measured spacing, reflow |
| **I** | Intent | Purpose, taste, data meaning, reversibility | "use sparingly"; "feel calm"; "no confirmation for reversible actions"; "label should read as a verb+noun" |

Rules of thumb:
- If the rule is about **one node in isolation** (its value, its kind, its own
  props) it's V, K or P. If it's about **how nodes relate** (counts within a
  region, ancestry, siblings, order) it's **S**.
- If deciding it needs the thing **on screen** (pixels, focus, contrast) it's **D**.
- If it depends on **why/when** to use something, or on judgement/taste, or on a
  fact about the underlying action (like whether it can be undone), it's **I**.
- **PL** and **R** are narrow: only when the rule explicitly changes by platform or
  by viewport.

## Returning it

Save the file with your letters filled in and send it back (keep the `ID` column
intact — that's how the two ratings are matched). That's it.

Agreement is then computed with `scripts/cohen-kappa.mjs`.
