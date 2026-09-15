import { allNodes } from './tree.js';

export function propMatches(actual, expected, key, props) {
  if (expected === '*') return Object.prototype.hasOwnProperty.call(props, key);
  if (Array.isArray(expected)) return expected.includes(actual);
  if (typeof expected === 'boolean') return Boolean(actual) === expected;
  if (expected && typeof expected === 'object') {
    if (Object.prototype.hasOwnProperty.call(expected, 'present')) {
      return Object.prototype.hasOwnProperty.call(props, key) === Boolean(expected.present);
    }
    if (Object.prototype.hasOwnProperty.call(expected, 'not')) {
      const forbidden = Array.isArray(expected.not) ? expected.not : [expected.not];
      return !forbidden.includes(actual);
    }
    if (Object.prototype.hasOwnProperty.call(expected, 'equals')) {
      return actual === expected.equals;
    }
    return false;
  }
  return actual === expected;
}

export function propsMatch(props, spec) {
  for (const [key, expected] of Object.entries(spec)) {
    if (!propMatches(props[key], expected, key, props)) return false;
  }
  return true;
}

export function matchesOne(node, matcher) {
  if (!matcher || (!matcher.type && !matcher.props)) return false;
  if (matcher.type) {
    const types = Array.isArray(matcher.type) ? matcher.type : [matcher.type];
    if (!types.includes(node.type)) return false;
  }
  if (matcher.props && !propsMatch(node.props, matcher.props)) return false;
  return true;
}

export function matchesAny(node, matchers) {
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
