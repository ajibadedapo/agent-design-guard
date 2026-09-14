import fs from 'node:fs';
import { parseSource } from './adapter.js';
import { assignRoles } from './roles.js';
import { evalRule } from './rules.js';

export function buildTree(source, grammar) {
  const root = parseSource(source);
  assignRoles(root, grammar.roles);
  return root;
}

export function checkSource(grammar, source, file) {
  const root = buildTree(source, grammar);
  const violations = [];
  for (const rule of grammar.rules) {
    for (const found of evalRule(root, rule)) {
      violations.push({ ...found, file: file || '<source>' });
    }
  }
  return violations;
}

export function rank(violations) {
  return violations.slice().sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    if (a.line !== b.line) return a.line - b.line;
    return a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0;
  });
}

export function checkFiles(grammar, files) {
  let all = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    all = all.concat(checkSource(grammar, source, file));
  }
  return rank(all);
}
