import fs from 'node:fs';
import path from 'node:path';
import { parseSource } from './adapter.js';
import { parseSnapshot, parseDomJson } from './adapters/dom.js';
import { assignRoles } from './roles.js';
import { evalRule } from './rules.js';

export function buildTree(source, grammar) {
  const root = parseSource(source);
  assignRoles(root, grammar.roles);
  return root;
}

export function buildTreeFromSnapshot(snapshot, grammar) {
  const root = parseSnapshot(snapshot);
  assignRoles(root, grammar.roles);
  return root;
}

function evalAll(grammar, root, file) {
  const violations = [];
  for (const rule of grammar.rules) {
    for (const found of evalRule(root, rule)) {
      violations.push({ ...found, file: file || '<source>' });
    }
  }
  return violations;
}

export function checkSource(grammar, source, file) {
  return evalAll(grammar, buildTree(source, grammar), file);
}

export function checkSnapshot(grammar, snapshot, file) {
  return evalAll(grammar, buildTreeFromSnapshot(snapshot, grammar), file);
}

export function rank(violations) {
  return violations.slice().sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    if (a.line !== b.line) return a.line - b.line;
    return a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0;
  });
}

export function checkFile(grammar, file) {
  const text = fs.readFileSync(file, 'utf8');
  if (path.extname(file).toLowerCase() === '.json') {
    return checkSnapshot(grammar, parseDomJson(text), file);
  }
  return checkSource(grammar, text, file);
}

export function checkFiles(grammar, files) {
  let all = [];
  for (const file of files) {
    all = all.concat(checkFile(grammar, file));
  }
  return rank(all);
}
