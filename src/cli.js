import { loadGrammar } from './grammar.js';
import { checkFiles } from './engine.js';

const USAGE = 'usage: uigrammar check <grammar.yaml> <files...>';

export function run(argv) {
  const [command, grammarPath, ...files] = argv;
  if (command !== 'check' || !grammarPath || files.length === 0) {
    process.stderr.write(USAGE + '\n');
    return 2;
  }
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
