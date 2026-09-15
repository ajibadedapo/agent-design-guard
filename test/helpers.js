import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildTree } from '../src/engine.js';
import { evalRule } from '../src/rules.js';
import { assignRoles } from '../src/roles.js';
import { parseSource } from '../src/adapter.js';
import { loadGrammar } from '../src/grammar.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '..');

export const grammar = loadGrammar(path.join(root, 'grammars', 'primer.yaml'));

export function ruleById(id) {
  const rule = grammar.rules.find((r) => r.id === id);
  if (!rule) throw new Error(`rule not found: ${id}`);
  return rule;
}

export function checkRule(source, ruleId, platform) {
  const tree = buildTree(source, grammar);
  return evalRule(tree, ruleById(ruleId), { grammar, platform: platform || 'web' });
}

export function runInline(source, roles, rule, extraGrammar) {
  const tree = parseSource(source);
  assignRoles(tree, roles);
  return evalRule(tree, rule, { grammar: extraGrammar || { tokens: {}, components: {} } });
}
