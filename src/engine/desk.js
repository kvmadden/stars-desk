// The desk: reads only claims known before the as-of day, never the hidden barrier.
// 1. Status per measure (PDC to date, gap budget, last day to fill).
// 2. A pharmacist rulebook guesses the barrier and the fix.
// 3. A simple risk model estimates who misses 80% without help, and how much a call changes that.
// 4. Members are ranked by expected saves (one member call covers all of their adherence drugs).
import { ADHERENCE, YEAR_DAYS } from './measures.js';
import { statusAsOf, targetFills } from './pdc.js';
import { DRUGS, SWITCH_TARGETS } from './catalog.js';

// The desk's own assumptions about how often a matched call changes refill behavior.
// These are planning guesses, written down so they can be argued with. See docs/METHOD.md.
export const DESK_BELIEFS = {
  pFix: { forgetful: 0.5, cost: 0.45, logistics: 0.5, sideEffect: 0.35, unclear: 0.2, switched: 0 },
  populationLate: 2.5, // mean days late per refill across the plan, used to shrink thin histories
  shrinkFills: 3,
};

export const FIX_TEXT = {
  ninety: { label: 'Move to 90 days with auto-refill', effect: 'ninety' },
  steady: { label: 'Set up auto-refill', effect: 'steady' },
  sync: { label: 'Sync refills at one pharmacy', effect: 'steady' },
  costfix: { label: 'Lower-cost option and cost help', effect: 'costfix' },
  restart: { label: 'Clinical call about side effects', effect: 'restart' },
  confirm: { label: 'Confirm the change with the prescriber', effect: 'none' },
  reminder: { label: 'Refill reminder', effect: 'once' },
};

export function features(measure, member, asOf, status) {
  const known = member.fills.filter((f) => f.day < asOf);
  const tf = targetFills(measure, known);
  const lates = [];
  for (let i = 1; i < tf.length; i++) lates.push(tf[i].day - (tf[i - 1].day + tf[i - 1].daysSupply));
  const positive = lates.map((x) => Math.max(0, x));
  const rawMean = positive.length ? positive.reduce((a, b) => a + b, 0) / positive.length : 0;
  const k = DESK_BELIEFS.shrinkFills;
  const meanLate = (rawMean * positive.length + DESK_BELIEFS.populationLate * k) / (positive.length + k);
  const last = tf[tf.length - 1];
  const copay30 = last ? (last.copay / last.daysSupply) * 30 : 0;
  const drug = last?.ingredients[0];
  const tier = DRUGS[drug]?.tier ?? 1;
  const capReached = known.some((f) => f.copay === 0 && (DRUGS[f.ingredients[0]]?.tier ?? 1) >= 3);
  const recent = tf.slice(-6);
  const pharmacies = new Set(recent.map((f) => f.pharmacy)).size;
  const switchTo = SWITCH_TARGETS[measure.id] || [];
  const switchFill = known.find((f) => switchTo.some((s) => f.ingredients.includes(s)) && last && f.day >= last.day - 15);
  const newStart = status.ipsd > 45;
  const daysLate = status.daysSinceRunOut;
  const maxLate = positive.length ? Math.max(...positive) : 0;
  return {
    fills: tf.length, meanLate, rawMean, maxLate, lates, copay30, tier, drug, capReached, pharmacies,
    switchFill: switchFill ? { day: switchFill.day, drug: switchFill.ingredients[0] } : null,
    newStart, daysLate, ds: last?.daysSupply ?? 30, lastFill: last,
  };
}

