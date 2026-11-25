// Build the demo plan's desk data for the app. Synthetic data only.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { buildWorld, DEV_PARAMS_V2 as DEV_PARAMS } from '../src/engine/world.js';
import { ADHERENCE, SAFETY, starFor, movesToNextStar, YEAR_DAYS } from '../src/engine/measures.js';
import { analyzeMember, deskCallList, FIX_TEXT } from '../src/engine/desk.js';
import { safetyBoard } from '../src/engine/safety.js';
import { formularyImpact, memberNotice, fleschKincaid, TIMELINE_2027 } from '../src/engine/formulary.js';
import { targetFills } from '../src/engine/pdc.js';
import { measureSummary, oneAwaySummary, starCheck } from '../src/engine/market.js';
import { storeView, COUNTER_DAYS } from '../src/engine/pharmacy.js';

const SEED = 201; // a plan the rules were never tuned on
const AS_OF = 273; // October 1, 2026
const K = 500;

const root = new URL('..', import.meta.url).pathname;
const world = buildWorld(SEED, DEV_PARAMS);
// The desk sees only what happened before October 1.
const members = world.members.map((m) => ({ ...m, fills: m.fills.filter((f) => f.day < AS_OF), hidden: undefined }));
const prescribers = Object.fromEntries(world.prescribers.map((p) => [p.id, p]));
const analyses = members.map((m) => analyzeMember(m, AS_OF));
const byId = new Map(analyses.map((a) => [a.id, a]));
const memberById = new Map(members.map((m) => [m.id, m]));
const callList = deskCallList(analyses, K);
const rank = new Map(callList.map((id, i) => [id, i + 1]));

// Plan forecast from the desk's own miss probabilities.
const plan = {};
for (const meas of Object.values(ADHERENCE)) plan[meas.id] = { den: 0, exp: 0, open: 0, onList: 0, lanes: {} };
for (const a of analyses) {
  for (const r of a.measures) {
    const p = plan[r.measure];
    p.lanes[r.lane] = (p.lanes[r.lane] || 0) + 1;
    const s = r.status.state;
    if (s === 'open' || s === 'safe-if-supplied' || s === 'lost') {
      p.den++;
      p.exp += s === 'lost' ? 0 : 1 - r.pMiss;
      if (s === 'open') p.open++;
      if (rank.has(a.id) && r.lane === 'save') p.onList++;
    }
  }
}
const measures = Object.values(ADHERENCE).map((meas) => {
  const p = plan[meas.id];
  const num = Math.round(p.exp);
  const rate = (100 * num) / p.den;
  return {
    id: meas.id, short: meas.short, label: meas.label, weight: meas.weight, cut: meas.cut, higherIsBetter: true,
    den: p.den, num, rate, star: starFor(meas, rate), toNext: movesToNextStar(meas, num, p.den),
    open: p.open, onList: p.onList, lanes: p.lanes,
  };
});

const board = safetyBoard(members, AS_OF);
const safetyMeasures = Object.values(SAFETY).map((meas) => {
  const c = board.counts[meas.id];
  const rate = (100 * c.num) / c.den;
  return { id: meas.id, short: meas.short, label: meas.label, weight: meas.weight, cut: meas.cut, higherIsBetter: meas.higherIsBetter, den: c.den, num: c.num, heading: c.heading || 0, rate, star: starFor(meas, rate), toNext: movesToNextStar(meas, c.num, c.den) };
});

const segs = (days) => {
  const out = [];
  for (const d of days) {
    const last = out[out.length - 1];
    if (last && last[1] === d - 1) last[1] = d;
    else out.push([d, d]);
  }
  return out;
};

function memberView(id) {
  const m = memberById.get(id);
  const a = byId.get(id);
  return {
    id, name: m.name, age: m.age, rank: rank.get(id) || null, score: +a.score.toFixed(3), callBy: a.callBy,
    measures: a.measures.map((r) => {
      const meas = ADHERENCE[r.measure];
      const tf = targetFills(meas, m.fills);
      const last = tf[tf.length - 1];
      const s = r.status;
      return {
        measure: r.measure, state: s.state, lane: r.lane, reason: s.reason || null,
        pdc: s.pdcToDate ?? null, budget: s.budget ?? null, mustFillBy: s.mustFillBy ?? null, runOutDay: s.runOutDay ?? null,
        needCovered: s.needCovered ?? null, covered: s.coveredSoFar ?? null, periodDays: s.periodDays ?? null, ipsd: s.ipsd,
        pMiss: r.pMiss != null ? +r.pMiss.toFixed(2) : null, barrier: r.barrier || null, fix: r.fix ? { key: r.fix, label: FIX_TEXT[r.fix].label } : null, why: r.why || [],
        drug: last?.ingredients[0] || null, strength: last?.strength || '', ds: last?.daysSupply || null,
        copay30: r.features ? Math.round(r.features.copay30) : null, capReached: r.features?.capReached || false,
        pharmacies: [...new Set(tf.slice(-6).map((f) => f.pharmacy))],
        prescriber: last ? prescribers[last.prescriber] : null,
        segments: s.coveredDays ? segs(s.coveredDays) : [],
        fills: tf.map((f) => [f.day, f.daysSupply]),
        switchFill: r.features?.switchFill || null,
      };
    }),
  };
}

