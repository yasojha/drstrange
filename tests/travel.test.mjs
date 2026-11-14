import test from 'node:test';
import assert from 'node:assert/strict';
import { travelEvidence, travelSignals, selectTravelWindows } from '../dist/travel.js';
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

test('annual ninth-house Rahu supports a travel window only with monthly evidence', () => {
  const chart = { ascSign: 4, ascendant: 120, planets: [{ name: 'Rahu', house: 9 }] };
  const annual = travelEvidence(chart, 120);
  assert.ok(travelEvidence(chart).every(row => row.evidence.length === 0));
  assert.deepEqual(travelSignals(annual, houses()), []);
  const [window] = travelSignals(annual, houses(12));
  assert.equal(window.strength, 'Strong');
  assert.ok(window.evidence.some(item => item.includes('Rahu')));
});

test('historical foreign windows retain multiple years and merge only continuous support', () => {
  const make = (start, end, solarYear, score, evidence) => ({
    type: 'foreign-travel', era: 'past', strength: 'Strong',
    start: new Date(start), end: new Date(end), solarYear, score, evidence: [evidence]
  });
  const earlier = [
    make('2018-01-01', '2018-02-01', 2017, 10, 'earlier A'),
    make('2018-04-01', '2018-05-01', 2017, 9, 'earlier B')
  ];
  const later = [
    make('2020-10-01', '2020-11-01', 2020, 3, 'late-year evidence'),
    make('2021-01-01', '2021-02-01', 2020, 5, 'January evidence'),
    make('2021-04-01', '2021-05-01', 2020, 2, 'April evidence'),
    make('2021-05-01', '2021-06-01', 2020, 4, 'May evidence')
  ];
  const selected = selectTravelWindows([...earlier, ...later]).filter(item => item.solarYear === 2020);
  assert.deepEqual(selected.map(item => item.start.toISOString().slice(0, 10)), ['2020-10-01', '2021-01-01', '2021-04-01']);
  assert.equal(selected.at(-1).end.toISOString().slice(0, 10), '2021-06-01');
  assert.deepEqual(selected.at(-1).evidence, ['April evidence', 'May evidence']);
});
