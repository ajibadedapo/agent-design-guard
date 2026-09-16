# agent-design-guard

**agent-design-guard** is a design-language conformance checker. It decides whether a piece
of UI conforms to a design system, and returns structured violations with repair
hints. It is the mechanical half of design review, made executable.

Ordinary linters look at one node at a time (this Button has the wrong colour,
this input is missing a label). That covers value and kind rules, which are about
11% of what design systems actually write down. agent-design-guard also checks the rules that
only exist in the *relationships* between nodes: "at most one primary action per
region", "a destructive action must be accompanied by a confirmation", "nothing
navigational inside a modal", "the button set in this group must be an allowed
combination".

> On a sample of 212 documented rules across GitHub Primer, IBM Carbon, Shopify
> Polaris, Adobe Spectrum and GOV.UK: **~77% of design-system rules are
> mechanically checkable, ~10% are checked by any tool today, and structural
> rules are the largest class (32%) and the least covered (3 of 68).** agent-design-guard
> targets that gap. (See `data/classification-findings.md`.)

## The eight constraint classes

Every rule is tagged with the class it belongs to. The taxonomy is the point: it
separates what can be enforced statically, what needs rendering, and what cannot
be formalised at all.

| Class | What | agent-design-guard |
|---|---|---|
| **V** Value | values resolve to a token | `token-value` |
| **K** Kind | components not forbidden; natives replaced; deprecated warns | `forbidden-kind` |
| **P** Property | props satisfy a component schema (incl. cross-property) | `property-schema`, `conditional-prop` |
| **S** Structural | ancestry / siblings / regions | the 8 shapes below |
| **Π** Platform | per-platform component substitution | `patterns` + `--platform` |
| **Ρ** Responsive | breakpoint-indexed trees | `responsive` (note if it needs rendering) |
| **D** Dynamic | contrast, layout, focus order at runtime | out of scope (documented, not faked) |
| **I** Intent | "feel calm", "use sparingly" | out of scope (documented, not faked) |

## The thesis: non-compositionality

Structural rules need their own tool because they are **non-compositional**. A
modal is fine; a navigational link is fine; put the link inside the modal and you
have a trap. Nothing about either subtree is wrong in isolation, so you cannot
check a component alone and conclude the screen is correct. Conformance is
compositional for V/K/P but not for S/Π/Ρ, which is exactly why agents that
assemble individually-correct components still produce non-conforming screens.
`test/non-compositionality.test.js` demonstrates this in one screen.

## The eight structural shapes

These are the canonical vocabulary from the empirical study; nearly every
structural rule across the five systems is one of them.

1. **cardinality** — a role appears at most/at least/exactly N times in a scope.
2. **accompaniment** — a role requires one or more other roles in the same scope
   (with an optional `when` guard, e.g. only for irreversible actions).
3. **ordering** — roles appear in a defined order within a scope.
4. **containment** — a role/kind must (`inside`) or must not (`forbiddenInside`)
   have a matching ancestor. (Merges the old containment/exclusion/dependency.)
5. **sibling-consistency** — nodes of a role in a scope share a prop value (same
   size, all-or-none icons); the odd ones out are flagged.
6. **allowed-combination** — the set of variants/roles co-occurring in a scope
   must be an allowed combination (Carbon's button tables).
7. **literal-list** — a prop value must be in / not in a list (labels never in
   {OK, Confirm, Yes, Done}).
8. **conditional** — general: if a subtree matches `when`, it must satisfy `then`
   (a dialog containing a form must be full-screen).

Plus two utilities: **uniqueness** (distinct accessible labels) and
**cross-region-equality** (the page-actions primary must match the title-bar
primary — the tractable slice of the cross-screen problem).

## How it works

1. **Parse** JSX/TSX (`@babel/parser`, handles TypeScript and React Native JSX,
   including elements inside `items.map(...)`) or a JSON DOM snapshot into a
   normalized node tree (type, props, line, children).
2. **Assign roles.** A grammar declares roles as matcher predicates over a node's
   type and props. A `Button variant="primary"` becomes a `primary-action`; a
   `Dialog` becomes a `modal`. A node can hold several roles.
3. **Evaluate constraints** over the assembled tree. Each violation is reported as
   `file:line [severity] rule-id message` with `observed`/`expected` repair hints.

## Grammar

A grammar is one YAML file with `tokens`, `components`, `parameters`, `roles`,
`constraints`, and `patterns` sections. Every constraint carries a `class`, a
`classId` (tracing it to a documented design-system rule) and a `message`. See
`SPEC.md` for the full format and `grammars/primer.yaml` for a grammar that
exercises all eight classes and all eight structural shapes.

```yaml
components:
  Button: { variants: [primary, secondary, danger, ghost], sizes: [sm, md, lg], status: stable }
parameters:
  maxPrimaryPerRegion: 1
roles:
  primary-action:
    - type: [Button, Pressable]
      props: { variant: { not: [secondary, ghost, danger] } }
constraints:
  - id: one-primary-per-region
    class: structural
    shape: cardinality
    scope: { role: region }
    params: { role: primary-action, max: { param: maxPrimaryPerRegion } }
    classId: primer.button.emphasis
    message: A region may contain at most one primary action.
```

## Usage

```
npm install
npx agent-design-guard check grammars/primer.yaml fixtures/bad.tsx     # 14 violations, one per rule
npx agent-design-guard check grammars/primer.yaml fixtures/good.tsx    # clean, exit 0
npx agent-design-guard check grammars/primer.yaml fixtures/platform.tsx --platform ios
```

The CLI prints each violation as `file:line [severity] rule-id message`, ranked
by file and line, and exits nonzero when any error/warning is found (notes do not
fail). See `DOGFOOD.md` for a run against the real ServicePilot app with
`grammars/heroui.yaml`.

`agent-design-guard infer` observes how roles co-occur across the inputs and proposes
candidate rules for a human to accept; it never edits the grammar.

## Development

```
npm test
```

Tests use the Node test runner (`node --test`): one test per class and per
structural shape, the platform-substitution and `when`-guard extensions, the
non-compositionality demonstration, and the DOM-snapshot adapter.

## Inter-rater agreement

Classifying design-system guidance into rule classes is a judgment call, so
`scripts/kappa.mjs` computes Cohen's kappa between two raters from a CSV with
columns `item,raterA,raterB`:

```
node scripts/kappa.mjs labels.csv
```

## License

MIT, Hammed Ajibade.
