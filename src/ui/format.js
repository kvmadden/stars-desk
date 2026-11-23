const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

export function dayLabel(day) {
  if (day == null) return '';
  if (day >= 365) return 'Dec 31+';
  let m = 11;
  while (m > 0 && STARTS[m] > day) m--;
  return `${MONTHS[m]} ${day - STARTS[m] + 1}`;
}
export const MONTH_STARTS = STARTS;
export const MONTH_NAMES = MONTHS;
export const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;
export const firstName = (name) => name.split(' ')[0];

export const BARRIER_LABEL = {
  forgetful: 'Refill routine',
  cost: 'Cost',
  logistics: 'Pharmacy logistics',
  sideEffect: 'Stopped early',
  switched: 'Therapy changed',
  unclear: 'No clear pattern',
};

export const LANES = [
  { key: 'save', label: 'Call list', hint: 'Can still reach 80% and a call is likely to help' },
  { key: 'prescriber', label: 'Ask the prescriber', hint: 'Claims suggest the prescriber changed therapy' },
  { key: 'lost', label: 'Lost for 2026', hint: 'Cannot reach 80% this year, still worth a clinical call' },
  { key: 'new-start', label: 'New starts', hint: 'One fill so far, not in the measure yet' },
];
