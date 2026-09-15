# Design-Language Conformance: A Formal Model for Verifying Generated User Interfaces

*Position paper — draft outline v0.1*

---

## Abstract (draft)

AI agents are becoming the dominant authors of user-interface code. Organisations govern the appearance and behaviour of their products through design systems, but these systems are expressed as documentation, component libraries and design files — artefacts intended for human interpretation. There is no formal notion of what it means for a piece of UI to *conform* to a design system, and therefore no way to check conformance automatically at the rate agents produce interfaces. We define the **design-language conformance problem**, give a formal model in which a design language is a set of primitives together with constraints over interface trees, characterise which classes of constraint are statically decidable, dynamically checkable, or not formalisable, and propose a specification language, a reference checker and a benchmark. We argue that conformance checking is the missing verification layer between generative UI tooling and production software.

---

## 1. Problem statement

**Claim.** Design systems today encode *what exists* (tokens, components, variants) but not *how things may be composed* or *when they should be used*. Human reviewers supply the missing judgement. Generative agents remove the human from the authoring loop but not from the review loop, producing a verification bottleneck.

**The problem.** Given a design language *L* and an interface *U*, decide whether *U* conforms to *L*, and if not, produce a structured explanation sufficient for an agent to repair *U*.

**Why it is a computer-science problem and not a tooling problem.**
- It has a specification (*L*), an artefact (*U*) and a decision procedure — the shape of a verification problem.
- Most design-system rules are constraints over a labelled tree, which places conformance in the territory of type systems, schema validation and tree automata rather than heuristics.
- The parts that are *not* tree constraints (visual rhythm, emphasis, "feel") mark a genuine boundary between the formalisable and the aesthetic, and locating that boundary precisely is itself a contribution.

**Failure mode being addressed.** Not visibly broken UI, but *silent divergence*: many individually plausible decisions (a raw colour, a hand-rolled input, a modal where the pattern specifies a sheet, two primary actions in one decision region) that compound into a product that no longer reads as one product. Design debt at machine speed.

**Non-goals.** Generating UI; judging aesthetic quality; replacing design review. The aim is to make the *mechanical* portion of design review executable so human review can concentrate on intent.

---

## 2. Related work and why it is insufficient

| Area | What it provides | What it lacks |
|---|---|---|
| Design tokens (DTCG) | Standard value representation | No composition or usage semantics |
| Component libraries / Storybook | Typed component APIs, stories | API syntax, not design meaning |
| Figma variables, Code Connect, MCP | Design-to-code mapping | Advisory; no conformance decision |
| Linting (ESLint, Stylelint, custom rules) | Local syntactic checks | No model of the design language; rules are ad hoc |
| Accessibility standards (WCAG, axe) | Formal, checkable rules over UI | Universal, not organisation-specific |
| Visual regression testing | Detects change | Cannot say whether change is *correct* |
| Type systems, schema languages (XSD, RELAX NG), tree automata | Decision procedures over trees | Not applied to design languages |
| Policy engines (OPA/Rego, Cedar) | Declarative constraint evaluation | No UI domain model |

**Positioning sentence.** Accessibility shows that constraints over interfaces can be formalised and checked; design systems are the organisation-specific analogue, and nobody has given them the same treatment.

---

## 3. The formal model

### 3.1 Interfaces as trees

An interface *U* is a finite ordered tree. Each node *n* has:
- a **kind** κ(*n*) ∈ *K* (a component identifier or a native element),
- a **property map** π(*n*) : Prop → Value,
- a **region label** ρ(*n*) ∈ *R* ∪ {⊥} (e.g. `decision-region`, `navigation`, `form`),
- an optional **platform** context inherited from the root, *p* ∈ *P* = {web, ios, android, …}.

This abstracts over React trees, SwiftUI hierarchies, Figma node trees and rendered DOMs — the same model is used at design time, source time and render time.

### 3.2 A design language

A design language is a tuple

  *L* = ⟨*T*, *C*, *Σ*, *Φ*, *ν*⟩

- ***T*** — **tokens**: a set of named values with types (colour, dimension, typography, …). Values outside *T* are *raw*.
- ***C*** — **components**: each *c* ∈ *C* has a property schema, a set of admissible variants, a status ∈ {stable, experimental, deprecated, forbidden}, and a set of **bindings** to concrete implementations (Figma node, code export, story). Native elements are a distinguished subset *C*₀ ⊂ *C*, each with a designated replacement.
- ***Σ*** — **semantics**: a set of named *roles* (e.g. `primary-action`, `destructive-trigger`, `confirmation`) and a role assignment function on (component, variant) pairs. Roles are what constraints are written against, decoupling rules from component names.
- ***Φ*** — **constraints**: a set of predicates over trees (§3.3).
- ***ν*** — **versioning**: a partial order on language versions with explicit deprecation and migration edges.

### 3.3 Constraint classes

Constraints φ ∈ *Φ* are predicates over (*U*, *p*). We classify by what information the check requires. This taxonomy is the core contribution: it determines what can be enforced, and how.

**Class V — Value constraints.** Every property value drawn from a typed domain must resolve to a token in *T*. *Statically decidable* by local inspection.

