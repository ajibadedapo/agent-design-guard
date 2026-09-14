import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildTree } from '../src/engine.js';
import { evalRule } from '../src/rules.js';
import { loadGrammar } from '../src/grammar.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '..');

export const grammar = loadGrammar(path.join(root, 'grammars', 'primer.yaml'));

export function ruleById(id) {
  const rule = grammar.rules.find((r) => r.id === id);
  if (!rule) throw new Error(`rule not found: ${id}`);
  return rule;
}

export function checkRule(source, ruleId) {
  const tree = buildTree(source, grammar);
  return evalRule(tree, ruleById(ruleId));
}
