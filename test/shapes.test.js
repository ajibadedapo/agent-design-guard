import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRule, runInline } from './helpers.js';

test('S1 cardinality: at most one primary per region', () => {
  const bad = `<ButtonGroup><Button variant="primary" label="A"/><Button variant="primary" label="B"/></ButtonGroup>`;
  const good = `<ButtonGroup><Button variant="primary" label="A"/></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-one-primary-per-region').length, 1);
  assert.equal(checkRule(good, 'primer-one-primary-per-region').length, 0);
});

test('S2 accompaniment: irreversible danger requires a confirmation (list of requires)', () => {
  const bad = `<ButtonGroup><Button variant="danger" reversible={false} label="Delete"/></ButtonGroup>`;
  const good = `<ButtonGroup><Button variant="danger" reversible={false} label="Delete"/><ConfirmDialog title="Sure?"/></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-irreversible-needs-confirmation').length, 1);
  assert.equal(checkRule(good, 'primer-irreversible-needs-confirmation').length, 0);
});

test('S3 ordering: footer secondary before primary', () => {
  const bad = `<Dialog.Footer><Button variant="primary" label="OK ok"/><Button variant="secondary" label="Cancel"/></Dialog.Footer>`;
  const good = `<Dialog.Footer><Button variant="secondary" label="Cancel"/><Button variant="primary" label="OK ok"/></Dialog.Footer>`;
  assert.equal(checkRule(bad, 'primer-footer-order').length, 1);
  assert.equal(checkRule(good, 'primer-footer-order').length, 0);
});

test('S4 containment forbiddenInside: no navigation inside a modal', () => {
  const bad = `<Dialog><Link href="/x" label="Home"/></Dialog>`;
  const good = `<Dialog><Text label="Static"/></Dialog>`;
  assert.equal(checkRule(bad, 'primer-no-nav-in-modal').length, 1);
  assert.equal(checkRule(good, 'primer-no-nav-in-modal').length, 0);
});

test('S4 containment inside: a role must have a matching ancestor', () => {
  const roles = { item: [{ type: 'MenuItem' }], menu: [{ type: 'Menu' }] };
  const rule = { id: 'c', shape: 'containment', params: { role: 'item', inside: 'menu' } };
  assert.equal(runInline('<MenuItem>x</MenuItem>', roles, rule).length, 1);
  assert.equal(runInline('<Menu><MenuItem>x</MenuItem></Menu>', roles, rule).length, 0);
});

test('S5 sibling-consistency: buttons in a group share a size', () => {
  const bad = `<ButtonGroup><Button variant="secondary" size="md" label="1"/><Button variant="secondary" size="sm" label="2"/></ButtonGroup>`;
  const good = `<ButtonGroup><Button variant="secondary" size="md" label="1"/><Button variant="secondary" size="md" label="2"/></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-group-consistent-size').length, 1);
  assert.equal(checkRule(good, 'primer-group-consistent-size').length, 0);
});

test('S6 allowed-combination: variant set must be an allowed combination', () => {
  const bad = `<ButtonGroup><Button variant="primary" label="A"/><Button variant="ghost" label="B"/></ButtonGroup>`;
  const good = `<ButtonGroup><Button variant="primary" label="A"/><Button variant="secondary" label="B"/></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-allowed-button-combo').length, 1);
  assert.equal(checkRule(good, 'primer-allowed-button-combo').length, 0);
});

test('S7 literal-list: a label must not be a bare generic word', () => {
  const bad = `<ButtonGroup><Button variant="secondary" label="OK"/></ButtonGroup>`;
  const good = `<ButtonGroup><Button variant="secondary" label="Save changes"/></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-label-not-generic').length, 1);
  assert.equal(checkRule(good, 'primer-label-not-generic').length, 0);
});

test('S8 conditional: a modal containing a form must be full-screen', () => {
  const bad = `<Dialog><form><Field label="Email"/></form></Dialog>`;
  const good = `<Dialog fullScreen><form><Field label="Email"/></form></Dialog>`;
  const noForm = `<Dialog><Text label="hi"/></Dialog>`;
  assert.equal(checkRule(bad, 'primer-dialog-form-fullscreen').length, 1);
  assert.equal(checkRule(good, 'primer-dialog-form-fullscreen').length, 0);
  assert.equal(checkRule(noForm, 'primer-dialog-form-fullscreen').length, 0);
});

test('uniqueness (utility): icon button labels must be unique in a region', () => {
  const bad = `<ButtonGroup><IconButton aria-label="More"/><IconButton aria-label="More"/></ButtonGroup>`;
  const good = `<ButtonGroup><IconButton aria-label="More"/><IconButton aria-label="Less"/></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-icon-labels-unique').length, 1);
  assert.equal(checkRule(good, 'primer-icon-labels-unique').length, 0);
});

test('backward-compat aliases delegate to canonical shapes', () => {
  const nav = { link: [{ type: 'Link' }], modal: [{ type: 'Dialog' }] };
  const exclusion = { id: 'e', shape: 'exclusion', params: { role: 'link', notInside: 'modal' } };
  assert.equal(runInline('<Dialog><Link/></Dialog>', nav, exclusion).length, 1);

  const dep = { id: 'd', shape: 'dependency', params: { role: 'item', requiresAncestor: 'menu' } };
  const menu = { item: [{ type: 'MenuItem' }], menu: [{ type: 'Menu' }] };
  assert.equal(runInline('<MenuItem/>', menu, dep).length, 1);

  const mx = { id: 'm', shape: 'mutual-exclusion', scope: { role: 'btn' }, params: { roles: ['loading', 'disabled'] } };
  const flags = {
    btn: [{ type: 'Button' }],
    loading: [{ props: { loading: true } }],
    disabled: [{ props: { disabled: true } }]
  };
  assert.equal(runInline('<Button loading disabled/>', flags, mx).length, 1);
  assert.equal(runInline('<Button loading/>', flags, mx).length, 0);
});
