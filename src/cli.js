import fs from 'node:fs';
import path from 'node:path';
import { loadGrammar } from './grammar.js';
import { checkFiles, buildTree, buildTreeFromSnapshot } from './engine.js';
import { parseDomJson } from './adapters/dom.js';
import { inferProposals, formatProposals } from './infer.js';

const USAGE = [
  'usage:',
  '  agent-design-guard check <grammar.yaml> <files...> [--platform web|ios|android]',
  '      check .tsx/.jsx source or .json DOM snapshot',
  '  agent-design-guard infer <grammar.yaml> <files...>',
  '      propose candidate rules from role definitions'
].join('\n');

function parseArgs(args) {
  const files = [];
  let platform = 'web';
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--platform') {
      platform = args[i + 1] || 'web';
      i += 1;
    } else if (arg.startsWith('--platform=')) {
      platform = arg.slice('--platform='.length);
    } else {
      files.push(arg);
    }
  }
  return { files, platform };
}

function loadRoot(grammar, file) {
  const text = fs.readFileSync(file, 'utf8');
  if (path.extname(file).toLowerCase() === '.json') {
    return buildTreeFromSnapshot(parseDomJson(text), grammar);
  }
  return buildTree(text, grammar);
}

function runCheck(grammarPath, rest) {
  const { files, platform } = parseArgs(rest);
  if (files.length === 0) {
    process.stderr.write(USAGE + '\n');
    return 2;
  }
  const grammar = loadGrammar(grammarPath);
  const violations = checkFiles(grammar, files, platform);
  for (const v of violations) {
    process.stdout.write(`${v.file}:${v.line} [${v.severity}] ${v.ruleId} ${v.message}\n`);
  }
  const failing = violations.filter((v) => v.severity !== 'note');
  const notes = violations.length - failing.length;
  if (failing.length > 0) {
    process.stderr.write(`\n${failing.length} violation(s) found${notes ? `, ${notes} note(s)` : ''}\n`);
    return 1;
  }
  process.stdout.write(`No violations found${notes ? ` (${notes} note(s))` : ''}\n`);
  return 0;
}

function runInfer(grammarPath, rest) {
  const { files } = parseArgs(rest);
  const grammar = loadGrammar(grammarPath);
  const roots = files.map((file) => loadRoot(grammar, file));
  const proposals = inferProposals(roots, grammar);
  process.stdout.write(formatProposals(proposals) + '\n');
  return 0;
}

export function run(argv) {
  const [command, grammarPath, ...rest] = argv;
  if (!grammarPath || rest.length === 0) {
    process.stderr.write(USAGE + '\n');
    return 2;
  }
  if (command === 'check') return runCheck(grammarPath, rest);
  if (command === 'infer') return runInfer(grammarPath, rest);
  process.stderr.write(USAGE + '\n');
  return 2;
}
