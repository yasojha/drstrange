import { houseOf } from './engine.js';

const rulers = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const DAY = 86400000;

export const travelTypes = [
  { id: 'foreign-travel', label: 'Foreign travel' },
  { id: 'domestic-travel', label: 'Domestic travel' }
];

export function travelEvidence(chart, muntha) {
  const ascendantLord = rulers[chart.ascSign];
  const planets = chart.planets.filter(planet => planet.name !== 'Rahu' && planet.name !== 'Ketu');
  return [3, 9, 12].map(house => {
    const houseLord = rulers[(chart.ascSign + house - 1) % 12];
    const lord = planets.find(planet => planet.name === houseLord);
    const evidence = [];
    for (const planet of planets) {
      if (planet.house === house) evidence.push(`${planet.name} in house ${house}`);
    }
    if (lord && lord.name !== ascendantLord && lord.house === 1) {
      evidence.push(`${houseLord}, ruler of house ${house}, in the ascendant house`);
    }
    if (muntha !== undefined && houseOf(muntha, chart.ascendant) === house) {
      evidence.push(`Muntha in house ${house}`);
    }
    return { house, evidence };
  });
}

export function travelSignals(annual, monthly) {
  const active = (rows, house) => rows.some(row => row.house === house && row.evidence.length);
  const a9 = active(annual, 9), a12 = active(annual, 12);
  const m9 = active(monthly, 9), m12 = active(monthly, 12);
  const foreign = (a9 || m9) && (a12 || m12) && (m9 || m12);
  const domestic = active(monthly, 3);
  return travelTypes.flatMap(type => {
    const isForeign = type.id === 'foreign-travel';
    if (!(isForeign ? foreign : domestic)) return [];
    const strong = isForeign ? (a9 && m12) || (a12 && m9) : active(annual, 3);
    const relevant = row => isForeign ? row.house === 9 || row.house === 12 : row.house === 3;
    const evidence = [
      ...annual.filter(relevant).flatMap(row => row.evidence.map(item => `Annual: ${item}`)),
      ...monthly.filter(relevant).flatMap(row => row.evidence.map(item => `Solar month: ${item}`))
    ];
    return [{
      type: type.id,
      label: type.label,
      strength: strong ? 'Strong' : 'Mild',
      score: evidence.length,
      evidence,
      title: type.label + ' signal',
      detail: isForeign
        ? 'The return charts activate the long journey and away-from-home themes.'
        : 'The return charts activate the short journey theme. This may cover travel within your country.'
    }];
  });
}

export function selectTravelWindows(candidates) {
  const chosen = [];
  for (const strength of ['Strong', 'Mild']) {
    for (const era of ['past', 'future']) {
      const sorted = candidates.filter(event => event.strength === strength && event.era === era)
        .sort((a, b) => b.score - a.score || +a.start - +b.start);
      let count = 0;
      for (const event of sorted) {
        if (chosen.some(existing => Math.abs(+event.start - +existing.start) < 60 * DAY)) continue;
        chosen.push(event);
        if (++count === 2) break;
      }
    }
  }
  return chosen.sort((a, b) => +a.start - +b.start);
}
