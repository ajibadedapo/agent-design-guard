# Rulveo grammar specification

Rulveo checks a UI component tree against a grammar: a declarative description of
what the components in a design system *mean* and how they are allowed to be
composed. A grammar is a single YAML file with two sections, `roles` and `rules`.
This document defines both and the semantics of every rule shape.

## Model

Checking runs in three stages:

1. **Parse.** An adapter turns source into a normalized tree of nodes. Each node
   has a `type` (string), a `props` object, a `line` number, and `children`.
   Two adapters ship: JSX/TSX source (`src/adapter.js`, via Babel) and a DOM/AST
   snapshot in JSON (`src/adapters/dom.js`).
2. **Assign roles.** Every node is tested against each role's matchers. A node
   may hold zero, one, or many roles. Roles are the vocabulary the rules speak in,
   so a rule never names a raw component type, only a role.
3. **Evaluate rules.** Each rule is one of eight shapes, evaluated over the tree.
   A rule produces zero or more violations, each anchored to a node's line.

Separating roles from rules is deliberate: the same rule ("at most one primary
action per section") applies to any kit once you say what a "primary action" and
a "section" are in that kit.

## Grammar file

```yaml
roles:
  <role-name>:
    - <matcher>
    - <matcher>          # a role is matched if ANY matcher matches (OR)
rules:
  - id: <string>          # unique, stable; used in output and suppression
    shape: <shape-name>   # one of the eight below
    scope: <scope>        # optional; defaults to the document root
    params: { ... }       # shape-specific
    classId: <string>     # optional taxonomy id, carried into results
    message: <string>     # shown when the rule fires
```

`roles` and `rules` are both optional; an empty grammar checks nothing.

## Matchers

A matcher selects nodes by `type`, by `props`, or both. Within one matcher all
conditions must hold (AND); a role's list of matchers is OR'd together.

```yaml
- type: Button                 # exact type
- type: [Sheet.Portal, Sheet.Overlay]   # any of these types
  props:
    variant: danger            # prop equals a scalar
    size: [sm, md]             # prop is one of a list
    loading: true              # boolean coercion: Boolean(prop) === true
    icon: "*"                  # prop is present (any value)
    label: { present: false }  # prop is absent
    variant: { not: [secondary, ghost, danger] }  # prop is none of these (absent counts as "not")
```

The `not` predicate is what lets a role mean "primary by default": a component
that never writes `variant="primary"` explicitly, relying on the component
default, still matches `variant: { not: [secondary, ghost, danger] }`.

## Scope

`scope` decides the set of nodes a rule iterates over.

- omitted, `document`, or `{ document: true }`: the whole tree, as one scope.
- `{ role: <role> }`: one scope per node holding that role (e.g. per `section`).
- `{ type: <type> }` or `{ type: [<type>...] }`: one scope per node of that type.

Scoped shapes evaluate their condition independently inside each scope's subtree.

## Rule shapes

Eight shapes cover the compositional constraints a design system expresses.
`role` names in `params` refer to roles defined in the grammar.

### cardinality
Counts nodes with `params.role` inside each scope subtree and compares against
`exactly`, `atLeast`, and/or `atMost`. Fires once per scope that fails.
```yaml
shape: cardinality
scope: { role: section }
params: { role: primary-action, atMost: 1 }
```

### uniqueness
Within each scope, collects `params.by` prop values from nodes holding
`params.role`; fires on the second and later node sharing a value. Nodes whose
`by` prop is absent are skipped (absence is not a collision).
```yaml
params: { role: field, by: label }
```

### accompaniment
If a scope's subtree contains any node with `params.role` but no node with
`params.requires`, fires once on the scope. ("A danger action requires a
confirmation surface on the same screen.")
```yaml
params: { role: danger-action, requires: modal }
```

### containment
Fires on each node with `params.role` that has no ancestor holding
`params.inside`. ("A Sheet.Content must live inside a Sheet.")
```yaml
params: { role: sheet-part, inside: modal }
```

### exclusion
Fires on each node with `params.role` that *does* have an ancestor holding
`params.notInside`. ("A navigational element must not appear inside a modal.")
```yaml
params: { role: navigation, notInside: modal }
```

### dependency
Fires on each node with `params.role` that has no ancestor holding
`params.requiresAncestor`.
```yaml
params: { role: menu-item, requiresAncestor: menu }
```

### mutual-exclusion
Within each scope, fires once if *every* role in `params.roles` is present in the
subtree at the same time. ("A Button must not carry both `loading` and
`disabled`" is modeled as two roles that must not co-occur.)
```yaml
params: { roles: [loading-button, disabled-button] }
```

### ordering
Within each scope, collects nodes holding any role in `params.order`, in document
order, and fires once if they do not appear in the listed order.
```yaml
params: { order: [secondary-action, primary-action] }
```

## CLI

```
rulveo check <grammar.yaml> <files...>   # .tsx/.jsx source or .json DOM snapshot
rulveo infer <grammar.yaml> <files...>   # propose candidate rules from role usage
```

`check` prints `file:line ruleId message` per violation and a count to stderr.
Exit code: `0` clean, `1` violations found, `2` bad invocation. The non-zero exit
on violations is what makes `rulveo check` usable as a CI gate (see
`.github/workflows/ci.yml`).

## Inference

`rulveo infer` observes how roles actually co-occur across the input files and
proposes candidate rules (e.g. a role that is always contained in another
suggests a `containment` rule) above support/confidence thresholds. It is a
drafting aid, not an authority: proposals are printed for a human to accept into
the grammar, never applied automatically.

## Limitations

Rulveo is a **structural** checker over a static tree. It sees declarative JSX
elements and their literal props. It does not see:

- **Imperative UI.** A confirmation opened from a callback (`sheet.show(...)`) or
  navigation performed in an `onPress` handler is invisible; rules like
  `accompaniment` and `exclusion` are only as strong as the app's use of
  declarative elements. See `DOGFOOD.md` for a worked example where this produces
  a precise, honestly-labeled true positive.
- **Runtime prop values.** Props whose values come from expressions are recorded
  as present with an opaque value; shapes that test presence still work, shapes
  that test a specific value may not.
- **Control flow.** Conditionally rendered branches are counted as if all were
  present, so a document-scoped cardinality rule can over-count screens that
  render mutually exclusive elements. Prefer tighter scopes (per section) where
  this matters.

These boundaries are the point of a structural checker, not a defect: it verifies
exactly the part of a design system that lives in the component tree.
