// Amendment, 2026-11-22: an independent review asked for one more comparison list (gap budget first,
// skipping members who cannot reach 80%). The desk is unchanged. This scores only the new list on the
// frozen held-out plans and checks that the desk's held-out numbers reproduce exactly.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildWorld } from '../src/engine/world.js';
import { analyzeMember } from '../src/engine/desk.js';
import { runWorld, summarize, baselines } from './sim.js';

const here = new URL('.', import.meta.url).pathname;
const out = `${here}results/holdout-amendment-gapbudget.json`;
if (existsSync(out)) { console.error('Amendment already scored.'); process.exit(1); }
const freeze = JSON.parse(readFileSync(`${here}holdout/FREEZE.json`, 'utf8'));
for (const f of ['params.json', 'SPEC.md']) {
  const h = createHash('sha256').update(readFileSync(`${here}holdout/${f}`)).digest('hex');
  if (h !== freeze[f]) { console.error(`${f} does not match its frozen hash.`); process.exit(1); }
}
const prior = JSON.parse(readFileSync(`${here}results/holdout.json`, 'utf8'));
const params = JSON.parse(readFileSync(`${here}holdout/params.json`, 'utf8'));
const ONLY = ['none', 'gapBudget', 'deskOrderOnly', 'desk'];
const totals = {};
const calls = {};
const grid = prior.grid.map((g) => ({ truth: g.truth, gained: { gapBudget: 0, desk: 0, deskOrderOnly: 0 } }));
for (const seed of freeze.seeds) {
  const w = buildWorld(seed, params);
  const cache = { analyses: w.members.map((m) => analyzeMember(m, prior.setup.asOf)), baselines: baselines(w, prior.setup.asOf), only: ONLY };
  const s = summarize(runWorld(w, params, { ...prior.setup, ...cache, truth: prior.truth }).arms);
  for (const a of ONLY) { totals[a] = (totals[a] || 0) + s[a].gained; calls[a] = (calls[a] || 0) + s[a].calls; }
  for (const g of grid) {
    const rr = summarize(runWorld(w, params, { ...prior.setup, ...cache, truth: g.truth }).arms);
    for (const a of Object.keys(g.gained)) g.gained[a] += rr[a].gained;
  }
  console.log(`seed ${seed} done`);
}
const reproduced = totals.desk === prior.totals.desk && totals.deskOrderOnly === prior.totals.deskOrderOnly;
const per100 = Object.fromEntries(ONLY.map((a) => [a, calls[a] ? (100 * totals[a]) / calls[a] : 0]));
const wins = grid.filter((g) => g.gained.desk > g.gained.gapBudget).length;
const orderWins = grid.filter((g) => g.gained.deskOrderOnly > g.gained.gapBudget).length;
writeFileSync(out, JSON.stringify({ reason: 'Independent review asked for a gap-budget comparison list. Desk unchanged.', reproduced, totals, calls, per100, wins, orderWins, gridSize: grid.length, grid, ranAt: new Date().toISOString() }, null, 1));
console.log({ reproduced, per100, wins, orderWins });
