import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRule } from './helpers.js';

test('two subtrees each valid alone are invalid when composed', () => {
  const modalAlone = `<Dialog title="Info"><Text>Static content</Text></Dialog>`;
  const navAlone = `<nav><Link href="/home">Home</Link></nav>`;
  const composed = `<Dialog title="Info"><Link href="/home">Home</Link></Dialog>`;

  assert.equal(checkRule(modalAlone, 'primer-no-navigation-in-modal').length, 0);
  assert.equal(checkRule(navAlone, 'primer-no-navigation-in-modal').length, 0);
  assert.equal(checkRule(composed, 'primer-no-navigation-in-modal').length, 1);
});
