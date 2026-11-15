import { buildFamilyReading, checkFamilyCounts } from './family.js';

const panel = document.querySelector('#family-check');
const form = panel.querySelector('form');
const result = panel.querySelector('[role=status]');
let currentReading;
let currentProfile;

const pair = ({ male, female }, first, second) => `${male} ${first}, ${female} ${second}`;

function formatSplits(group, first, second) {
  const primary = pair(group.estimate, first, second);
  const alternatives = group.alternatives.map(option => pair(option, first, second));
  return alternatives.length ? `${primary}. Alternate splits: ${alternatives.join(' or ')}.` : `${primary}.`;
}

export function renderFamilyCheck(chart, profile) {
  currentReading = buildFamilyReading(chart);
  if (profile !== currentProfile) {
    form.reset();
    result.textContent = '';
    currentProfile = profile;
  }
  const { siblings, paternal, maternal, relatives, children, maternalCrossCheck } = currentReading;
  const values = {
    brothers: siblings.estimate.male,
    sisters: siblings.estimate.female,
    children: String(children.total),
    uncles: relatives.estimate.male,
    aunts: relatives.estimate.female
  };
  for (const [key, value] of Object.entries(values)) {
    panel.querySelector(`[data-family-estimate="${key}"]`).textContent = value;
  }
  const points = ({ sign, points }) => `${sign} · ${points.join(', ') || 'no contributors'}`;
  panel.querySelector('#family-totals').textContent = `Chart totals: ${siblings.total} siblings and ${relatives.total} uncles and aunts combined.`;
  panel.querySelector('#family-sibling-splits').textContent = formatSplits(siblings, 'brothers', 'sisters');
  panel.querySelector('#family-paternal-splits').textContent = formatSplits(paternal, 'uncles', 'aunts');
  panel.querySelector('#family-maternal-splits').textContent = formatSplits(maternal, 'uncles', 'aunts');
  panel.querySelector('#family-evidence').textContent = [
    `Siblings (${siblings.total} combined), 3rd from Mars: ${points(siblings)}.`,
    `Father’s siblings (${paternal.total}), 9th from Sun: ${points(paternal)}.`,
    `Mother’s siblings (${maternal.total}), 4th from Moon: ${points(maternal)}.`,
    `Maternal relatives, 4th from Mercury: ${points(maternalCrossCheck)}. This rule covers a broader group.`,
    `Children, 5th from Jupiter: ${points(children)}. Excluded for sign dignity: ${children.excluded.join(', ') || 'none'}.`,
    'The main estimate assigns points from the Sun, Mars and Jupiter to brothers, and the remaining points to sisters. Alternate splits show how Mercury, Saturn and Lagna points can change the count.'
  ].join(' ');
  panel.hidden = false;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const actual = Object.fromEntries(
    [...new FormData(form)]
      .filter(([, value]) => value !== '')
      .map(([name, value]) => [name, Number(value)])
  );
  result.textContent = checkFamilyCounts(currentReading, actual).join(' ') ||
    'Enter at least one count to compare.';
});
