import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { checkFiles } from '../src/engine.js';
import { grammar, root } from './helpers.js';

test('good.tsx conforms with zero violations', () => {
  const violations = checkFiles(grammar, [path.join(root, 'fixtures', 'good.tsx')]);
  assert.equal(violations.length, 0);
});

test('bad.tsx yields exactly nine violations, one per rule', () => {
  const violations = checkFiles(grammar, [path.join(root, 'fixtures', 'bad.tsx')]);
  assert.equal(violations.length, 9);
  const triggered = new Set(violations.map((v) => v.ruleId));
  assert.equal(triggered.size, 9);
  assert.equal(triggered.size, grammar.rules.length);
});
