import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSource } from '../src/adapter.js';
import { assignRoles } from '../src/roles.js';
import { evalRule } from '../src/rules.js';
import { allNodes, hasRole } from '../src/tree.js';

const roles = {
  primary: [{ type: 'Button', props: { variant: { not: ['secondary', 'ghost', 'danger'] } } }],
  labelled: [{ props: { label: { present: true } } }]
};

function build(source) {
  const tree = parseSource(source);
  assignRoles(tree, roles);
  return tree;
}

test('not matcher treats an absent prop as satisfying the predicate', () => {
  const tree = build('<><Button>Save</Button><Button variant="danger">Delete</Button></>');
  const primaries = allNodes(tree).filter((n) => hasRole(n, 'primary'));
  assert.equal(primaries.length, 1);
});

test('not matcher rejects a forbidden explicit value', () => {
  const tree = build('<Button variant="ghost">Cancel</Button>');
  const primaries = allNodes(tree).filter((n) => hasRole(n, 'primary'));
  assert.equal(primaries.length, 0);
});

test('present matcher distinguishes prop presence from value', () => {
  const tree = build('<><Field label="Name" /><Field placeholder="Search" /></>');
  const labelled = allNodes(tree).filter((n) => hasRole(n, 'labelled'));
  assert.equal(labelled.length, 1);
});

test('uniqueness ignores nodes whose key prop is absent', () => {
  const tree = build('<Group><Field placeholder="a" /><Field placeholder="b" /></Group>');
  assignRoles(tree, { field: [{ type: 'Field' }], group: [{ type: 'Group' }] });
  const rule = {
    id: 't',
    shape: 'uniqueness',
    scope: { role: 'group' },
    params: { role: 'field', by: 'label' }
  };
  assert.equal(evalRule(tree, rule).length, 0);
});
