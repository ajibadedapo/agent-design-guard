# agent-design-guard specification: design-language conformance

agent-design-guard decides whether a piece of UI **conforms** to a design language. A design
language is a set of primitives (tokens, components, roles) together with
constraints over the interface tree. This document defines the constraint
taxonomy the checker implements, the conformance relation, the violation/repair
schema, and the full grammar file format.

It follows the model in `data/position-paper.md` (§3 constraint classes, §3.4
conformance, §3.5 repair, §3.6 patterns, §5 spec language) and the empirical
shape inventory in `data/classification-findings.md`.

## Model

An interface `U` is a finite ordered tree. Each node has a **kind** (component or
native element), a **property map**, a **region/role** label, and inherits a
**platform** from the root. agent-design-guard builds this tree from JSX/TSX (`src/adapter.js`,
via Babel) or from a JSON DOM/AST snapshot (`src/adapters/dom.js`), assigns roles,
then evaluates constraints.

## The constraint classes

Constraints are classified by what information the check requires. This taxonomy
determines what can be enforced and how.

| Class | Name | What it checks | Decidability | agent-design-guard shapes |
|---|---|---|---|---|
| **V** | Value | property values resolve to a token in a typed domain | static, local, linear | `token-value` |
| **K** | Kind | node kinds are components with status ≠ forbidden; native elements replaced; deprecated warns | static, local, linear | `forbidden-kind` |
| **P** | Property | property maps satisfy a component schema, incl. cross-property rules | static, local, linear | `property-schema`, `conditional-prop` |
| **S** | Structural | constraints over ancestry, siblings, regions | static, polynomial | 8 shapes below + `uniqueness`, `cross-region-equality` |
| **Π** | Platform | per-platform component substitution; reduces to S given `p` | static given platform | `patterns` + `--platform` |
| **Ρ** | Responsive | breakpoint-indexed family of trees | static iff branches encoded, else requires render | `responsive` (note when it cannot decide) |
| **D** | Dynamic | computed contrast, real spacing, focus order after layout | requires execution | **out of scope** (documented, not faked) |
| **I** | Intent | "feel calm", "use sparingly" | not formalisable | **out of scope** (documented, not faked) |

Empirically (classification-findings.md, 212 rules across five systems): V+K+P+S+
Π+Ρ ≈ 62% statically checkable, +15% dynamic = ~77% mechanically checkable,
while ~10% is checked by any tool today, and **structural is the largest class
(32%) and the least covered (3 of 68 rules)**. agent-design-guard targets that gap.

## Conformance

`U` **conforms** to `L` on platform `p` iff every constraint of class V, K, P, S,
Π, Ρ holds. Class D extends this after rendering; class I is excluded by
definition.

- Conformance is **compositional** for V, K, P: a tree conforms iff each node does.
  Repairs for these classes are local and guaranteed to remove the violation.
- Conformance is **not compositional** for S, Π, Ρ: a subtree valid in isolation
  can violate cardinality, containment or accompaniment once placed in context.
  This is why per-component linting cannot reach structural rules, and why the
  checker evaluates the assembled tree. See `test/non-compositionality.test.js`.

## Violations as repair instructions

A check returns a set of violations, each carrying
`⟨ruleId, class, classId, shape, location, observed, expected, severity, message⟩`.
`observed` and `expected` are the repair hint (paper §3.5). For V, K, P the
`expected` value, when applied, is guaranteed to remove the violation; for S it
may introduce new violations (non-compositionality), which is why the checker is
run to a fixpoint in a repair loop rather than once. Severity is `error`,
`warning` (e.g. a deprecated component), or `note` (e.g. a responsive rule that
requires rendering to decide).

## Grammar file

```yaml
language: acme-ui          # metadata
version: 2.4

tokens:                    # T — named value sets; values outside are "raw"
  color:   [color.fg.default, color.action.primary, ...]
  spacing: [0, 4, 8, 12, 16, 24, 32]

components:                # C — component schemas + status + native replacements
  Button:
    variants: [primary, secondary, danger, ghost]
    sizes:    [sm, md, lg]
    status:   stable       # stable | experimental | deprecated | forbidden
  LegacyButton: { status: deprecated, replacement: Button }

parameters:                # adopter-supplied numeric thresholds
  maxPrimaryPerRegion: 1

roles:                     # Σ — semantic roles as matcher predicates
  primary-action:
    - type: [Button, Pressable]
      props: { variant: { not: [secondary, ghost, danger] } }

constraints:               # Φ — each tagged with class + classId + message
  - id: one-primary-per-region
    class: structural
    shape: cardinality
    scope: { role: region }
    params: { role: primary-action, max: { param: maxPrimaryPerRegion } }
    classId: acme.button.emphasis
    message: A region may contain at most one primary action.

patterns:                  # Π — named bundle: trigger + roles + platform subst
  destructive-action:
    trigger: { role: danger-action }
    roles:   [danger-action, confirmation]
    order:   [danger-action, confirmation]
    platform:
      web: { confirmation: ConfirmDialog }
      ios: { confirmation: BottomSheet }
```

`constraints:` is the canonical key (`rules:` is accepted as an alias). `{ param: name }`
anywhere in `params`/`when` resolves against `parameters:` at load.

### Matchers (roles)

A role is a list of matchers, OR'd. A matcher's `type` and `props` are AND'd.
Prop predicates: scalar (exact), list (one-of), boolean (truthiness, absent =
false), `'*'` (present), `{ present: true|false }`, `{ not: [...] }` (none of;
absent counts as "not"), `{ equals: v }` (strict, absent ≠ v).