// Lanes: every called member, plus a sample of each other lane so the app can show them.
const laneMembers = { save: callList };
for (const lane of ['lost', 'prescriber', 'new-start', 'safe']) {
  laneMembers[lane] = analyses.filter((a) => a.measures.some((r) => r.lane === lane) && !rank.has(a.id)).slice(0, 40).map((a) => a.id);
}
// Members per lane. A member with drugs in two lanes counts in both.
const laneCounts = { save: callList.length, onTrack: 0, overflow: 0 };
// Each member counted once, in the lane that needs them most.
const PRIORITY = ['prescriber', 'new-start', 'lost', 'save', 'safe'];
for (const a of analyses) {
  if (rank.has(a.id)) continue;
  const lanes = new Set(a.measures.map((r) => r.lane));
  if (lanes.size === 0 || [...lanes].every((l) => l === 'excluded' || l === 'not-counted')) continue;
  const lane = PRIORITY.find((l) => lanes.has(l));
  if (lane === 'safe') laneCounts.onTrack++;
  else if (lane === 'save') laneCounts.overflow++; // could use a call, but past this month's capacity
  else if (lane) laneCounts[lane] = (laneCounts[lane] || 0) + 1;
}
const ids = new Set(Object.values(laneMembers).flat());
const memberViews = Object.fromEntries([...ids].map((id) => [id, memberView(id)]));

// Safety faxes: prescribers with the most open items first.
const faxes = Object.entries(board.byPrescriber)
  .map(([pid, items]) => ({
    prescriber: prescribers[pid],
    items: items.map((it) => ({ measure: it.measure, member: it.member, name: memberById.get(it.member).name, age: memberById.get(it.member).age, detail: it.detail })),
  }))
  .sort((a, b) => b.items.length - a.items.length)
  .slice(0, 30);

const statusFor = (m, mid) => byId.get(m.id)?.measures.find((r) => r.measure === mid)?.status || null;
const changes = formularyImpact(members, AS_OF, statusFor).map((c) => {
  const notice = memberNotice(c, 'Rosa');
  return {
    ...c,
    count: c.members.length,
    high: c.members.filter((x) => x.risk === 'high').length,
    sample: c.members.slice(0, 12).map((x) => ({ ...x, name: memberById.get(x.id).name, prescriberName: prescribers[x.prescriber]?.name })),
    members: undefined,
    notice,
    grade: +fleschKincaid(notice.replace(/^Dear [^\n]+\n\n/, '')).toFixed(1),
  };
});

// Real plans: CMS's public 2027 Star Ratings, trimmed to the six Part D measures (scripts/cms-derive.mjs).
const cms = JSON.parse(readFileSync(`${root}data/cms/star-ratings-2027-partd.json`, 'utf8'));
const check = starCheck(cms);
const market = {
  source: { title: cms.sources[0].title, page: cms.page },
  ...oneAwaySummary(cms),
  measures: Object.fromEntries(cms.measures.map((id) => [id, measureSummary(cms, id)])),
  check: { checked: check.checked, reproduced: check.reproduced, heldAt2026: check.heldAt2026.length, unexplained: check.unexplained.length },
};
if (check.unexplained.length) throw new Error(`star logic disagrees with CMS on ${check.unexplained.length} scores`);

// One store's view of the same gaps (Pharmacy tab).
const safetyByMember = new Map();
for (const items of Object.values(board.byPrescriber)) for (const it of items) {
  if (!safetyByMember.has(it.member)) safetyByMember.set(it.member, []);
  safetyByMember.get(it.member).push(it);
}
const pharmacy = storeView({ members, analyses: byId, safetyByMember, asOf: AS_OF });
// Keep the next 7 days for the app: up to 6 members a day, plus each day's count.
pharmacy.week = [];
for (let d = AS_OF; d < AS_OF + 7; d++) {
  const rows = pharmacy.counter.filter((r) => r.next === d);
  if (rows.length) pharmacy.week.push({ day: d, count: rows.length, rows: rows.slice(0, 6) });
}
// The whole counter window, one count per day, for the refill calendar.
pharmacy.month = [];
for (let d = AS_OF; d < AS_OF + COUNTER_DAYS; d++) pharmacy.month.push({ day: d, count: pharmacy.counter.filter((r) => r.next === d).length });
delete pharmacy.counter;

const out = {
  pharmacy,
  market,
  plan: { name: 'Harbor Senior Rx', synthetic: true, asOf: AS_OF, year: 2026, members: members.length, k: K, yearDays: YEAR_DAYS },
  measures, safetyMeasures, laneCounts, laneMembers, members: memberViews, faxes, changes, timeline: TIMELINE_2027,
};
mkdirSync(`${root}public/data`, { recursive: true });
writeFileSync(`${root}public/data/desk.json`, JSON.stringify(out));
console.log('wrote public/data/desk.json', (JSON.stringify(out).length / 1024).toFixed(0), 'KB');
console.log(measures.map((m) => `${m.id} ${m.rate.toFixed(1)} ${m.star}* toNext ${m.toNext} open ${m.open} onList ${m.onList}`).join('\n'));
console.log(safetyMeasures.map((m) => `${m.id} ${m.num}/${m.den} ${m.rate.toFixed(1)} ${m.star}* toNext ${m.toNext} heading ${m.heading}`).join('\n'));
console.log('market', `${market.oneAway} of ${market.plans} MA-PD plans one point from the next star`, 'check', market.check);
console.log('pharmacy', pharmacy.store, pharmacy.planMembersWithGaps, pharmacy.reach, JSON.stringify(pharmacy.byGap));
console.log('lanes', laneCounts, 'faxes', faxes.length, 'changes', changes.map((c) => `${c.drug} ${c.count}/${c.high} grade ${c.grade}`).join(', '));
