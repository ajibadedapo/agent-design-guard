# Three quarters of your design system is machine-checkable. Ten percent is checked.

*Hammed Ajibade · September 2026*

Every design system I have worked with had the same shape. A token file nobody argued about, a component library everybody used, and a documentation site full of sentences like *"only one primary button per page"*, *"destructive actions require a confirmation"*, *"never put a data table inside a modal"*. The tokens were enforced by tooling. The components were enforced by the fact that they were the only thing in the repo. The sentences were enforced by a designer noticing in review.

That third mechanism is about to stop working. AI agents are becoming the majority author of frontend code, and they produce interfaces faster than any review process can read them. Each individual decision an agent makes is plausible — a hand-rolled input here, a second primary action there, a modal where the pattern says sheet — and none of them looks wrong in isolation. They compound. The result is not broken UI. It is a product that slowly stops looking like one product. Design debt at machine speed.

So I wanted to know: how much of what design systems ask for could a machine actually check, if someone built the machine?

## What I did

I took five public design systems — GitHub's Primer, IBM's Carbon, Shopify's Polaris, Adobe's Spectrum and the GOV.UK Design System — and pulled every rule from their button, dialog and destructive-action documentation. A rule is any sentence phrased as *should, must, never, only, avoid* or *prefer*. That gave 212 rules.

Then I classified each one by what it would take to check it:

- **Value** — a property must resolve to a token (spacing, colour, size)
- **Kind** — a component is allowed, forbidden or deprecated
- **Property** — a component's props satisfy its schema
- **Structural** — cardinality, containment, accompaniment, ordering over the interface tree
- **Platform / Responsive** — conditional on platform or viewport
- **Dynamic** — only observable at runtime: focus, contrast, layout result
- **Intent** — purpose, taste, reversibility; not formalisable

And for each rule: does any existing tool check it today?

## What came out

| | Rules | Share |
|---|---|---|
| Checkable statically | 132 | 62% |
| Checkable at runtime | 32 | 15% |
| **Checkable at all** | **164** | **77%** |
| Genuine intent | 48 | 23% |
| Checked today by any tool | 22 | 10% |

Three quarters of the rules are decidable by a machine. One in ten of those is currently decided by one.

The largest class was not tokens. It was **structural — 32% of everything**. How many primaries in a region. What a danger button must be accompanied by. What may not sit inside a modal. In what order the footer buttons go. Of the 68 structural rules, existing tooling covers three, and all three are accidents — an accessibility checker catching a missing label rather than the design rule itself.

That is the gap. Tokens and kinds, the whole territory of today's design-system linting, were 11% of the rules.

## Why linters can't reach it

Structural rules are not compositional. A component that conforms in isolation can violate the rule when placed in context. Two screens that each have exactly one primary button are both correct; merge them and you have two. A linter that looks at one node at a time is *correct* to pass both — it simply cannot see the rule. This is precisely the failure mode of agents composing individually correct components into non-conforming interfaces, and it is why the answer is not a better linter. It is something that checks the tree.

## Eight shapes

The encouraging finding is how few distinct shapes the structural rules take. Across all five systems, nearly every one is:

```
cardinality(role, scope, max)          one primary per page / dialog / group
accompaniment(role, requires, scope)   danger trigger requires confirmation
ordering(roles, container)             cancel left, primary right
containment(kind, forbidden-inside)    no data table inside a modal
sibling-consistency(property, group)   same size; icons on all or none
allowed-combination(variants, group)   Carbon's permitted button-pair tables
literal-list(property, allow | deny)   labels never "Yes", "OK", "Confirm"
conditional(contains ⇒ property)       dialog with an input ⇒ full-screen on mobile
```

Eight shapes. The systems disagree on *values* — Carbon puts icons right of the label, Polaris left; Carbon forbids nested modals, Primer allows two — but they agree on the *grammar*. That is the argument for a language with parameters rather than a tool with defaults.

## What "intent" turned out to be

I expected the 23% that couldn't be formalised to be taste. Mostly it wasn't. Half of it was conditional on something the UI does not know: *"no confirmation for reversible actions"*, *"type-to-confirm only for wide blast radius"*, *"warning style only for what cannot be undone"*. Those are structural rules waiting for one piece of data — whether the underlying action is reversible. Annotate that, and they move columns. The rest was content grammar ({verb}+{noun}), purpose-based substitution, and thresholds the documentation left vague ("sparingly", "too many"). Actual aesthetic judgement was a sliver.

The taste problem is real. It is just much smaller than the verification problem sitting in front of it.

## UI Grammar

I have started building the checker, and I'm calling the language **UI Grammar**. A grammar is a YAML file: roles (so rules survive component renames), scopes (what "page" and "dialog" mean in your codebase), and rules in the eight shapes. The checker walks the interface tree and returns structured violations — rule, location, expected, and a repair — so an agent can consume them and fix its own work. The first adapter is JSX/TSX; Figma and DOM are next, so the same grammar can check design, source and render and treat drift between them as a violation.

It is pre-alpha and I would rather show it than describe it. The repo, the 212-rule classification and the position paper are linked below.

## Caveats, honestly

This is one rater, one pass, four pages per system. Spectrum's site only renders with JavaScript and Polaris has moved its usage guidance off the live docs, so both are under-sampled. Treat the shares as ±10 points until a second rater has been through the sheet. If you run design systems and want to be that rater — or want to see what your own documentation looks like through this taxonomy — I would like to hear from you.

The number I'm confident in is the direction, not the decimal: most of what design systems ask for can be enforced, almost none of it is, and the part that matters most is the part nobody's tooling looks at.

---

*Classification workbook, position paper and the UI Grammar repo: [links]*
