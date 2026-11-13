import { buildFamilyReading, checkFamilyCounts } from './family.js';

const panel = document.querySelector('#family-check');
const form = panel.querySelector('form');
const result = panel.querySelector('[role=status]');
let currentReading;
let currentProfile;

const range = ([min, max]) => min === max ? String(min) : `${min}–${max}`;

export function renderFamilyCheck(chart, profile) {
  currentReading = buildFamilyReading(chart);
  if (profile !== currentProfile) {
    form.reset();
    result.textContent = '';
    currentProfile = profile;
  }
  const { siblings, paternal, maternal, relatives, children, maternalCrossCheck } = currentReading;
  const values = {
    brothers: range(siblings.male),
    sisters: range(siblings.female),
    children: String(children.total),
    uncles: range(relatives.male),
    aunts: range(relatives.female)
  };
  for (const [key, value] of Object.entries(values)) {
    panel.querySelector(`[data-family-estimate="${key}"]`).textContent = value;
  }
  const points = ({ sign, points }) => `${sign} · ${points.join(', ') || 'no contributors'}`;
  panel.querySelector('#family-totals').textContent = `Chart totals: ${siblings.total} siblings and ${relatives.total} uncles and aunts combined. The ranges share the unassigned points within each total.`;
  panel.querySelector('#family-evidence').textContent = [
    `Siblings (${siblings.total} combined), 3rd from Mars: ${points(siblings)}.`,
    `Father’s siblings (${paternal.total}), 9th from Sun: ${points(paternal)}.`,
    `Mother’s siblings (${maternal.total}), 4th from Moon: ${points(maternal)}.`,
    `Maternal relatives, 4th from Mercury: ${points(maternalCrossCheck)}. This rule covers a broader group.`,
    `Children, 5th from Jupiter: ${points(children)}. Excluded for sign dignity: ${children.excluded.join(', ') || 'none'}.`,
    'Mercury, Saturn and Lagna points count toward the total. They are left unassigned in the split.'
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
