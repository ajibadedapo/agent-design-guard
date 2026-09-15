import { allNodes, subtree, ancestorsOf, hasRole } from './tree.js';

function roleNames(grammar) {
  return Object.keys(grammar.roles || {});
}

function nodesWithRole(roots, role) {
  const out = [];
  for (const root of roots) {
    for (const node of allNodes(root)) {
      if (hasRole(node, role)) out.push(node);
    }
  }
  return out;
}

function countInScope(scopeNode, role) {
  return subtree(scopeNode).filter((n) => n !== scopeNode && hasRole(n, role)).length;
}

function inferCardinality(roots, roles, options) {
  const proposals = [];
  for (const scopeRole of roles) {
    const scopes = nodesWithRole(roots, scopeRole);
    if (scopes.length < options.minSupport) continue;
    for (const targetRole of roles) {
      if (targetRole === scopeRole) continue;
      const counts = scopes.map((s) => countInScope(s, targetRole));
      const present = counts.filter((c) => c > 0);
      if (present.length < options.minSupport) continue;
      const atMostOne = present.filter((c) => c === 1).length;
      const confidence = atMostOne / present.length;
      if (confidence < options.minConfidence) continue;
      const everyPresentIsOne = present.every((c) => c === 1);
      const params = everyPresentIsOne ? { role: targetRole, exactly: 1 } : { role: targetRole, atMost: 1 };
      proposals.push({
        shape: 'cardinality',
        scope: { role: scopeRole },
        params,
        support: present.length,
        confidence,
        summary: `${everyPresentIsOne ? 'exactly 1' : 'at most 1'} ${targetRole} per ${scopeRole}`
      });
    }
  }
  return proposals;
}

function inferAccompaniment(roots, roles, options) {
  const proposals = [];
  for (const scopeRole of roles) {
    const scopes = nodesWithRole(roots, scopeRole);
    if (scopes.length < options.minSupport) continue;
    for (const subjectRole of roles) {
      if (subjectRole === scopeRole) continue;
      const withSubject = scopes.filter((s) => countInScope(s, subjectRole) > 0);
      if (withSubject.length < options.minSupport) continue;
      for (const companionRole of roles) {
        if (companionRole === scopeRole || companionRole === subjectRole) continue;
        const alsoCompanion = withSubject.filter((s) => countInScope(s, companionRole) > 0);
        const confidence = alsoCompanion.length / withSubject.length;
        if (alsoCompanion.length < options.minSupport) continue;
        if (confidence < options.minConfidence) continue;
        proposals.push({
          shape: 'accompaniment',
          scope: { role: scopeRole },
          params: { role: subjectRole, requires: companionRole },
          support: withSubject.length,
          confidence,
          summary: `${subjectRole} requires ${companionRole} in same ${scopeRole}`
        });
      }
    }
  }
  return proposals;
}

function inferContainment(roots, roles, options) {
  const proposals = [];
  for (const targetRole of roles) {
    const nodes = nodesWithRole(roots, targetRole);
    if (nodes.length < options.minSupport) continue;
    for (const ancestorRole of roles) {
      if (ancestorRole === targetRole) continue;
      const contained = nodes.filter((n) =>
        ancestorsOf(n).some((a) => hasRole(a, ancestorRole))
      );
      if (contained.length < options.minSupport) continue;
      const confidence = contained.length / nodes.length;
      if (confidence < options.minConfidence) continue;
      proposals.push({
        shape: 'containment',
        params: { role: targetRole, inside: ancestorRole },
        support: contained.length,
        confidence,
        summary: `${targetRole} inside ${ancestorRole}`
      });
    }
  }
  return proposals;
}

const DEFAULTS = { minSupport: 2, minConfidence: 0.8 };

export function inferProposals(roots, grammar, options) {
  const opts = { ...DEFAULTS, ...(options || {}) };
  const roles = roleNames(grammar);
  const proposals = [
    ...inferCardinality(roots, roles, opts),
    ...inferAccompaniment(roots, roles, opts),
    ...inferContainment(roots, roles, opts)
  ];
  return proposals.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.support - a.support;
  });
}

export function formatProposals(proposals) {
  const lines = [];
  lines.push(`proposed rules (${proposals.length}):`);
  for (const p of proposals) {
    const conf = p.confidence.toFixed(2);
    lines.push(`  [${p.shape}] ${p.summary}  (support ${p.support}, confidence ${conf})`);
  }
  if (proposals.length === 0) lines.push('  none above thresholds');
  return lines.join('\n');
}
