import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRule } from './helpers.js';

test('cardinality: exactly one primary per region', () => {
  const bad = `<ButtonGroup><Button variant="primary">A</Button><Button variant="primary">B</Button></ButtonGroup>`;
  const good = `<ButtonGroup><Button variant="primary">A</Button></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-one-primary-per-region').length, 1);
  assert.equal(checkRule(good, 'primer-one-primary-per-region').length, 0);
});

test('cardinality: at most one danger per region', () => {
  const bad = `<ButtonGroup><Button variant="danger">A</Button><Button variant="danger">B</Button></ButtonGroup>`;
  const good = `<ButtonGroup><Button variant="danger">A</Button></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-at-most-one-danger-per-region').length, 1);
  assert.equal(checkRule(good, 'primer-at-most-one-danger-per-region').length, 0);
});

test('uniqueness: icon button labels must be unique in a region', () => {
  const bad = `<ButtonGroup><IconButton aria-label="More" /><IconButton aria-label="More" /></ButtonGroup>`;
  const good = `<ButtonGroup><IconButton aria-label="More" /><IconButton aria-label="Less" /></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-icon-button-labels-unique').length, 1);
  assert.equal(checkRule(good, 'primer-icon-button-labels-unique').length, 0);
});

test('accompaniment: danger action needs a confirmation', () => {
  const bad = `<ButtonGroup><Button variant="danger">Delete</Button></ButtonGroup>`;
  const good = `<ButtonGroup><Button variant="danger">Delete</Button><ConfirmationDialog title="Sure?" /></ButtonGroup>`;
  assert.equal(checkRule(bad, 'primer-danger-needs-confirmation').length, 1);
  assert.equal(checkRule(good, 'primer-danger-needs-confirmation').length, 0);
});

test('containment: menu item must be inside a menu', () => {
  const bad = `<MenuItem>Profile</MenuItem>`;
  const good = `<Menu><MenuItem>Profile</MenuItem></Menu>`;
  assert.equal(checkRule(bad, 'primer-menu-item-in-menu').length, 1);
  assert.equal(checkRule(good, 'primer-menu-item-in-menu').length, 0);
});

test('exclusion: navigation must not be inside a modal', () => {
  const bad = `<Dialog><Link href="/x">Home</Link></Dialog>`;
  const good = `<Dialog><Text>Static</Text></Dialog>`;
  assert.equal(checkRule(bad, 'primer-no-navigation-in-modal').length, 1);
  assert.equal(checkRule(good, 'primer-no-navigation-in-modal').length, 0);
});

test('dependency: submit button requires an ancestor form', () => {
  const bad = `<Button type="submit">Send</Button>`;
  const good = `<form><Button type="submit">Send</Button></form>`;
  assert.equal(checkRule(bad, 'primer-submit-requires-form').length, 1);
  assert.equal(checkRule(good, 'primer-submit-requires-form').length, 0);
});

test('mutual-exclusion: loading and disabled cannot co-occur', () => {
  const bad = `<Button loading disabled>Saving</Button>`;
  const good = `<Button loading>Saving</Button>`;
  assert.equal(checkRule(bad, 'primer-loading-excludes-disabled').length, 1);
  assert.equal(checkRule(good, 'primer-loading-excludes-disabled').length, 0);
});

test('ordering: footer secondary action must come before primary', () => {
  const bad = `<Dialog.Footer><Button variant="primary">OK</Button><Button variant="secondary">Cancel</Button></Dialog.Footer>`;
  const good = `<Dialog.Footer><Button variant="secondary">Cancel</Button><Button variant="primary">OK</Button></Dialog.Footer>`;
  assert.equal(checkRule(bad, 'primer-footer-secondary-before-primary').length, 1);
  assert.equal(checkRule(good, 'primer-footer-secondary-before-primary').length, 0);
});
