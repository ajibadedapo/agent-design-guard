export function makeNode(type, props, line) {
  return { type, props: props || {}, children: [], line: line || 0, roles: [], parent: null };
}

export function appendChild(parent, child) {
  child.parent = parent;
  parent.children.push(child);
}

export function preorder(node, out) {
  out.push(node);
  for (const child of node.children) preorder(child, out);
  return out;
}

export function allNodes(root) {
  return preorder(root, []);
}

export function subtree(node) {
  return preorder(node, []);
}

export function ancestorsOf(node) {
  const out = [];
  let current = node.parent;
  while (current) {
    out.push(current);
    current = current.parent;
  }
  return out;
}

export function hasRole(node, role) {
  return node.roles.includes(role);
}
