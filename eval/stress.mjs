// Stress test on the frozen version 2 held-out plans: start the call list later in the year,
// when fewer members can still be saved. The desk is unchanged. These are extra conditions,
// not a rescoring of the held-out result.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildWorld } from '../src/engine/world.js';
import { analyzeMember } from '../src/engine/desk.js';
import { runWorld, summarize, baselines } from './sim.js';

const here = new URL('.', import.meta.url).pathname;
const freeze = JSON.parse(readFileSync(`${here}holdout2/FREEZE.json`, 'utf8'));
for (const f of ['params.json', 'SPEC.md']) {
  const h = createHash('sha256').update(readFileSync(`${here}holdout2/${f}`)).digest('hex');
  if (h !== freeze[f]) { console.error(`${f} does not match its frozen hash.`); process.exit(1); }
}
const params = JSON.parse(readFileSync(`${here}holdout2/params.json`, 'utf8'));
const TRUTH = { reach: 0.6, pFix: 0.55, pGeneric: 0.25, pDiscover: 0.35 };
const CONDITIONS = [
  { label: 'November 1 start', asOf: 304, k: 500, perDay: 25, truth: TRUTH },
  { label: 'December 1 start', asOf: 334, k: 500, perDay: 25, truth: TRUTH },
  { label: 'October 1, low reach (30%)', asOf: 273, k: 500, perDay: 25, truth: { ...TRUTH, reach: 0.3 } },
  { label: 'October 1, 150 calls only', asOf: 273, k: 150, perDay: 25, truth: TRUTH },
];
const ONLY = ['none', 'gapBudget', 'closestFirst', 'deskOrderOnly', 'desk'];
const out = [];
for (const c of CONDITIONS) {
  const totals = {};
  const calls = {};
  for (const seed of freeze.seeds) {
    const w = buildWorld(seed, params);
    const cache = { analyses: w.members.map((m) => analyzeMember(m, c.asOf)), baselines: baselines(w, c.asOf), only: ONLY };
    const s = summarize(runWorld(w, params, { ...c, ...cache }).arms);
    for (const a of ONLY) { totals[a] = (totals[a] || 0) + s[a].gained; calls[a] = (calls[a] || 0) + s[a].calls; }
  }
  const per100 = Object.fromEntries(ONLY.map((a) => [a, calls[a] ? +((100 * totals[a]) / calls[a]).toFixed(1) : 0]));
  out.push({ ...c, per100, totals, calls });
  console.log(c.label, JSON.stringify(per100));
}
writeFileSync(`${here}results/stress-holdout2.json`, JSON.stringify({ note: 'Extra conditions on frozen v2 held-out plans. Desk unchanged.', conditions: out, ranAt: new Date().toISOString() }, null, 1));
