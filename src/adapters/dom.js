import { makeNode, appendChild } from '../tree.js';

function typeOf(node) {
  return (
    node.type ||
    node.tag ||
    node.tagName ||
    node.nodeName ||
    node.role ||
    '#node'
  );
}

function propsOf(node) {
  const base = node.props || node.attributes || node.attrs || {};
  const props = { ...base };
  if (node.role != null && props.role == null) props.role = node.role;
  if (node.name != null && props.name == null) props.name = node.name;
  if (node.value != null && props.value == null) props.value = node.value;
  return props;
}

function childrenOf(node) {
  return node.children || node.childNodes || [];
}

function convert(node) {
  const internal = makeNode(typeOf(node), propsOf(node), node.line || 0);
  for (const child of childrenOf(node)) {
    if (child && typeof child === 'object') appendChild(internal, convert(child));
  }
  return internal;
}

export function parseSnapshot(snapshot) {
  const document = makeNode('#document', {}, 0);
  const roots = Array.isArray(snapshot) ? snapshot : [snapshot];
  for (const root of roots) {
    if (root && typeof root === 'object') appendChild(document, convert(root));
  }
  return document;
}

export function parseDomJson(text) {
  const data = typeof text === 'string' ? JSON.parse(text) : text;
  return parseSnapshot(data);
}