**Class K — Kind constraints.** Node kinds must be in *C* with status ≠ forbidden; deprecated kinds emit warnings with migration targets; native elements in *C*₀ are rejected in favour of their replacement. *Statically decidable, local.*

**Class P — Property constraints.** Property maps must satisfy the component's schema, including cross-property constraints (e.g. `variant=destructive ⇒ requiresConfirmation`). *Statically decidable, local.*

**Class S — Structural constraints.** Constraints over ancestry, siblings and regions:
- *Cardinality*: at most *k* nodes of role *r* within any region of type *g*.
- *Containment*: nodes of kind *c* may (or may not) appear within ancestors of kind *c′*.
- *Accompaniment*: a node of role *r* requires a node of role *r′* within scope *s* (e.g. destructive trigger requires confirmation and consequence explanation).
- *Ordering*: within a region, roles must appear in a given partial order.
- *Focus and default*: no node of role `destructive-trigger` may be the default-focused element.

These are expressible as tree-automaton or XPath-style constraints; conformance is *decidable in polynomial time* in the size of *U*.

**Class Π — Platform-conditional substitution.** A pattern may specify different realisations per platform (`confirmation: web → Dialog, mobile → BottomSheet`). Modelled as a substitution function *σ* : Role × *P* → *C*; checking reduces to Class S after substitution. *Statically decidable given p.*

**Class Ρ — Responsive transformation.** Rules of the form "table at ≥ breakpoint *b*, card-list below". These are constraints over a *family* of trees indexed by viewport. *Statically decidable when the source encodes breakpoint branches; otherwise requires rendering.*

**Class D — Dynamic constraints.** Properties observable only after rendering: computed contrast, actual spacing after layout, reflow, focus order at runtime. *Checkable by execution*, not by static analysis. This is where accessibility tooling already lives.

**Class I — Intent constraints.** "This page should feel calm because the user is making a high-risk decision." Not reducible to tree predicates. We claim these are *not formalisable* in the model and should be handled by (a) decomposition into proxy constraints in classes S/D where possible, and (b) human review otherwise. Making this boundary explicit is a deliberate feature of the model.

### 3.4 Conformance

*U* **conforms** to *L* on platform *p*, written *U* ⊨ₚ *L*, iff every φ ∈ *Φ* of class V, K, P, S, Π, Ρ holds of (*U*, *p*). Dynamic conformance extends this with class D after rendering. Intent is excluded by definition.

Conformance is **compositional** for classes V, K, P: a tree conforms iff each node does. It is **not compositional** for S, Π, Ρ — a subtree that conforms in isolation may violate cardinality or accompaniment when placed in context. This non-compositionality is precisely why agents composing individually correct components produce non-conforming interfaces, and why per-component linting is insufficient.

### 3.5 Violations as repair instructions

A checker returns not a boolean but a set of violations, each of the form

  ⟨rule, class, location, observed, expected, candidate repairs⟩

with the requirement that candidate repairs, when applied, are guaranteed to remove the violation for classes V, K and P, and *may* introduce new violations for class S. This makes the checker a suitable oracle for an automated repair loop and gives a termination argument for the loop in the local classes.

### 3.6 Patterns

A **pattern** is a named, versioned bundle: a set of roles, a structural template over those roles, a set of constraints, and per-platform substitutions. Patterns are the unit at which design intent that *can* be formalised is captured (`destructive-action`, `settings-page`, `empty-state`). Formally a pattern is a sub-language *L*′ ⊆ *L* with a trigger predicate that says when it applies. This lets the checker ask, for a given subtree, "which patterns apply here, and does the subtree satisfy them?"

---

## 4. Theoretical claims to establish

1. **Decidability hierarchy.** Classes V–Ρ are decidable; V, K, P in linear time; S, Π in polynomial time. (Proof sketch via translation to tree automata / Datalog over the tree relation.)
2. **Non-compositionality result.** Show a minimal *L* and trees *U*₁, *U*₂ that each conform but whose composition does not. Argue this explains the empirically observed gap between component-level correctness and interface-level conformance in agent output.
3. **Repair soundness for local classes.** For violations in V, K, P, the suggested repair yields a conforming node.
4. **Expressiveness bound.** Characterise a natural class of design rules that cannot be expressed as constraints over a single tree (cross-screen consistency, temporal flows) and identify what extension would be needed (a graph of trees with navigation edges).
5. **Empirical claim.** Survey design-system documentation from *N* public systems and classify each rule into the taxonomy; hypothesis: the large majority of stated rules fall into V–Π, and existing tooling covers only V and K.

Claim 5 is the paper's most persuasive figure if it holds: it shows that most of what design systems ask for is mechanically checkable and simply isn't being checked.

---

## 5. A specification language (sketch)

Design goals: authored by humans, generated by tools, diffable, versioned. Must reference DTCG tokens rather than redefine them.

