import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFamilyReading, checkFamilyCounts } from '../dist/family.js';

// This hand-checkable fixture forces the contributor distances to equal the target houses.
const chart = {
  ascSign: 0,
  planets: ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].map(name => ({ name, sign: 0 }))
};

test('family counts use the referenced sign, contributor split and child dignity exclusions', () => {
  const reading = buildFamilyReading(chart);
  assert.deepEqual(reading.siblings.points, ['Sun','Moon','Mercury','Lagna']);
  assert.deepEqual(reading.siblings.male, [1,3]);
  assert.deepEqual(reading.siblings.female, [1,3]);
  assert.equal(reading.relatives.total, reading.paternal.total + reading.maternal.total);
  assert.deepEqual(reading.children.excluded, ['Saturn']);
  assert.equal(reading.children.total, 4);
});

test('comparison checks the combined totals and treats children so far as a lower bound', () => {
  const reading = buildFamilyReading(chart);
  assert.match(checkFamilyCounts(reading, { brothers: 1, sisters: 1 })[0], /miss/);
  assert.match(checkFamilyCounts(reading, { brothers: 1, sisters: 3 })[0], /fit/);
  assert.match(checkFamilyCounts(reading, { children: 1 })[0], /still open/);
  assert.match(checkFamilyCounts(reading, { children: 5 })[0], /already misses/);
});
