import fs from 'node:fs';
import yaml from 'js-yaml';

function resolveParamRefs(value, parameters) {
  if (Array.isArray(value)) return value.map((v) => resolveParamRefs(v, parameters));
  if (value && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'param')) {
      const name = value.param;
      if (!Object.prototype.hasOwnProperty.call(parameters, name)) {
        throw new Error(`Unknown parameter referenced: ${name}`);
      }
      return parameters[name];
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveParamRefs(v, parameters);
    return out;
  }
  return value;
}

export function parseGrammar(text) {
  const doc = yaml.load(text) || {};
  const parameters = doc.parameters || {};
  const rawRules = doc.constraints || doc.rules || [];
  const rules = rawRules.map((rule) => ({
    ...rule,
    params: resolveParamRefs(rule.params || {}, parameters),
    when: rule.when ? resolveParamRefs(rule.when, parameters) : undefined
  }));
  return {
    language: doc.language || null,
    version: doc.version || null,
    tokens: doc.tokens || {},
    components: doc.components || {},
    parameters,
    roles: doc.roles || {},
    rules,
    patterns: doc.patterns || {}
  };
}

export function loadGrammar(path) {
  return parseGrammar(fs.readFileSync(path, 'utf8'));
}
