import { allNodes, subtree, ancestorsOf, hasRole } from './tree.js';

function scopeMatches(node, scope) {
  if (scope.role) return hasRole(node, scope.role);
  if (scope.type) {
    const types = Array.isArray(scope.type) ? scope.type : [scope.type];
    return types.includes(node.type);
  }
  return false;
}

function getScopeNodes(root, scope) {
  if (!scope || scope === 'document' || scope.document) return [root];
  return allNodes(root).filter((node) => scopeMatches(node, scope));
}

function violation(rule, node) {
  return {
    ruleId: rule.id,
    shape: rule.shape,
    classId: rule.classId,
    message: rule.message,
    line: node.line
  };
}

function evalCardinality(root, rule) {
  const out = [];
  for (const scope of getScopeNodes(root, rule.scope)) {
    const count = subtree(scope).filter((node) => hasRole(node, rule.params.role)).length;
    let failed = false;
    if (rule.params.exactly != null && count !== rule.params.exactly) failed = true;
    if (rule.params.atLeast != null && count < rule.params.atLeast) failed = true;
    if (rule.params.atMost != null && count > rule.params.atMost) failed = true;
    if (failed) out.push(violation(rule, scope));
  }
  return out;
}

function evalUniqueness(root, rule) {
  const out = [];
  for (const scope of getScopeNodes(root, rule.scope)) {
    const seen = new Set();
    for (const node of subtree(scope).filter((n) => hasRole(n, rule.params.role))) {
      const key = JSON.stringify(node.props[rule.params.by] ?? null);
      if (seen.has(key)) out.push(violation(rule, node));
      else seen.add(key);
    }
  }
  return out;
}

function evalAccompaniment(root, rule) {
  const out = [];
  for (const scope of getScopeNodes(root, rule.scope)) {
    const nodes = subtree(scope);
    const hasSubject = nodes.some((node) => hasRole(node, rule.params.role));
    const hasCompanion = nodes.some((node) => hasRole(node, rule.params.requires));
    if (hasSubject && !hasCompanion) out.push(violation(rule, scope));
  }
  return out;
}

function evalContainment(root, rule) {
  const out = [];
  for (const node of allNodes(root)) {
    if (!hasRole(node, rule.params.role)) continue;
    const contained = ancestorsOf(node).some((ancestor) => hasRole(ancestor, rule.params.inside));
    if (!contained) out.push(violation(rule, node));
  }
  return out;
}

function evalExclusion(root, rule) {
  const out = [];
  for (const node of allNodes(root)) {
    if (!hasRole(node, rule.params.role)) continue;
    const trapped = ancestorsOf(node).some((ancestor) => hasRole(ancestor, rule.params.notInside));
    if (trapped) out.push(violation(rule, node));
  }
  return out;
}

function evalDependency(root, rule) {
  const out = [];
  for (const node of allNodes(root)) {
    if (!hasRole(node, rule.params.role)) continue;
    const satisfied = ancestorsOf(node).some((ancestor) =>
      hasRole(ancestor, rule.params.requiresAncestor)
    );
    if (!satisfied) out.push(violation(rule, node));
  }
  return out;
}

function evalMutualExclusion(root, rule) {
  const out = [];
  for (const scope of getScopeNodes(root, rule.scope)) {
    const nodes = subtree(scope);
    const present = rule.params.roles.filter((role) => nodes.some((node) => hasRole(node, role)));
    if (present.length === rule.params.roles.length) out.push(violation(rule, scope));
  }
  return out;
}

function evalOrdering(root, rule) {
  const out = [];
  const order = rule.params.order;
  for (const scope of getScopeNodes(root, rule.scope)) {
    const sequence = subtree(scope)
      .filter((node) => order.some((role) => hasRole(node, role)))
      .map((node) => order.findIndex((role) => hasRole(node, role)));
    let ordered = true;
    for (let i = 1; i < sequence.length; i += 1) {
      if (sequence[i] < sequence[i - 1]) {
        ordered = false;
        break;
      }
    }
    if (!ordered) out.push(violation(rule, scope));
  }
  return out;
}

const SHAPES = {
  cardinality: evalCardinality,
  uniqueness: evalUniqueness,
  accompaniment: evalAccompaniment,
  containment: evalContainment,
  exclusion: evalExclusion,
  dependency: evalDependency,
  'mutual-exclusion': evalMutualExclusion,
  ordering: evalOrdering
};

export const SHAPE_NAMES = Object.keys(SHAPES);

export function evalRule(root, rule) {
  const evaluator = SHAPES[rule.shape];
  if (!evaluator) throw new Error(`Unknown rule shape: ${rule.shape}`);
  return evaluator(root, rule);
}
