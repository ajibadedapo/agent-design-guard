# UI Grammar

UI Grammar (`uigrammar`) is a checker for design-system rules that are
**structural**: they are properties of the UI element tree, not of any single
node. Ordinary linters look at one node at a time (this Button has the wrong
color, this input is missing a label). They cannot see rules that only exist in
the relationship between nodes: "exactly one primary action per region", "a
destructive action must be accompanied by a confirmation", "nothing navigational
may live inside a modal".

## The thesis: non-compositionality

The reason these rules need their own tool is that they are
**non-compositional**. Two subtrees that are each valid on their own can become
invalid the moment you compose them.

A modal dialog is fine. A navigational link is fine. Put the link inside the
modal and you have created a trap: the user can navigate away from a flow that
was supposed to be confirmed or dismissed first. Nothing about either subtree in
isolation is wrong. The violation lives in the composition.

Because validity is not preserved under composition, you cannot check a
component in isolation and conclude the screen is correct. You have to evaluate
rules over the assembled tree. That is what UI Grammar does.

## How it works

1. **Parse** a JSX or TSX file into a normalized tree of nodes (type, props,
   children, source line). Parsing uses `@babel/parser` so it handles TypeScript
   and React Native (HeroUI and Expo) style JSX, including elements produced
   inside expressions such as `items.map(...)`.
2. **Assign roles.** A grammar declares semantic roles as matcher predicates
   over a node's type and props. A `Button` with `variant="primary"` becomes a
   `primary-action`. A `Dialog` becomes a `modal`. An anchor, `Link`, or
   `role="link"` becomes `navigational`. A node can hold several roles at once.
3. **Evaluate rules.** Each rule has one of eight structural shapes and runs
   inside a scope selected from the tree. Violations are reported as
   `file:line rule-id message`.

## The eight rule shapes

Every rule in a grammar is one of these shapes. They are the product.

1. **cardinality**: a role must appear an exact count, at least N, or at most N
   times within a scope. Example: exactly one `primary-action` per region.
2. **uniqueness**: nodes of a role within a scope must be distinct by a given
   prop. Example: icon buttons in a region must have unique accessible labels.
3. **accompaniment**: if role A appears in a scope, role B must also appear in
   the same scope. Example: a `danger-action` must be accompanied by a
   `confirmation`.
4. **containment**: every node with role A must have an ancestor with role B.
   Example: a menu item must live inside a menu.
5. **exclusion**: no node with role A may have an ancestor with role B. Example:
   nothing `navigational` inside a `modal`.
6. **dependency**: every node with role A requires an ancestor with role B.
   Example: a submit button requires an ancestor form.
7. **mutual-exclusion**: two (or more) roles cannot co-occur within a scope.
   Example: a button cannot be both loading and disabled.
8. **ordering**: nodes carrying a listed set of roles must appear in the defined
   order within a scope. Example: in a dialog footer the secondary action comes
   before the primary action.

Containment, exclusion, and dependency all reason about the ancestor chain, but
they answer different questions. Containment and dependency are positive
(role A only makes sense inside role B); exclusion is negative (role A must never
be inside role B). Containment expresses spatial nesting, dependency expresses a
semantic prerequisite. They are separate shapes so a grammar can trace each to
its own classification category.

## Grammar format

A grammar is a YAML file with two sections, `roles` and `rules`.

```yaml
roles:
  primary-action:
    - type: [Button, Pressable]
      props:
        variant: primary
  navigational:
    - type: [a, Link, Anchor]
    - props:
        role: link

rules:
  - id: primer-one-primary-per-region
    shape: cardinality
    scope:
      role: region
    params:
      role: primary-action
      exactly: 1
    classId: primer.button.primary-emphasis
    message: A region must contain exactly one primary action.
```

Each role maps to a list of matchers. A matcher matches a node when its `type`
is in the listed types (if given) and all of its `props` match. A role matches
if any matcher in its list matches. Prop values can be a scalar (exact match), a
list (one of), a boolean (truthiness), or `'*'` (the prop is present).

Each rule declares:

- `id`: stable identifier printed with every violation.
- `shape`: one of the eight shapes above.
- `scope`: how the tree is partitioned for evaluation, selected `{ role: ... }`
  or `{ type: ... }`. The ancestor shapes (containment, exclusion, dependency)
  scan the whole document and need no scope.
- `params`: the shape's parameters (for example `role` and `exactly` for
  cardinality, `roles` for mutual-exclusion, `order` for ordering).
- `message`: the human readable explanation.
- `classId`: a category id tracing the rule back to a classification of
  design-system guidance.

The bundled `grammars/primer.yaml` implements real GitHub Primer guidance for
buttons, dialogs, and destructive actions, with one rule per shape (nine rules,
each with a `classId`).

## Usage

```
npm install
npx uigrammar check grammars/primer.yaml fixtures/*.tsx
```

The CLI prints each violation as `file:line rule-id message`, ranked by file and
line, and exits nonzero when any violation is found (exit 0 when clean).

`fixtures/bad.tsx` triggers exactly one violation per rule (nine total).
`fixtures/good.tsx` conforms and reports nothing.

## Development

```
npm test
```

Tests use the built-in Node test runner (`node --test`): one test per shape,
tests that the fixtures behave as specified, and an explicit
non-compositionality test showing two subtrees that are each valid alone yet
invalid when composed.

## Inter-rater agreement

Classifying design-system guidance into rule categories is a judgment call, so
`scripts/kappa.mjs` computes Cohen's kappa between two raters from a CSV with
columns `item,raterA,raterB`:

```
node scripts/kappa.mjs labels.csv
```

It prints the sample size, observed agreement, expected agreement, and kappa.

## License

MIT, Hammed Ajibade.
