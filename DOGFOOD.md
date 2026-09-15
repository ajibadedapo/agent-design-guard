# Dogfood: rulveo on the ServicePilot app

This is the "point the checker at a real app" report. The target is ServicePilot,
a React Native app built on a HeroUI Native + Uniwind `src/ui` kit. Its design
rules are written in the app's own `CLAUDE.md`:

- Colours only via theme tokens: no hex/rgb literals.
- One `Button variant="primary"` per screen section.
- Destructive actions use `variant="danger"` plus a confirmation `<Sheet>` stating the consequence.
- All modals are `<Sheet>` (never react-native `Modal` or a custom overlay).
- Touch targets are the `src/ui` `Pressable` (>= 44pt).

`grammars/heroui.yaml` encodes those rules in the new schema: a `tokens` set, a
`components` schema for `Button`, a `parameters` block, roles matched against the
app's real components, and nine `constraints` spanning four constraint classes
(V value, K kind, P property, S structural).

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

(`<servicepilot>` is `products/servicepilot/` in the specvista monorepo.
Platform defaults to `web`; no ServicePilot pattern is platform-conditional so
the choice is inert here.)

All 21 screen files parsed with no adapter errors. Role assignment across the 21
screens: 29 `Button`, 24 `primary-action`, 3 `secondary-action`, 2
`danger-action`, 55 `Pressable` (`touch-target`), 5 `Sheet` (`modal`), 15 Sheet
parts, 8 sections (Card or Sheet.Content), 36 `Field`, and 0 navigational
elements.

## Result: 4 violations found

```
auth/VerifyEmailScreen.tsx:110       [error] heroui-button-loading-xor-disabled  A Button should not declare both loading and disabled at once.
profile/AccountSettingsScreen.tsx:149 [error] heroui-danger-needs-confirmation    A destructive (variant=danger) action must be accompanied by a confirmation Sheet on the same screen.
requests/NewRequestScreen.tsx:235    [error] heroui-button-loading-xor-disabled  A Button should not declare both loading and disabled at once.
stays/CreateListingScreen.tsx:192    [error] heroui-button-loading-xor-disabled  A Button should not declare both loading and disabled at once.
```

### allowed-combination (deny): loading and disabled on the same Button (3 real hits)

`VerifyEmailScreen:110`, `NewRequestScreen:235`, and `CreateListingScreen:192`
each render a Button with both a `loading` and a `disabled` prop, for example:

```tsx
<Button title="Verify email" loading={loading} disabled={otp.length < 6} />
```

This is a genuine finding against the app's own component contract. ServicePilot's
`ui/Button` already computes `isDisabled = disabled || loading`, so passing both
is redundant and ambiguous (the two flags can disagree). The check is structural:
it flags the co-occurrence of the two state roles, not their runtime values. In
the new schema this is the `allowed-combination` shape with a `deny` set (the
canonical replacement for the old `mutual-exclusion` alias).

### accompaniment: danger action with no confirmation Sheet on the screen (1 real hit)

`AccountSettingsScreen:149` has the delete-account `Button variant="danger"` but
no `<Sheet>` anywhere in its JSX. The violation is now anchored to the danger
Button's own line (the accompaniment subject), which is more actionable than the
document root.

The honest reason it fires is worth stating: the app confirms destructive actions
imperatively through the `useSheet()` hook (`sheet.show({ kind: "confirm",
destructive: true, ... })`), not by rendering a `<Sheet>` element. A structural
checker over the JSX tree cannot see a Sheet that is opened from a callback, so
from the tree's point of view the confirmation is missing. This is both a true
positive (there is no declarative confirmation to verify) and a precise map of the
checker's boundary: imperative UI is invisible to static analysis (class D, out
of scope).

## Clean passes (rules that ran and found nothing)

- `heroui-color-token` (Class V, token-value): no screen carries a raw hex/rgb
  literal in a `color`/`backgroundColor` prop. (Inline `style={{...}}` objects are
  opaque expressions to the adapter and are not inspected; ServicePilot's colours
  flow through theme classes, not literal props, so there is nothing to flag.)
- `heroui-no-native-modal` (Class K, forbidden-kind): no react-native `Modal` and
  no raw anchor in the tree.
- `heroui-button-variant-schema` (Class P, property-schema): every `Button`
  `variant` (danger, ghost, secondary, and the implicit primary default) and
  `size` (sm, lg) is within the declared schema.
- `heroui-one-primary-per-section` (Class S, cardinality, at most one primary per
  Card or Sheet): 8 sections checked, all conform.
- `heroui-sheet-part-inside-sheet` (Class S, containment `inside`): all 15
  Sheet.Portal / Sheet.Overlay / Sheet.Content nodes are correctly nested inside a
  `<Sheet>`. The app follows the HeroUI composition faithfully.
- `heroui-field-labels-unique-per-section` (Class S, uniqueness): no section
  repeats a Field label.
- `heroui-no-navigation-in-modal` (Class S, containment `forbiddenInside`): 0
  violations, but this is a vacuous pass. ServicePilot navigates imperatively
  (`navigation.navigate(...)` inside `onPress`), with no `<Link>` or anchor
  elements, so there is nothing navigational in the tree for the rule to catch.
  Recorded here so the pass is not mistaken for evidence that a modal could never
  trap navigation.

## What the dogfood taught the checker

The false positive that surfaced on an earlier run was fixed rather than tuned
away: `uniqueness` treated an absent `by` prop as the value `null`, so two
`Field`s that use `placeholder` and no `label` collided. The shape now compares
only present values (`src/rules.js`), with a regression test in
`test/matchers.test.js`. A second real-app need drove the `not` matcher predicate
(`src/roles.js`): ServicePilot never writes `variant="primary"` explicitly (it
relies on the component default), so `primary-action` has to mean "a Button whose
variant is not secondary, ghost, or danger, including absent", which the `not`
predicate expresses.

## Honest limitations

- Imperative UI (confirmations via `useSheet`, navigation via `navigation.navigate`)
  is outside a structural JSX checker's reach. The danger-confirmation and
  no-navigation rules are only as strong as the app's use of declarative elements.
- Static analysis counts conditionally rendered branches as if all were present.
  The per-section cardinality rule stays clean here because sections are Cards and
  Sheets rather than sibling conditional blocks, but a document-scoped "one
  primary per screen" rule would over-count screens like RequestDetail that render
  many mutually exclusive primary Buttons.
- Colour-token coverage is partial: raw literals passed through inline `style`
  objects are opaque to the static adapter, so class V here catches only literal
  string props. Full colour conformance is a class-D (rendered) check.
