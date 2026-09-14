import fs from 'node:fs';
import yaml from 'js-yaml';

export function parseGrammar(text) {
  const doc = yaml.load(text) || {};
  return {
    roles: doc.roles || {},
    rules: doc.rules || []
  };
}

export function loadGrammar(path) {
  return parseGrammar(fs.readFileSync(path, 'utf8'));
}
