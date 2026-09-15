import fs from 'node:fs';
import path from 'node:path';
import { loadGrammar } from './grammar.js';
import { checkFiles, buildTree, buildTreeFromSnapshot } from './engine.js';
import { parseDomJson } from './adapters/dom.js';
import { inferProposals, formatProposals } from './infer.js';

const USAGE = [
  'usage:',
  '  rulveo check <grammar.yaml> <files...>   check files (.tsx/.jsx source or .json DOM snapshot)',
  '  rulveo infer <grammar.yaml> <files...>   propose candidate rules from role definitions'
].join('\n');

function loadRoot(grammar, file) {
  const text = fs.readFileSync(file, 'utf8');
  if (path.extname(file).toLowerCase() === '.json') {
    return buildTreeFromSnapshot(parseDomJson(text), grammar);
  }
  return buildTree(text, grammar);
}

function runCheck(grammarPath, files) {
  const grammar = loadGrammar(grammarPath);
  const violations = checkFiles(grammar, files);
  for (const v of violations) {
    process.stdout.write(`${v.file}:${v.line} ${v.ruleId} ${v.message}\n`);
  }
  if (violations.length > 0) {
    process.stderr.write(`\n${violations.length} violation(s) found\n`);
    return 1;
  }
  process.stdout.write('No violations found\n');
  return 0;
}

function runInfer(grammarPath, files) {
  const grammar = loadGrammar(grammarPath);
  const roots = files.map((file) => loadRoot(grammar, file));
  const proposals = inferProposals(roots, grammar);
  process.stdout.write(formatProposals(proposals) + '\n');
  return 0;
}

export function run(argv) {
  const [command, grammarPath, ...files] = argv;
  if (!grammarPath || files.length === 0) {
    process.stderr.write(USAGE + '\n');
    return 2;
  }
  if (command === 'check') return runCheck(grammarPath, files);
  if (command === 'infer') return runInfer(grammarPath, files);
  process.stderr.write(USAGE + '\n');
  return 2;
}
