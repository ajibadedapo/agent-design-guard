# Dogfood: Rulveo on the ServicePilot app

This is the "point the checker at a real app" report. The target is ServicePilot,
a React Native app built on a HeroUI Native + Uniwind `src/ui` kit. Its design
rules are written in the app's own `CLAUDE.md`:

- One `Button variant="primary"` per screen section.
- Destructive actions use `variant="danger"` plus a confirmation Sheet stating the consequence.
- All modals are `<Sheet>` (never react-native Modal or a custom overlay).
- Touch targets are the `src/ui` `Pressable` (>= 44pt).

`grammars/heroui.yaml` encodes those rules as roles matched against the app's
real components (`Button` with its `variant`, `Sheet` and its `Sheet.Portal`/
`Sheet.Overlay`/`Sheet.Content` parts, `Pressable`, `Field`, `Card`) and rules
across six of the eight shapes.

## Command

```
node bin/rulveo.js check grammars/heroui.yaml \
  <servicepilot>/mobile/src/screens/auth/*.tsx \
  <servicepilot>/mobile/src/screens/chat/*.tsx \
  <servicepilot>/mobile/src/screens/home/*.tsx \
  <servicepilot>/mobile/src/screens/legal/*.tsx \
  <servicepilot>/mobile/src/screens/onboarding/*.tsx \
  <servicepilot>/mobile/src/screens/pilots/*.tsx \
  <servicepilot>/mobile/src/screens/profile/*.tsx \
  <servicepilot>/mobile/src/screens/requests/*.tsx \
  <servicepilot>/mobile/src/screens/services/*.tsx \
  <servicepilot>/mobile/src/screens/stays/*.tsx
```

(`<servicepilot>` is `products/servicepilot/` in the specvista monorepo.)

All 21 screen files parsed with no adapter errors. Role assignment across the 21
screens matched: 29 `Button`, 24 `primary-action`, 3 `secondary-action`, 2
`danger-action`, 55 `Pressable`, 5 `Sheet`, 15 Sheet parts, 8 sections (Card or
Sheet.Content), 37 `Field`, and 0 navigational elements.

## Result: 4 violations found

```
auth/VerifyEmailScreen.tsx:110    heroui-button-loading-xor-disabled  A Button should not declare both loading and disabled at once.
profile/AccountSettingsScreen.tsx:0  heroui-danger-needs-confirmation A destructive (variant=danger) action must be accompanied by a confirmation Sheet on the same screen.
requests/NewRequestScreen.tsx:235 heroui-button-loading-xor-disabled  A Button should not declare both loading and disabled at once.
stays/CreateListingScreen.tsx:192 heroui-button-loading-xor-disabled  A Button should not declare both loading and disabled at once.
```

### mutual-exclusion: loading and disabled on the same Button (3 real hits)

`VerifyEmailScreen:110`, `NewRequestScreen:235`, and `CreateListingScreen:192`
each render a Button with both a `loading` and a `disabled` prop, for example:

```tsx
<Button title="Verify email" loading={loading} disabled={otp.length < 6} />
```

This is a genuine finding against the app's own component contract. ServicePilot's
`ui/Button` already computes `isDisabled = disabled || loading`, so passing both
is redundant and ambiguous (the two flags can disagree). The check is structural:
it flags the co-occurrence of the two props, not their runtime values.

### accompaniment: danger action with no confirmation Sheet on the screen (1 real hit)

`AccountSettingsScreen` has the delete-account `Button variant="danger"` but no
`<Sheet>` anywhere in its JSX. The violation is reported at the document root
(line 0) because accompaniment is a whole-screen property.

The honest reason it fires is worth stating: the app confirms destructive actions
imperatively through the `useSheet()` hook (`sheet.show({ kind: "confirm",
destructive: true, ... })`), not by rendering a `<Sheet>` element. A structural
checker over the JSX tree cannot see a Sheet that is opened from a callback, so
from the tree's point of view the confirmation is missing. This is both a true
positive (there is no declarative confirmation to verify) and a precise map of the
checker's boundary: imperative UI is invisible to structural analysis.

## Clean passes (rules that ran and found nothing)

- `heroui-one-primary-per-section` (cardinality, at most one primary per Card or
  Sheet): 8 sections checked, all conform.
- `heroui-sheet-part-inside-sheet` (containment): all 15 Sheet.Portal /
  Sheet.Overlay / Sheet.Content nodes are correctly nested inside a `<Sheet>`.
  The app follows the HeroUI composition faithfully.
- `heroui-field-labels-unique-per-section` (uniqueness): no section repeats a
  Field label.
- `heroui-no-navigation-in-modal` (exclusion): 0 violations, but this is a
  vacuous pass. ServicePilot navigates imperatively (`navigation.navigate(...)`
  inside `onPress`), with no `<Link>` or anchor elements, so there is nothing
  navigational in the tree for the rule to catch. Recorded here so the pass is
  not mistaken for evidence that a modal could never trap navigation.

## What the dogfood taught the checker

The false positive that surfaced during this run was fixed rather than tuned
away: `uniqueness` originally treated an absent `by` prop as the value `null`, so
two `Field`s that use `placeholder` and no `label` collided. The shape now
compares only present values (`src/rules.js`), with a regression test in
`test/matchers.test.js`. A second real-app need drove the `not` and `present`
matcher predicates (`src/roles.js`): ServicePilot never writes
`variant="primary"` explicitly (it relies on the component default), so
`primary-action` has to mean "a Button whose variant is not secondary, ghost, or
danger, including absent", which the `not` predicate expresses.

## Honest limitations

- Imperative UI (confirmations via `useSheet`, navigation via `navigation.navigate`)
  is outside a structural JSX checker's reach. The danger-confirmation and
  no-navigation rules are only as strong as the app's use of declarative elements.
- Static analysis counts conditionally rendered branches as if all were present.
  The per-section cardinality rule stays clean here because sections are Cards and
  Sheets rather than sibling conditional blocks, but a document-scoped "one
  primary per screen" rule would over-count screens like RequestDetail that render
  many mutually exclusive primary Buttons.
