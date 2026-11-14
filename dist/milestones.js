import { houseOf } from './engine.js';
import { tajikaAspects } from './forecast.js';
import { kpTimingCheck } from './kp.js';

// Modern event definitions based on the house topics in Hāyanaratna 6.5, 6.6 and 6.11.
// Require return-chart agreement and an event-specific secondary signal.
const rules = [
  {
    id: 'home-property', label: 'Home or property milestone', minAge: 18,
    primary: [4], secondary: [2, 11], significators: ['Venus', 'Jupiter', 'Mars'],
    title: 'A committed home or property change',
    detail: 'A window for buying property, taking possession, or moving into a new long-term home.',
    check: 'Count a completed property purchase, possession, or moving into a new main home. Browsing listings, renovation plans and temporary stays do not count.'
  },
  {
    id: 'recognition', label: 'Recognition', minAge: 12,
    primary: [10], secondary: [11], significators: ['Sun', 'Jupiter'],
    title: 'Visible recognition for your work',
    detail: 'A window for an award, formal distinction, or a public invitation that recognizes your work.',
    check: 'Count an official award, a published distinction, or being selected to speak or present because of your work. Routine praise, pay rises and self-published announcements do not count.'
  },
  {
    id: 'education', label: 'Education milestone', minAge: 12,
    primary: [5, 9], secondary: [11], significators: ['Mercury', 'Jupiter'],
    title: 'A formal education milestone',
    detail: 'A window for a competitive admission, graduation, or a substantial qualification.',
    check: 'Count the date you received a formal admission offer, graduated, or earned a substantial credential. Routine study and ordinary course attendance do not count.'
  }
];

const rulers = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

export function milestoneEvidence(chart, muntha) {
  const planets = chart.planets.filter(planet => planet.name !== 'Rahu' && planet.name !== 'Ketu');
  const aspects = tajikaAspects(chart);
  const munthaHouse = muntha === undefined ? null : houseOf(muntha, chart.ascendant);
  return Object.fromEntries(rules.map(rule => {
    const core = [], corroboration = [];
    // Foundational study in the annual fourth house still needs a fifth- or
    // ninth-house signal in the solar month for a formal milestone.
    if (rule.id === 'education' && muntha !== undefined) {
      for (const planet of planets) {
        if (planet.house === 4 && rule.significators.includes(planet.name)) {
          core.push(`${planet.name} in house 4 supports foundational study`);
        }
      }
    }
    for (const house of rule.primary) {
      const ruler = rulers[(chart.ascSign + house - 1) % 12];
      for (const planet of planets) {
        if (planet.house === house && rule.significators.includes(planet.name)) {
          core.push(`${planet.name} in house ${house}`);
        }
        else if (planet.name === ruler && [house, 11].includes(planet.house)) {
          core.push(`${ruler}, ruler of house ${house}, in house ${planet.house}`);
        }
      }
      if (house === munthaHouse && house !== 4) core.push(`Muntha in house ${house}`);
      for (const {a, b, kind} of aspects) {
        if (kind === 'friendly' && ((a === ruler && rule.significators.includes(b)) ||
            (b === ruler && rule.significators.includes(a)))) {
          core.push(`Friendly aspect between ${a} and ${b} supports the ruler of house ${house}`);
        }
      }
    }
    for (const planet of planets) {
      if (rule.secondary.includes(planet.house) &&
          (rule.significators.includes(planet.name) || ['Jupiter','Venus'].includes(planet.name))) {
        corroboration.push(`${planet.name} in house ${planet.house}`);
      }
    }
    if (rule.secondary.includes(munthaHouse)) corroboration.push(`Muntha in house ${munthaHouse}`);
    return [rule.id, { core: [...new Set(core)], corroboration }];
  }));
}

export function milestoneCandidates({ natal, annual, monthly, age, start, end, solarYear, solarMonth, era }) {
  return rules.flatMap(rule => {
    if (age < rule.minAge) return [];
    const a = annual[rule.id], m = monthly[rule.id];
    if (!a.core.length || !m.core.length) return [];
    const kp = kpTimingCheck(natal, rule.id, new Date((+start + +end) / 2));
    const secondaryCount = a.corroboration.length + m.corroboration.length;
    if (!secondaryCount && kp.support < 2) return [];
    const strong = kp.support === 2 || Boolean(kp.support && secondaryCount);
    const evidence = [
      ...a.core.concat(a.corroboration).map(item => `Annual: ${item}`),
      ...m.core.concat(m.corroboration).map(item => `Solar month: ${item}`)
    ];
    return [{
      id: `milestone-${rule.id}-${solarYear}-${solarMonth}`,
      type: rule.id, label: rule.label, title: rule.title, detail: rule.detail, check: rule.check,
      start, end, age, era, solarYear, kp, evidence,
      strength: strong ? 'Strong' : 'Mild',
      score: Math.min(a.core.length, 3) + 2 * Math.min(m.core.length, 3) +
        Math.min(secondaryCount, 2) + kp.support
    }];
  });
}

export function selectMilestones(candidates) {
  const groups = {};
  for (const {id} of rules) {
    const windows = [];
    for (const era of ['past', 'future']) {
      const ranked = candidates.filter(event => event.type === id && event.era === era)
        .sort((a, b) => Number(b.strength === 'Strong') - Number(a.strength === 'Strong') ||
          b.score - a.score || +a.start - +b.start);
      const years = new Set();
      for (const event of ranked) {
        if (years.has(event.solarYear)) continue;
        windows.push(event);
        years.add(event.solarYear);
        if (years.size === 3) break;
      }
    }
    groups[id] = windows.sort((a, b) => +a.start - +b.start);
  }
  return groups;
}