```yaml
language: acme-ui
version: 2.4

roles:
  primary-action:     { components: [Button.primary] }
  destructive-trigger: { components: [Button.destructive] }
  confirmation:       { components: [ConfirmDialog, BottomSheet.confirm] }

constraints:
  - id: one-primary-per-region
    class: structural
    rule: cardinality
    role: primary-action
    scope: decision-region
    max: 1

  - id: destructive-requires-confirmation
    class: structural
    rule: accompaniment
    role: destructive-trigger
    requires: [confirmation, consequence-explanation]
    scope: pattern

  - id: no-native-button
    class: kind
    forbid: html.button
    replace: Button

patterns:
  destructive-action:
    version: 1.3
    trigger: { role: destructive-trigger }
    roles: [consequence-explanation, destructive-trigger, confirmation]
    order: [consequence-explanation, destructive-trigger]
    platform:
      web:    { confirmation: ConfirmDialog }
      mobile: { confirmation: BottomSheet.confirm }
    constraints: [destructive-requires-confirmation, destructive-not-default-focus]
```

Open questions for the language: whether constraints should be a closed vocabulary (safer, checkable) or allow a general predicate language (more expressive, harder to guarantee decidability); how to express soft rules (`discouraged` vs `forbidden`); how to attach provenance and approval status so that inferred rules can be distinguished from authored ones.

---

## 6. Reference architecture

```
      Figma / Storybook / source / docs
                     │
                     ▼
            ┌────────────────┐
            │  Extraction    │  builds T, C, Σ, bindings; proposes Φ
            └───────┬────────┘
                    ▼
            ┌────────────────┐
            │  Language      │  versioned L; human approval of proposed rules
            │  registry      │
            └───────┬────────┘
                    ▼
   source ──► ┌────────────────┐ ◄── rendered DOM
              │  Conformance   │
              │  checker       │  static (V–Ρ) and dynamic (D) passes
              └───────┬────────┘
                      ▼
             violations + repairs ──► agent / CI / reviewer
```

Two points to argue: extraction should *infer* candidate constraints from existing artefacts and route them through approval, because authoring Φ by hand does not scale and is the historical reason design intent stayed tacit; and the checker must operate on the same tree model at design, source and render time so that drift between the three is itself a checkable property.

---

## 7. Benchmark proposal

Purpose: give the field a way to measure conformance of generative tools, and give the model an empirical test.

- **Languages.** A set of open design systems (real: e.g. GOV.UK, Carbon, Atlassian, Shopify Polaris; plus synthetic ones with controlled constraint sets) formalised in the specification language.
- **Tasks.** UI-authoring tasks with known pattern requirements (settings page, destructive deletion, empty state, data table with responsive collapse, onboarding flow).
- **Ground truth.** Expert-labelled conformance for a held-out corpus, used to validate the checker's precision/recall before it is used to score agents.
- **Metrics.** Conformance rate per constraint class (V, K, P, S, Π, Ρ, D); repair success rate after *k* rounds; false-positive rate against human judgement. Intent (class I) is explicitly reported as *not measured*.
- **Deliverable.** Public leaderboard plus the corpus. The class-level breakdown is the point: it shows *where* agents fail, not just whether.

---

## 8. Contributions (as stated in the paper)

1. A definition of the design-language conformance problem.
2. A formal model of design languages as constraints over interface trees, with a constraint taxonomy that separates the statically decidable, the dynamically checkable and the non-formalisable.
3. A non-compositionality result explaining why component-level correctness does not yield interface-level conformance.
4. An open specification language and reference checker.
5. A benchmark and an empirical classification of rules from public design systems.

---

## 9. Open problems (to invite the field in)

- Cross-screen and temporal constraints (flows, consistency across navigation).
- Learning Φ from examples with guarantees on precision.
- Soft constraints and preference orderings between conforming alternatives.
- Relationship between conformance and perceived quality — does higher class-S conformance predict expert ratings?
- Governance semantics: who may change *L*, and how agent-proposed changes to the language itself are reviewed.

---

## 10. Suggested venues and sequencing

- **Position / vision paper** (this outline): UIST or CHI for the HCI community; alternatively the "Ideas, Visions and Reflections" track at FSE for the verification framing.
- **Full paper**: the model plus the empirical classification (§4 claim 5) and checker evaluation.
- **Benchmark paper**: once the corpus and leaderboard exist.
- **Specification**: published in parallel as an open repository with a governance document, seeded with design partners and one existing standards community (DTCG is the natural neighbour).

---

## Appendix A — Worked example

A generated account-deletion screen containing: a heading, a paragraph, a `<button>` labelled "Delete account" styled with `#B42318`, immediately performing deletion on click.

Violations returned:

| Rule | Class | Observed | Expected | Repair |
|---|---|---|---|---|
| no-native-button | K | `html.button` | `Button` | replace kind |
| raw-colour | V | `#B42318` | `color.action.destructive` | substitute token |
| destructive-requires-confirmation | S | no `confirmation` in scope | `ConfirmDialog` (web) | insert pattern node |
| consequence-before-trigger | S | none | `consequence-explanation` preceding trigger | insert role |
| destructive-not-default-focus | S | trigger autofocused | not focused | remove autofocus |

Note that the first two are compositional and repairable locally; the remaining three are structural and only visible in context — the example demonstrates §3.4 in one screen.
