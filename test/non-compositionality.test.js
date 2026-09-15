import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRule } from './helpers.js';

test('two subtrees each valid alone are invalid when composed (paper 3.4)', () => {
  const modalAlone = `<Dialog title="Info"><Text label="Static content"/></Dialog>`;
  const navAlone = `<nav><Link href="/home" label="Home"/></nav>`;
  const composed = `<Dialog title="Info"><Link href="/home" label="Home"/></Dialog>`;

  assert.equal(checkRule(modalAlone, 'primer-no-nav-in-modal').length, 0);
  assert.equal(checkRule(navAlone, 'primer-no-nav-in-modal').length, 0);
  assert.equal(checkRule(composed, 'primer-no-nav-in-modal').length, 1);
});
