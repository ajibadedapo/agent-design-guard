import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, cohenKappa } from '../scripts/kappa.mjs';

test('parseCsv reads header and rating pairs', () => {
  const csv = 'item,raterA,raterB\n1,cardinality,cardinality\n2,ordering,exclusion\n';
  const pairs = parseCsv(csv);
  assert.equal(pairs.length, 2);
  assert.deepEqual(pairs[0], { item: '1', raterA: 'cardinality', raterB: 'cardinality' });
});

test('cohenKappa is 1 on perfect agreement', () => {
  const pairs = [
    { raterA: 'a', raterB: 'a' },
    { raterA: 'b', raterB: 'b' },
    { raterA: 'a', raterB: 'a' }
  ];
  assert.equal(cohenKappa(pairs).kappa, 1);
});

test('cohenKappa matches a known worked example', () => {
  const pairs = [];
  for (let i = 0; i < 20; i += 1) pairs.push({ raterA: 'yes', raterB: 'yes' });
  for (let i = 0; i < 5; i += 1) pairs.push({ raterA: 'yes', raterB: 'no' });
  for (let i = 0; i < 10; i += 1) pairs.push({ raterA: 'no', raterB: 'yes' });
  for (let i = 0; i < 15; i += 1) pairs.push({ raterA: 'no', raterB: 'no' });
  const { kappa } = cohenKappa(pairs);
  assert.ok(Math.abs(kappa - 0.4) < 0.01);
});