### Scope

`scope` selects the set of subtrees a rule iterates: omitted / `document` (whole
tree), `{ role: r }` (one per node with role `r`), `{ type: t }`.

## Rule shapes

### Class V — `token-value`
`params: { prop | props, tokenSet? }`. Each named value must resolve to a token in
`tokens[tokenSet]`. With a numeric set the nearest token is reported. With no set,
raw values are flagged heuristically (hex `#rgb`/`#rrggbb`, `NNpx`, `rgb(...)`).

### Class K — `forbidden-kind`
`params: { forbid: [button, input, a], replace: { button: Button } }`. Native
kinds are rejected with their replacement. Independently, any node whose kind is a
`components` entry with `status: forbidden` is an error and `status: deprecated` a
warning, each pointing at `replacement`.

### Class P — `property-schema`, `conditional-prop`
- `property-schema` `{ component?, props: [variant, size] }`: a component's
  `variant`/`size` must be in its schema's allowed set.
- `conditional-prop` `{ role?, when, then: { prop, present | equals } }`:
  cross-property. If props match `when`, `then` must hold (e.g. `variant=danger ⇒
  requiresConfirmation` present).

### Class S — the study's 8 canonical structural shapes
1. `cardinality` `{ role, max | min | exactly }` in each `scope`.
2. `accompaniment` `{ role, requires: [roles] }` — every required role must be
   present in the same `scope`. Supports a `when` guard (see below).
3. `ordering` `{ order: [roles] }` — roles appear in the given order in `scope`.
4. `containment` `{ role | kind, inside?, forbiddenInside? }` — must (not) have a
   matching ancestor. (Merges the old containment/exclusion/dependency shapes.)
5. `sibling-consistency` `{ role, prop }` — all nodes of `role` in a `scope` share
   the same value of `prop`; the odd ones out are flagged (same size, all-or-none
   icons).
6. `allowed-combination` `{ role, variants | roles, allow? | deny? }` — the set of
   co-occurring variants/roles in a `scope` must be a subset of an `allow` set (or
   must not contain a `deny` set). Models Carbon's button-combination tables.
7. `literal-list` `{ role, prop, allow? | deny? }` — `prop`'s value must be in
   `allow` / not in `deny` (labels never in {OK, Confirm, Yes, Done}).
8. `conditional` `{ role | scope, when, then }` — general conditional. If the
   subtree matches `when` (`containsRole`, `containsKind`, or a prop predicate) it
   must satisfy `then` (a prop requirement or `containsRole`/`notContainsRole`).
   Models "a dialog containing a form must be full-screen".

Additional utility shapes:
- `uniqueness` `{ role, by }` — nodes of `role` in a `scope` are distinct by `by`
  (unique accessible labels). Absent values are not collisions.
- `cross-region-equality` `{ role, prop, regions: [A, B] }` — the value of `prop`
  on `role` nodes must be equal across two named region scopes (the page-actions
  primary must match the title-bar primary). This is the tractable slice of the
  cross-screen problem (see Limits).

Backward-compatible aliases (delegate to the canonical shapes; prefer the
canonical): `exclusion` → `containment(forbiddenInside)`, `dependency` →
`containment(inside)`, `mutual-exclusion` → `allowed-combination(deny)`.

### `when` guards (reversibility)
Any subject-bearing shape (e.g. `accompaniment`, `conditional-prop`) accepts an
optional top-level `when` prop-predicate evaluated on the trigger node, so
`destructive-requires-confirmation` fires only when the action is
`reversible: { equals: false }`. The adapters capture arbitrary props, so a
`reversible` annotation flows through unchanged.

### Class Π — patterns + `--platform`
A `pattern` is a trigger predicate + roles + structural template + per-platform
component substitution. `agent-design-guard check --platform web|ios|android` (default web)
resolves the substitution before class-S checks: a confirmation realised with a
platform's component that does not match the selected platform is flagged.

### Class Ρ — `responsive`
`{ role | kind, breakpointProp? }`. If the node encodes a breakpoint branch the
rule decides statically; otherwise it emits a `note` (severity `note`,
"requires-render") rather than guessing. This represents responsive rules without
faking dynamic rendering.

## Out of scope, by design

- **Class D (dynamic).** Computed contrast, post-layout spacing, runtime focus
  order. Checkable by execution (where accessibility tooling lives), not by static
  analysis. agent-design-guard does not emit fake static verdicts for these.
- **Class I (intent).** "Feels calm", "use sparingly". Not reducible to tree
  predicates. The remedy is (a) decompose into class-S/D proxies where a number or
  annotation exists, (b) human review. Making this boundary explicit is a feature.

## Limits: single tree vs cross-screen

The model is a single tree, so genuinely cross-screen rules ("redirect to the
parent after deletion", "warning style only on the final confirmation screen",
"the title on screen A must match the header on screen B") are not expressible in
general. `cross-region-equality` covers the tractable in-tree slice (two regions
in one tree). The full extension (paper §9) is a **graph of trees with navigation
edges**: nodes are screens, edges are transitions, and constraints range over
paths. agent-design-guard does not build that graph; it is the primary open problem.

## CLI

```
agent-design-guard check <grammar.yaml> <files...> [--platform web|ios|android]
agent-design-guard infer <grammar.yaml> <files...>
```

`check` prints `file:line [severity] ruleId message` per violation. Exit code:
`0` clean (notes allowed), `1` any error/warning, `2` bad invocation.
`infer` proposes candidate cardinality/accompaniment/containment rules from how
roles co-occur across the inputs, for a human to accept; it never edits the
grammar.
