// Play the rest of the year forward under a call list and count who finishes at or above 80%.
// The hidden barrier decides whether a call works. The desk never sees it.
import { realizeFills } from '../src/engine/world.js';
import { ADHERENCE, starFor } from '../src/engine/measures.js';
import { finalPdc, statusAsOf } from '../src/engine/pdc.js';
import { mulberry32, hashSeed } from '../src/engine/rng.js';
import { analyzeMember, deskCallList, FIX_TEXT } from '../src/engine/desk.js';

// Which delivered fix actually changes behavior, given the true barrier.
const WORKS = {
  forgetful: ['ninety', 'steady'],
  cost: ['costfix'],
  logistics: ['steady', 'ninety'],
  sideEffect: ['restart'],
  switched: [],
  steady: ['once', 'steady', 'ninety'],
  mixed: ['ninety', 'steady', 'costfix'], // either fix helps, but only partly
  unexplained: [],
};
const TRUE_FIX = { forgetful: 'ninety', cost: 'costfix', logistics: 'steady', sideEffect: 'restart', switched: 'none', steady: 'once', mixed: 'ninety', unexplained: 'once' };

// truth: { reach, pFix, pGeneric, pDiscover }
// pDiscover: chance the pharmacist finds the real barrier during the call even without a pre-call guess.
export function callEffect(member, plan, deliveredEffect, truth, rng) {
  if (rng() >= truth.reach) return 'none';
  const barrier = plan.archetype;
  if (barrier === 'switched') return 'none';
  let effect = deliveredEffect;
  if (!(WORKS[barrier] || []).includes(effect) && rng() < truth.pDiscover) effect = TRUE_FIX[barrier];
  if ((WORKS[barrier] || []).includes(effect)) {
    if (barrier === 'steady') return 'once';
    return rng() < truth.pFix * (barrier === 'mixed' ? 0.6 : 1) ? effect : 'once';
  }
  return rng() < truth.pGeneric ? 'once' : 'none';
}

export function scoreYear(world, P, calls, opts) {
  const { asOf, perDay, truth, deliveredFor } = opts;
  const callDay = new Map(calls.map((id, i) => [id, asOf + Math.floor(i / perDay)]));
  const byMeasure = {};
  for (const meas of Object.values(ADHERENCE)) byMeasure[meas.id] = { num: 0, den: 0 };
  for (const m of world.members) {
    let fills = m.fills;
    const day = callDay.get(m.id);
    if (day != null) {
      const rng = mulberry32(hashSeed(world.seed, m.id, 'call'));
      const interventions = {};
      for (const [meas, plan] of Object.entries(m.hidden.plans)) {
        const delivered = deliveredFor(m.id, meas);
        interventions[meas] = { day, effect: callEffect(m, plan, delivered, truth, rng) };
      }
      fills = realizeFills(m, P, interventions);
    }
    const mm = { ...m, fills };
    for (const meas of Object.values(ADHERENCE)) {
      const p = finalPdc(meas, mm);
      if (p == null) continue;
      byMeasure[meas.id].den++;
      if (p >= 0.8) byMeasure[meas.id].num++;
    }
  }
  return byMeasure;
}

// Baseline call lists that a plan might run today.
export function baselines(world, asOf) {
  const rows = [];
  for (const m of world.members) {
    let minPdc = null;
    let maxLate = 0;
    let minBudget = null;
    for (const meas of Object.values(ADHERENCE)) {
      const s = statusAsOf(meas, m, asOf);
      if (!s || s.state === 'excluded' || s.state === 'too-late' || s.uniqueDates < 2) continue;
      if (minPdc == null || s.pdcToDate < minPdc) minPdc = s.pdcToDate;
      maxLate = Math.max(maxLate, s.daysSinceRunOut);
      if (s.state === 'open' && (minBudget == null || s.budget < minBudget)) minBudget = s.budget;
    }
    rows.push({ id: m.id, minPdc, maxLate, minBudget });
  }
  const under = rows.filter((r) => r.minPdc != null && r.minPdc < 0.8);
  return {
    lowestFirst: [...under].sort((a, b) => a.minPdc - b.minPdc).map((r) => r.id),
    closestFirst: [...under].sort((a, b) => b.minPdc - a.minPdc).map((r) => r.id),
    mostOverdue: rows.filter((r) => r.maxLate > 0).sort((a, b) => b.maxLate - a.maxLate).map((r) => r.id),
    // What a capable adherence team already does: skip members who cannot reach 80%,
    // and call those with the fewest allowable missed days left first.
    gapBudget: rows.filter((r) => r.minBudget != null).sort((a, b) => a.minBudget - b.minBudget).map((r) => r.id),
  };
}

export function runWorld(world, P, opts) {
  const { asOf, k, perDay, truth } = opts;
  const analyses = opts.analyses || world.members.map((m) => analyzeMember(m, asOf));
  const byId = new Map(analyses.map((a) => [a.id, a]));
  const deskFix = (id, meas) => {
    const r = byId.get(id)?.measures.find((x) => x.measure === meas);
    return r?.fix ? FIX_TEXT[r.fix].effect : 'once';
  };
  const generic = () => 'once';
  const b = opts.baselines || baselines(world, asOf);
  const desk = deskCallList(analyses, k);
  const arms = {
    none: { calls: [], deliveredFor: generic },
    lowestFirst: { calls: b.lowestFirst.slice(0, k), deliveredFor: generic },
    closestFirst: { calls: b.closestFirst.slice(0, k), deliveredFor: generic },
    mostOverdue: { calls: b.mostOverdue.slice(0, k), deliveredFor: generic },
    gapBudget: { calls: b.gapBudget.slice(0, k), deliveredFor: generic },
    deskOrderOnly: { calls: desk, deliveredFor: generic },
    desk: { calls: desk, deliveredFor: deskFix },
  };
  const out = {};
  for (const [name, arm] of Object.entries(arms)) {
    if (opts.only && !opts.only.includes(name)) continue;
    out[name] = { calls: arm.calls.length, measures: scoreYear(world, P, arm.calls, { asOf, perDay, truth, deliveredFor: arm.deliveredFor }) };
  }
  // Barrier guesses against the hidden truth, for members the desk would call.
  const confusion = {};
  for (const id of desk) {
    const m = world.members.find((x) => x.id === id);
    for (const r of byId.get(id).measures) {
      if (r.lane !== 'save' || !m.hidden.plans[r.measure]) continue;
      const t = m.hidden.plans[r.measure].archetype;
      confusion[t] = confusion[t] || {};
      confusion[t][r.barrier] = (confusion[t][r.barrier] || 0) + 1;
    }
  }
  return { arms: out, confusion, analyses };
}

export function summarize(arms) {
  const base = arms.none.measures;
  const res = {};
  for (const [name, arm] of Object.entries(arms)) {
    let gained = 0;
    const per = {};
    for (const [id, v] of Object.entries(arm.measures)) {
      const d = v.num - base[id].num;
      gained += d;
      const rate = (100 * v.num) / v.den;
      per[id] = { num: v.num, den: v.den, rate, star: starFor(ADHERENCE[id], rate), gained: d };
    }
    res[name] = { calls: arm.calls, gained, per100: arm.calls ? (100 * gained) / arm.calls : 0, per };
  }
  return res;
}