export function inferBarrier(f) {
  const why = [];
  if (f.switchFill && f.daysLate > 0) {
    why.push(`Filled ${f.switchFill.drug} after the last ${f.drug} fill`);
    return { barrier: 'switched', fix: 'confirm', why };
  }
  if (f.fills <= 4 && f.daysLate > 20) {
    why.push(`Only ${f.fills} fill${f.fills === 1 ? '' : 's'}, then ${f.daysLate} days without supply`);
    if (f.newStart) why.push('Started this year');
    return { barrier: 'sideEffect', fix: 'restart', why };
  }
  if (f.copay30 >= 40 && f.rawMean > 4) {
    why.push(`$${Math.round(f.copay30)} a month for ${f.drug}`);
    why.push(`Refills average ${Math.round(f.rawMean)} days late`);
    return { barrier: 'cost', fix: 'costfix', why };
  }
  if (f.pharmacies >= 2 && f.rawMean > 3) {
    why.push(`${f.pharmacies} pharmacies in the last ${Math.min(6, f.fills)} fills`);
    why.push(`Refills average ${Math.round(f.rawMean)} days late`);
    return { barrier: 'logistics', fix: 'sync', why };
  }
  if (f.rawMean > 3.5) {
    why.push(`Refills average ${Math.round(f.rawMean)} days late`);
    if (f.ds === 30) why.push('Still on 30-day fills');
    return { barrier: 'forgetful', fix: f.ds === 30 ? 'ninety' : 'steady', why };
  }
  why.push('No clear pattern in the claims');
  return { barrier: 'unclear', fix: 'reminder', why };
}

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

// Probability the member finishes under 80% with no call, from the desk's simple model.
export function pMiss(status, f, barrier) {
  if (status.state === 'lost' || status.state === 'single-fill-lost') return 1;
  if (status.state === 'safe-if-supplied') return 0.01;
  const afterRunOut = Math.max(0, YEAR_DAYS - status.runOutDay);
  const refills = Math.max(0, Math.ceil(afterRunOut / f.ds));
  let expectedGap;
  if (barrier === 'sideEffect' || barrier === 'switched') expectedGap = afterRunOut * 0.85;
  else expectedGap = f.meanLate * refills + (f.daysLate > 0 ? f.meanLate * 0.8 : 0);
  const spread = 3 + 0.5 * Math.sqrt(Math.max(1, refills)) * Math.max(3, f.maxLate * 0.5);
  return sigmoid((expectedGap - status.budget) / spread - 0.4); // offset fit on dev seeds 101 to 103
}

export function laneFor(s, barrier, pm) {
  if (s.state === 'lost') return 'lost';
  if (s.state === 'single-fill' || s.state === 'single-fill-lost') return 'new-start';
  if (s.state === 'safe-if-supplied') return 'safe';
  if (barrier === 'switched') return 'prescriber';
  if (pm < 0.1) return 'safe';
  return 'save';
}

export function analyzeMember(member, asOf) {
  const measures = [];
  for (const meas of Object.values(ADHERENCE)) {
    const s = statusAsOf(meas, member, asOf);
    if (!s) continue;
    const row = { measure: meas.id, status: s };
    if (['open', 'lost', 'safe-if-supplied', 'single-fill', 'single-fill-lost'].includes(s.state)) {
      const f = features(meas, member, asOf, s);
      const b = inferBarrier(f);
      const pm = pMiss(s, f, b.barrier);
      const pFix = DESK_BELIEFS.pFix[b.barrier] ?? 0.2;
      // A single-fill member is not yet in the denominator. A second fill adds them.
      const savable = s.state === 'open';
      row.features = f;
      row.barrier = b.barrier;
      row.fix = b.fix;
      row.why = b.why;
      row.pMiss = pm;
      row.uplift = savable ? pm * pFix : 0;
      row.lane = laneFor(s, b.barrier, pm);
    } else {
      row.lane = s.state === 'excluded' ? 'excluded' : 'not-counted';
    }
    measures.push(row);
  }
  const score = measures.reduce((sum, r) => sum + (r.lane === 'save' ? r.uplift * ADHERENCE[r.measure].weight : 0), 0);
  const open = measures.filter((r) => r.lane === 'save');
  const callBy = open.length ? Math.min(...open.map((r) => r.status.mustFillBy)) : null;
  return { id: member.id, measures, score, callBy };
}

// Pick the K members with the highest expected value, then call in order of the earliest deadline.
export function deskCallList(analyses, k) {
  const chosen = analyses.filter((a) => a.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  return chosen.sort((a, b) => (a.callBy ?? 999) - (b.callBy ?? 999)).map((a) => a.id);
}
