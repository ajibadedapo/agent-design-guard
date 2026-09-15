import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildTree } from '../src/engine.js';
import { inferProposals, formatProposals } from '../src/infer.js';
import { grammar, root } from './helpers.js';

function rootsFor(...files) {
  return files.map((f) => buildTree(fs.readFileSync(f, 'utf8'), grammar));
}

test('infer proposes exactly-one primary-action per region from a fixture', () => {
  const roots = rootsFor(path.join(root, 'fixtures', 'infer.tsx'));
  const proposals = inferProposals(roots, grammar);
  const match = proposals.find(
    (p) =>
      p.shape === 'cardinality' &&
      p.scope &&
      p.scope.role === 'region' &&
      p.params.role === 'primary-action' &&
      p.params.exactly === 1
  );
  assert.ok(match, 'expected a cardinality proposal for one primary-action per region');
  assert.equal(match.support, 3);
  assert.equal(match.confidence, 1);
});

test('infer output is a readable proposed-rules list and applies nothing', () => {
  const roots = rootsFor(path.join(root, 'fixtures', 'infer.tsx'));
  const proposals = inferProposals(roots, grammar);
  const text = formatProposals(proposals);
  assert.match(text, /^proposed rules \(\d+\):/);
  assert.match(text, /\[cardinality\]/);
  assert.equal(grammar.rules.length, 9);
});
