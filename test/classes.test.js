import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRule, runInline } from './helpers.js';

test('Class V token-value: raw colour flagged, token accepted', () => {
  assert.equal(checkRule('<Box color="#B42318"/>', 'primer-color-token').length, 1);
  assert.equal(checkRule('<Box color="color.action.primary"/>', 'primer-color-token').length, 0);
});

test('Class V token-value: numeric set reports the nearest token', () => {
  const grammar = { tokens: { spacing: [0, 4, 8, 12, 16, 24] }, components: {} };
  const rule = { id: 'sp', shape: 'token-value', params: { props: ['gap'], tokenSet: 'spacing' } };
  const found = runInline('<Box gap={13}/>', { box: [{ type: 'Box' }] }, rule, grammar);
  assert.equal(found.length, 1);
  assert.equal(found[0].expected, 12);
});

test('Class V token-value: no set falls back to a raw-value heuristic', () => {
  const rule = { id: 'raw', shape: 'token-value', params: { props: ['padding'] } };
  assert.equal(runInline('<Box padding="10px"/>', { box: [{ type: 'Box' }] }, rule).length, 1);
  assert.equal(runInline('<Box padding="space.2"/>', { box: [{ type: 'Box' }] }, rule).length, 0);
});

test('Class K forbidden-kind: native element flagged with replacement', () => {
  const found = checkRule('<button>Go</button>', 'primer-no-native-button');
  assert.equal(found.length, 1);
  assert.equal(found[0].expected, 'Button');
});

test('Class K forbidden-kind: deprecated component is a warning with a migration target', () => {
  const found = checkRule('<LegacyButton/>', 'primer-no-native-button');
  assert.equal(found.length, 1);
  assert.equal(found[0].severity, 'warning');
  assert.equal(found[0].expected, 'Button');
});

test('Class K forbidden-kind: forbidden-status component is an error', () => {
  const found = checkRule('<Blink/>', 'primer-no-native-button');
  assert.equal(found.length, 1);
  assert.equal(found[0].severity, 'error');
});

test('Class P property-schema: variant outside the schema is flagged', () => {
  assert.equal(checkRule('<Button variant="frobnicate" label="x"/>', 'primer-button-variant-schema').length, 1);
  assert.equal(checkRule('<Button variant="primary" label="x"/>', 'primer-button-variant-schema').length, 0);
  assert.equal(checkRule('<Button variant="primary" size="xl" label="x"/>', 'primer-button-variant-schema').length, 1);
});

test('Class P conditional-prop: danger requires requiresConfirmation', () => {
  assert.equal(checkRule('<Button variant="danger" label="Del"/>', 'primer-danger-requires-confirm-prop').length, 1);
  assert.equal(
    checkRule('<Button variant="danger" requiresConfirmation label="Del"/>', 'primer-danger-requires-confirm-prop').length,
    0
  );
});
