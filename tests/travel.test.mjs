import test from 'node:test';
import assert from 'node:assert/strict';
import { travelSignals, selectTravelWindows } from '../dist/travel.js';
import { readPresetProfiles } from '../dist/profiles.js';

const houses = (...numbers) => numbers.map(house => ({ house, evidence: ['fixture'] }));

test('travel strength follows the annual and monthly house evidence', () => {
  assert.deepEqual(travelSignals(houses(9, 12, 3), houses()), []);
  assert.deepEqual(travelSignals(houses(9), houses(12, 3)).map(({ type, strength }) => [type, strength]), [
    ['foreign-travel', 'Strong'], ['domestic-travel', 'Mild']
  ]);
  assert.deepEqual(travelSignals(houses(3), houses(9, 12, 3)).map(({ type, strength }) => [type, strength]), [
    ['foreign-travel', 'Mild'], ['domestic-travel', 'Strong']
  ]);
});

test('travel selection retains mild and strong windows without clusters', () => {
  const candidate = (date, strength, score) => ({ start: new Date(date), strength, era: 'future', score });
  const nearby = candidate('2027-02-01', 'Mild', 4);
  const strong = candidate('2027-01-01', 'Strong', 3);
  const mild = candidate('2027-06-01', 'Mild', 2);
  assert.deepEqual(selectTravelWindows([nearby, strong, mild]), [strong, mild]);
});

test('built-in profiles can load without relying on browser storage', async () => {
  const sample = { Example: { date: '1990-01-01', time: '12:00', city: 'Delhi' } };
  assert.deepEqual(await readPresetProfiles(async () => ({ ok: true, json: async () => sample })), sample);
  assert.deepEqual(await readPresetProfiles(async () => ({ ok: false })), {});
});
