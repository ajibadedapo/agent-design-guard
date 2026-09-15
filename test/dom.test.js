import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseDomJson } from '../src/adapters/dom.js';
import { checkSnapshot, checkFile } from '../src/engine.js';
import { grammar, root } from './helpers.js';

test('dom adapter converts a snapshot into the internal tree model', () => {
  const tree = parseDomJson('{"role":"dialog","children":[{"role":"link","name":"Home"}]}');
  assert.equal(tree.type, '#document');
  assert.equal(tree.children[0].type, 'dialog');
  assert.equal(tree.children[0].props.role, 'dialog');
  assert.equal(tree.children[0].children[0].type, 'link');
  assert.equal(tree.children[0].children[0].props.name, 'Home');
});

test('a grammar catches a structural violation in a DOM tree', () => {
  const snapshot = JSON.parse(
    fs.readFileSync(path.join(root, 'fixtures', 'dom-tree.json'), 'utf8')
  );
  const violations = checkSnapshot(grammar, snapshot, 'dom-tree.json');
  const nav = violations.filter((v) => v.ruleId === 'primer-no-nav-in-modal');
  assert.equal(nav.length, 1);
});

test('checkFile routes .json through the DOM adapter', () => {
  const bad = checkFile(grammar, path.join(root, 'fixtures', 'dom-tree.json'));
  assert.ok(bad.some((v) => v.ruleId === 'primer-no-nav-in-modal'));
  const clean = checkFile(grammar, path.join(root, 'fixtures', 'dom-clean.json'));
  assert.equal(clean.filter((v) => v.ruleId === 'primer-no-nav-in-modal').length, 0);
});
