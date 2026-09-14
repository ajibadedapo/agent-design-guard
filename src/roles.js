import { allNodes } from './tree.js';

function propMatches(actual, expected, key, props) {
  if (expected === '*') return Object.prototype.hasOwnProperty.call(props, key);
  if (Array.isArray(expected)) return expected.includes(actual);
  if (typeof expected === 'boolean') return Boolean(actual) === expected;
  return actual === expected;
}

function matchesOne(node, matcher) {
  if (!matcher || (!matcher.type && !matcher.props)) return false;
  if (matcher.type) {
    const types = Array.isArray(matcher.type) ? matcher.type : [matcher.type];
    if (!types.includes(node.type)) return false;
  }
  if (matcher.props) {
    for (const [key, expected] of Object.entries(matcher.props)) {
      if (!propMatches(node.props[key], expected, key, node.props)) return false;
    }
  }
  return true;
}

function matchesAny(node, matchers) {
  const list = Array.isArray(matchers) ? matchers : [matchers];
  return list.some((matcher) => matchesOne(node, matcher));
}

export function assignRoles(root, rolesSpec) {
  for (const node of allNodes(root)) {
    node.roles = [];
    for (const [roleName, matchers] of Object.entries(rolesSpec)) {
      if (matchesAny(node, matchers)) node.roles.push(roleName);
    }
  }
  return root;
}
