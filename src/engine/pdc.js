// Proportion of days covered, following the CMS Attachment L method:
// - fills of the same target ingredient shift forward when they overlap (supply accumulates),
// - different target ingredients do not shift, a day is covered if any target ingredient has supply,
// - inpatient and SNF stay days (discharge day included) leave both numerator and denominator,
//   and supply is not used up during a stay, so it carries over to after discharge.
import { ADHERENCE, YEAR_DAYS, PDC_THRESHOLD, MIN_TREATMENT_DAYS } from './measures.js';

// fills: [{ day, ingredients: [string], daysSupply }], days are 0-based day of year.
// stays: [{ start, end }] inclusive.
export function targetFills(measure, fills) {
  const set = new Set(measure.ingredients);
  return fills
    .map((f) => ({ ...f, targets: f.ingredients.filter((i) => set.has(i)) }))
    .filter((f) => f.targets.length > 0)
    .sort((a, b) => a.day - b.day);
}

export function stayDaySet(stays, from, to) {
  const s = new Set();
  for (const st of stays || []) {
    for (let d = Math.max(st.start, from); d <= Math.min(st.end, to); d++) s.add(d);
  }
  return s;
}

// Walk days from start to endExclusive. Returns covered days, eligible (non-stay) days, and the supply
// left per ingredient at endExclusive.
export function walkCoverage(tFills, start, endExclusive, stays) {
  const supply = new Map();
  const stayDays = stayDaySet(stays, start, endExclusive - 1);
  let fi = 0;
  let covered = 0;
  let eligible = 0;
  const coveredDays = [];
  for (let d = start; d < endExclusive; d++) {
    while (fi < tFills.length && tFills[fi].day <= d) {
      const f = tFills[fi];
      if (f.day >= start) for (const ing of f.targets) supply.set(ing, (supply.get(ing) || 0) + f.daysSupply);
      fi++;
    }
    if (stayDays.has(d)) continue;
    eligible++;
    let any = false;
    for (const [ing, left] of supply) {
      if (left > 0) {
        any = true;
        supply.set(ing, left - 1);
      }
    }
    if (any) {
      covered++;
      coveredDays.push(d);
    }
  }
  return { covered, eligible, supply, stayDays: stayDays.size, coveredDays };
}

// Full-year PDC once the year is over. Returns null when the member is not in the denominator.
export function finalPdc(measure, member) {
  const tf = targetFills(measure, member.fills);
  if (tf.length === 0) return null;
  const ipsd = tf[0].day;
  const end = member.endDay ?? YEAR_DAYS; // exclusive
  if (end - ipsd < MIN_TREATMENT_DAYS) return null;
  if (new Set(tf.map((f) => f.day)).size < 2) return null;
  if (isExcluded(measure, member)) return null;
  const w = walkCoverage(tf, ipsd, end, member.stays);
  return w.eligible ? w.covered / w.eligible : null;
}

export function isExcluded(measure, member) {
  if (member.hospice || member.esrd) return true;
  if (measure.excludingIngredients?.length) {
    const ex = new Set(measure.excludingIngredients);
    return member.fills.some((f) => f.ingredients.some((i) => ex.has(i)));
  }
  return false;
}

export function exclusionReason(measure, member) {
  if (member.hospice) return 'Hospice';
  if (member.esrd) return 'ESRD or dialysis';
  if (measure.excludingIngredients?.length) {
    const ex = new Set(measure.excludingIngredients);
    if (member.fills.some((f) => f.ingredients.some((i) => ex.has(i)))) return measure.exclusionLabel;
  }
  return null;
}

// Where a member stands on asOfDay (fills on or after asOfDay are not yet known).
export function statusAsOf(measure, member, asOfDay) {
  const known = { ...member, fills: member.fills.filter((f) => f.day < asOfDay) };
  const tf = targetFills(measure, known.fills);
  if (tf.length === 0) return null;
  const ipsd = tf[0].day;
  const end = member.endDay ?? YEAR_DAYS;
  const reason = exclusionReason(measure, known);
  const base = { measure: measure.id, ipsd, fills: tf.length, uniqueDates: new Set(tf.map((f) => f.day)).size };
  if (reason) return { ...base, state: 'excluded', reason };
  if (end - ipsd < MIN_TREATMENT_DAYS) return { ...base, state: 'too-late', reason: 'Treatment period under 91 days' };

  const w = walkCoverage(tf, ipsd, asOfDay, known.stays);
  const onHand = Math.max(0, ...w.supply.values());
  // Future stays are unknown, so the period is projected with no further stays.
  const periodDays = w.eligible + (end - asOfDay);
  const needCovered = Math.ceil(PDC_THRESHOLD * periodDays - 1e-9);
  const allowedUncovered = periodDays - needCovered;
  const uncoveredSoFar = w.eligible - w.covered;
  const budget = allowedUncovered - uncoveredSoFar; // gap days still allowed from asOfDay on
  const daysLeft = end - asOfDay;
  const runOutDay = asOfDay + onHand;
  const mustFillBy = runOutDay + budget; // last fill day that still reaches 80% with perfect refills after
  const bestCovered = w.covered + daysLeft; // perfect refills from today
  const lastFill = tf[tf.length - 1];
  const lastFillEnd = lastFill.day + lastFill.daysSupply;
  const out = {
    ...base,
    pdcToDate: w.eligible ? w.covered / w.eligible : 0,
    coveredSoFar: w.covered,
    eligibleSoFar: w.eligible,
    onHand,
    periodDays,
    needCovered,
    budget,
    runOutDay,
    mustFillBy,
    bestPdc: Math.min(1, bestCovered / periodDays),
    daysSinceRunOut: onHand > 0 ? 0 : asOfDay - lastFillEnd,
    coveredDays: w.coveredDays,
    stayDaysSoFar: w.stayDays,
  };
  if (base.uniqueDates < 2) out.state = budget < 0 ? 'single-fill-lost' : 'single-fill';
  else if (budget < 0) out.state = 'lost';
  else if (mustFillBy >= end) out.state = 'safe-if-supplied';
  else out.state = 'open';
  return out;
}
