import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { checkRule, runInline, grammar, root } from './helpers.js';
import { checkFiles } from '../src/engine.js';
import { loadGrammar } from '../src/grammar.js';

test('cross-region-equality: title-bar primary must match page-actions primary', () => {
  const bad = `<><TitleBar><Button variant="primary" label="Save"/></TitleBar><PageActions><Button variant="primary" label="Publish"/></PageActions></>`;
  const good = `<><TitleBar><Button variant="primary" label="Save"/></TitleBar><PageActions><Button variant="primary" label="Save"/></PageActions></>`;
  assert.equal(checkRule(bad, 'primer-title-matches-page-primary').length, 1);
  assert.equal(checkRule(good, 'primer-title-matches-page-primary').length, 0);
});

test('when guard: accompaniment only fires for irreversible actions', () => {
  const irreversible = `<ButtonGroup><Button variant="danger" reversible={false} label="Delete"/></ButtonGroup>`;
  const reversible = `<ButtonGroup><Button variant="danger" reversible={true} label="Delete"/></ButtonGroup>`;
  const unspecified = `<ButtonGroup><Button variant="danger" label="Delete"/></ButtonGroup>`;
  assert.equal(checkRule(irreversible, 'primer-irreversible-needs-confirmation').length, 1);
  assert.equal(checkRule(reversible, 'primer-irreversible-needs-confirmation').length, 0);
  assert.equal(checkRule(unspecified, 'primer-irreversible-needs-confirmation').length, 0);
});

test('parameters: numeric thresholds resolve from the parameters section', () => {
  const rule = grammar.rules.find((r) => r.id === 'primer-one-primary-per-region');
  assert.equal(rule.params.max, 1);
});

test('responsive: emits a requires-render note when no breakpoint branch is encoded', () => {
  const roles = { table: [{ type: 'Table' }] };
  const rule = { id: 'r', shape: 'responsive', params: { role: 'table' } };
  const withBranch = { id: 'r', shape: 'responsive', params: { role: 'table', breakpointProp: 'breakpoint' } };
  const notes = runInline('<Table/>', roles, rule);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].severity, 'note');
  assert.equal(runInline('<Table breakpoint="md"/>', roles, withBranch).length, 0);
});

test('platform substitution: wrong platform component flagged on web, clean on ios', () => {
  const file = path.join(root, 'fixtures', 'platform.tsx');
  const web = checkFiles(grammar, [file], 'web');
  const ios = checkFiles(grammar, [file], 'ios');
  assert.equal(web.filter((v) => v.shape === 'pattern').length, 1);
  assert.equal(ios.filter((v) => v.shape === 'pattern').length, 0);
});

test('primer grammar carries a class on every constraint', () => {
  const g = loadGrammar(path.join(root, 'grammars', 'primer.yaml'));
  for (const rule of g.rules) {
    assert.ok(rule.class, `rule ${rule.id} missing class`);
    assert.ok(rule.classId, `rule ${rule.id} missing classId`);
  }
});
