// One store's view of the plan's open gaps: who the store can reach, when, and what it does.
// Reads only claims before asOf, like the rest of the desk. Synthetic data only.
import { FIX_TEXT } from './desk.js';

export const MAIL = 'Plan mail service';
export const COUNTER_DAYS = 30; // a refill due in the next 30 days brings the member to the counter
const RECENT_DAYS = 120; // a fill here in the last 120 days makes the store "theirs"

const ADH = { D08: 'Diabetes adherence', D09: 'Blood pressure adherence', D10: 'Statin adherence' };
export const GAP_LABEL = { ...ADH, D11: 'Statin use in diabetes', D12: 'Opioid with benzodiazepine', D13: 'Two anticholinergics' };

// What the store does about each gap at the counter.
export function counterAction(gap) {
  if (gap.measure in ADH) {
    if (gap.lane === 'new-start') return 'Ask how the first fill went.';
    return FIX_TEXT[gap.fix]?.label || 'Ask what makes refills hard';
  }
  if (gap.measure === 'D11') return 'Ask about a statin, then request one from the prescriber';
  return 'Safety fax to the prescriber';
}

// Every open gap for a member: adherence measures a call can still help, new starts, and safety items.
export function memberGaps(analysis, safetyItems) {
  const gaps = [];
  for (const r of analysis.measures) {
    if (r.lane === 'save' || r.lane === 'new-start') gaps.push({ measure: r.measure, lane: r.lane, fix: r.fix });
  }
  for (const it of safetyItems || []) if (!gaps.some((g) => g.measure === it.measure)) gaps.push({ measure: it.measure, lane: 'safety' });
  return gaps;
}

// The synthetic generator files every safety-measure drug (opioid, benzodiazepine, anticholinergic)
// at one placeholder store. Those fills say nothing about where a member shops, so reach ignores them.
const PLACEHOLDER = new Set(['opioid', 'benzo', 'ach']);
const counts = (f) => !(typeof f.measure === 'string' && PLACEHOLDER.has(f.measure));

// Where and when the store next sees a member. Counter: a refill here falls due in the next 30 days.
export function reachAt(store, fills, asOf) {
  const here = fills.filter((f) => counts(f) && f.pharmacy === store && f.day < asOf && asOf - f.day <= RECENT_DAYS);
  if (!here.length) return { reach: 'elsewhere', next: null, drug: null };
  // Latest fill per drug at this store, and the day its supply runs out.
  const byDrug = new Map();
  for (const f of here) byDrug.set(f.ingredients[0], f);
  const due = [...byDrug.values()].map((f) => ({ day: f.day + f.daysSupply, drug: f.ingredients[0] })).sort((a, b) => a.day - b.day);
  // Due back soon: the member will likely walk in. Already overdue here: they are not coming on
  // their own, so the store calls. Not due for a month or more: the store calls too.
  const soon = due.find((d) => d.day >= asOf && d.day - asOf <= COUNTER_DAYS);
  if (soon) return { reach: 'counter', next: soon.day, drug: soon.drug };
  return { reach: 'phone', next: due[0].day, drug: due[0].drug, overdue: due[0].day < asOf };
}

export function storeView({ members, analyses, safetyByMember, asOf }) {
  const withGaps = [];
  for (const m of members) {
    const a = analyses.get(m.id);
    const gaps = memberGaps(a, safetyByMember.get(m.id));
    if (gaps.length) withGaps.push({ m, gaps });
  }
  // The retail store with the most members who have an open gap.
  const tally = new Map();
  for (const { m } of withGaps) {
    for (const p of new Set(m.fills.filter((f) => counts(f) && f.day < asOf && asOf - f.day <= RECENT_DAYS).map((f) => f.pharmacy))) {
      if (p !== MAIL) tally.set(p, (tally.get(p) || 0) + 1);
    }
  }
  const store = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  const rows = withGaps.map(({ m, gaps }) => ({ id: m.id, name: m.name, age: m.age, gaps, ...reachAt(store, m.fills, asOf) }));
  const count = (reach) => rows.filter((r) => r.reach === reach).length;
  const byGap = {};
  for (const r of rows) for (const g of r.gaps) {
    byGap[g.measure] ||= { counter: 0, phone: 0, elsewhere: 0 };
    byGap[g.measure][r.reach]++;
  }
  const counter = rows.filter((r) => r.reach === 'counter').sort((a, b) => a.next - b.next || b.gaps.length - a.gaps.length);
  return {
    store,
    planMembersWithGaps: rows.length,
    reach: { counter: count('counter'), phone: count('phone'), elsewhere: count('elsewhere') },
    byGap,
    counter: counter.map((r) => ({ ...r, actions: r.gaps.map((g) => ({ measure: g.measure, label: GAP_LABEL[g.measure], lane: g.lane, action: counterAction(g) })) })),
  };
}
