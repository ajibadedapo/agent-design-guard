import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { makeNode, appendChild } from './tree.js';

const traverse = _traverse.default || _traverse;

const SKIP_KEYS = new Set([
  'loc',
  'start',
  'end',
  'range',
  'leadingComments',
  'trailingComments',
  'innerComments',
  'comments'
]);

function nameOf(node) {
  if (!node) return 'unknown';
  if (node.type === 'JSXIdentifier') return node.name;
  if (node.type === 'JSXMemberExpression') return nameOf(node.object) + '.' + nameOf(node.property);
  if (node.type === 'JSXNamespacedName') return node.namespace.name + ':' + node.name.name;
  if (node.type === 'Identifier') return node.name;
  return 'unknown';
}

function exprValue(expr) {
  if (!expr) return null;
  if (expr.type === 'StringLiteral') return expr.value;
  if (expr.type === 'NumericLiteral') return expr.value;
  if (expr.type === 'BooleanLiteral') return expr.value;
  if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
    return expr.quasis.map((q) => q.value.cooked).join('');
  }
  if (expr.type === 'Identifier') return { ref: expr.name };
  return { expr: true };
}

function attrValue(value) {
  if (value == null) return true;
  if (value.type === 'StringLiteral') return value.value;
  if (value.type === 'JSXExpressionContainer') return exprValue(value.expression);
  return true;
}

function propsOf(openingElement) {
  const props = {};
  for (const attr of openingElement.attributes) {
    if (attr.type !== 'JSXAttribute') continue;
    const key =
      attr.name.type === 'JSXNamespacedName'
        ? attr.name.namespace.name + ':' + attr.name.name.name
        : attr.name.name;
    props[key] = attrValue(attr.value);
  }
  return props;
}

function collectJsxFromExpr(node, out) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
    out.push(node);
    return;
  }
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item.type === 'string') collectJsxFromExpr(item, out);
      }
    } else if (value && typeof value.type === 'string') {
      collectJsxFromExpr(value, out);
    }
  }
}

function collectChildJsx(children) {
  const out = [];
  for (const child of children || []) {
    if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
      out.push(child);
    } else if (child.type === 'JSXExpressionContainer' || child.type === 'JSXSpreadChild') {
      collectJsxFromExpr(child.expression, out);
    }
  }
  return out;
}

function convertElement(element) {
  let type;
  let props = {};
  const line = element.loc ? element.loc.start.line : 0;
  if (element.type === 'JSXFragment') {
    type = '#fragment';
  } else {
    type = nameOf(element.openingElement.name);
    props = propsOf(element.openingElement);
  }
  const node = makeNode(type, props, line);
  for (const childElement of collectChildJsx(element.children)) {
    appendChild(node, convertElement(childElement));
  }
  return node;
}

export function parseSource(source) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  const roots = [];
  traverse(ast, {
    'JSXElement|JSXFragment'(path) {
      const parentJsx = path.findParent((p) => p.isJSXElement() || p.isJSXFragment());
      if (!parentJsx) {
        roots.push(path.node);
        path.skip();
      }
    }
  });
  const document = makeNode('#document', {}, 0);
  for (const root of roots) {
    appendChild(document, convertElement(root));
  }
  return document;
}
