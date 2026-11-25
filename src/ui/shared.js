// Helpers for the plan and store views. Every number comes from desk.json (synthetic plan) or CMS's 2027 ratings.
import { dayLabel } from './format.js';

// Plan-wide reach segments in a fixed order, with the words each direction uses.
export const REACH = [
  { key: 'walk-in', tone: 'walk', label: 'have a refill due at a pharmacy counter in the next 30 days', short: 'At a counter within 30 days' },
  { key: 'store-call', tone: 'call', label: 'use a pharmacy but are overdue or on 90-day fills', short: 'Use a pharmacy, overdue or on 90 days' },
  { key: 'mail', tone: 'quiet', label: 'use mail order only', short: 'Mail order only' },
  { key: 'none', tone: 'quiet', label: 'have no recent fill', short: 'No recent fill' },
];

export const n = (x) => Number(x || 0).toLocaleString('en-US');

// 2026 starts on a Thursday, so day 0 (January 1) is weekday 4 with Sunday as 0.
export const weekday = (day) => (4 + day) % 7;
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dayFull = (day, asOf) => `${day === asOf ? 'Today' : WEEKDAYS[weekday(day)]}, ${dayLabel(day)}`;

export const savesLine = (m, safety) => {
  if (m.star >= 5) return 'At 5 stars';
  const next = m.star + 1;
  if (safety && !m.higherIsBetter) return `${m.toNext} fewer members to reach ${next} stars`;
  if (safety) return `${m.toNext} more members to reach ${next} stars`;
  return `${m.toNext} saves to ${next} stars`;
};
