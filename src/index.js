export { parseSource } from './adapter.js';
export { parseSnapshot, parseDomJson } from './adapters/dom.js';
export { assignRoles, propMatches, matchesAny } from './roles.js';
export { evalRule, evalPatterns, SHAPE_NAMES, STRUCTURAL_SHAPES } from './rules.js';
export { parseGrammar, loadGrammar } from './grammar.js';
export {
  buildTree,
  buildTreeFromSnapshot,
  checkSource,
  checkSnapshot,
  checkFile,
  checkFiles,
  rank
} from './engine.js';
export { inferProposals, formatProposals } from './infer.js';
