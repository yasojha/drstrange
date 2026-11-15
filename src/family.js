import { SIGNS } from './engine.js';

// Phaladipika 23.3–7. Each row uses Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna.
const contributors = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];
const binduHouses = {
  Sun: [
    [1,2,4,7,8,9,10,11], [3,6,10,11], [1,2,4,7,8,9,10,11], [3,5,6,9,10,11,12],
    [5,6,9,11], [6,7,12], [1,2,4,7,8,9,10,11], [3,4,6,10,11,12]
  ],
  Moon: [
    [3,6,7,8,10,11], [1,3,6,7,10,11], [2,3,5,6,9,10,11], [1,3,4,5,7,8,10,11],
    [1,2,4,7,8,10,11], [3,4,5,7,9,10,11], [3,5,6,11], [3,6,10,11]
  ],
  Mars: [
    [3,5,6,10,11], [3,6,11], [1,2,4,7,8,10,11], [3,5,6,11],
    [6,10,11,12], [6,8,11,12], [1,4,7,8,9,10,11], [1,3,6,10,11]
  ],
  Mercury: [
    [5,6,9,11,12], [2,4,6,8,10,11], [1,2,4,7,8,9,10,11], [1,3,5,6,9,10,11,12],
    [6,8,11,12], [1,2,3,4,5,8,9,11], [1,2,4,7,8,9,10,11], [1,2,4,6,8,10,11]
  ],
  Jupiter: [
    [1,2,3,4,7,8,9,10,11], [2,5,7,9,11], [1,2,4,7,8,10,11], [1,2,4,5,6,9,10,11],
    [1,2,3,4,7,8,10,11], [2,5,6,9,10,11], [3,5,6,12], [1,2,4,5,6,7,9,10,11]
  ]
};

const rulers = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const debilitated = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const naturalEnemies = {
  Sun: ['Venus','Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'],
  Jupiter: ['Mercury','Venus'], Venus: ['Sun','Moon'], Saturn: ['Sun','Moon','Mars']
};

function pointSources(signs, planet, house) {
  const target = (signs[planet] + house - 1) % 12;
  const points = contributors.filter((name, index) => {
    const distance = (target - signs[name] + 12) % 12 + 1;
    return binduHouses[planet][index].includes(distance);
  });
  return { sign: SIGNS[target], points };
}

function split(points) {
  const male = points.filter(name => ['Sun', 'Mars', 'Jupiter'].includes(name)).length;
  const female = points.filter(name => ['Moon', 'Venus'].includes(name)).length;
  const unassigned = points.length - male - female;
  return {
    total: points.length,
    // Patel's split counts the male-planet points first and assigns the remainder to sisters.
    estimate: { male, female: points.length - male },
    male: [male, male + unassigned],
    female: [female, female + unassigned],
    alternatives: Array.from({ length: unassigned }, (_, index) => ({
      male: male + index + 1,
      female: points.length - male - index - 1
    }))
  };
}

export function buildFamilyReading(chart) {
  const signs = Object.fromEntries(chart.planets.map(({name, sign}) => [name, sign]));
  signs.Lagna = chart.ascSign;
  const siblings = pointSources(signs, 'Mars', 3);
  const paternal = pointSources(signs, 'Sun', 9);
  const maternal = pointSources(signs, 'Moon', 4);
  const maternalCrossCheck = pointSources(signs, 'Mercury', 4);
  const children = pointSources(signs, 'Jupiter', 5);
  // Phaladipika 24.10 removes contributors in debilitation or an enemy sign.
  // Lagna is a reference point and has no planetary dignity of its own.
  const excluded = children.points.filter(name => name !== 'Lagna' &&
    (signs[name] === debilitated[name] || naturalEnemies[name].includes(rulers[signs[name]])));
  return {
    siblings: { ...siblings, ...split(siblings.points) },
    paternal: { ...paternal, ...split(paternal.points) },
    maternal: { ...maternal, ...split(maternal.points) },
    relatives: split([...paternal.points, ...maternal.points]),
    maternalCrossCheck,
    children: { ...children, excluded, total: children.points.length - excluded.length }
  };
}

export function checkFamilyCounts(reading, actual) {
  const results = [];
  for (const [first, second, estimate, label] of [
    ['brothers', 'sisters', reading.siblings, 'Brothers and sisters'],
    ['uncles', 'aunts', reading.relatives, 'Uncles and aunts']
  ]) {
    const a = actual[first], b = actual[second];
    if (a === undefined && b === undefined) continue;
    const matches = ({ male, female }) => (a === undefined || a === male) &&
      (b === undefined || b === female);
    const exact = matches(estimate.estimate);
    const alternative = estimate.alternatives.some(matches);
    const reported = a !== undefined && b !== undefined
      ? `You entered ${a} ${first} and ${b} ${second}.`
      : `You entered ${a ?? b} ${a !== undefined ? first : second}.`;
    const primary = `The main estimate is ${estimate.estimate.male} ${first} and ${estimate.estimate.female} ${second}.`;
    const comparison = exact
      ? 'The entered counts fit the main estimate.'
      : alternative ? 'The entered counts fit an alternate split.' : 'The entered counts miss all splits.';
    results.push(`${label}. ${reported} ${primary} ${comparison}`);
  }
  if (actual.children !== undefined) {
    results.push(actual.children > reading.children.total
      ? `The child estimate already misses. You entered ${actual.children}, above the chart’s ${reading.children.total}.`
      : `Children so far: ${actual.children}. The chart’s estimate of ${reading.children.total} is still open.`);
  }
  return results;
}
