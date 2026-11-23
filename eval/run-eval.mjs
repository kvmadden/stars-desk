// Score the desk against plain call lists.
//   node eval/run-eval.mjs dev       development worlds, run as often as needed
//   node eval/run-eval.mjs holdout   frozen held-out world, runs once (refuses if results exist)
//   node eval/run-eval.mjs dev2      version 2 development worlds (add-on therapy, mixed and unexplained barriers)
//   node eval/run-eval.mjs holdout2  version 2 frozen held-out world, runs once
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildWorld, DEV_PARAMS, DEV_PARAMS_V2 } from '../src/engine/world.js';
import { runWorld, summarize, baselines } from './sim.js';
import { analyzeMember } from '../src/engine/desk.js';

const set = process.argv[2] || 'dev';
const here = new URL('.', import.meta.url).pathname;
const resultsDir = `${here}results`;
mkdirSync(resultsDir, { recursive: true });

export const SETUP = { asOf: 273, k: 500, perDay: 25 };
export const TRUTH = { reach: 0.6, pFix: 0.55, pGeneric: 0.25, pDiscover: 0.35 };
const GRID = [];
for (const reach of [0.4, 0.6, 0.8]) for (const pFix of [0.3, 0.55, 0.8]) for (const pDiscover of [0, 0.35, 0.7]) GRID.push({ reach, pFix, pGeneric: 0.25, pDiscover });

let params = set === 'dev2' ? DEV_PARAMS_V2 : DEV_PARAMS;
let seeds = [101, 102, 103, 104, 105];
if (set === 'holdout' || set === 'holdout2') {
  const dir = set === 'holdout' ? 'holdout' : 'holdout2';
  const out = `${resultsDir}/${set}.json`;
  if (existsSync(out)) {
    console.error('Held-out results already exist. The held-out world is scored once.');
    process.exit(1);
  }
  const freeze = JSON.parse(readFileSync(`${here}${dir}/FREEZE.json`, 'utf8'));
  for (const f of ['params.json', 'SPEC.md']) {
    const h = createHash('sha256').update(readFileSync(`${here}${dir}/${f}`)).digest('hex');
    if (h !== freeze[f]) {
      console.error(`${f} does not match its frozen hash.`);
      process.exit(1);
    }
  }
  params = JSON.parse(readFileSync(`${here}${dir}/params.json`, 'utf8'));
  seeds = freeze.seeds;
}

const ARMS = ['none', 'lowestFirst', 'closestFirst', 'mostOverdue', 'gapBudget', 'deskOrderOnly', 'desk'];
const main = { seeds: [], totals: {}, calls: {} };
const confusion = {};
const grid = GRID.map((t) => ({ truth: t, gained: Object.fromEntries(ARMS.map((a) => [a, 0])) }));
for (const seed of seeds) {
  const w = buildWorld(seed, params);
  const cache = { analyses: w.members.map((m) => analyzeMember(m, SETUP.asOf)), baselines: baselines(w, SETUP.asOf) };
  const r = runWorld(w, params, { ...SETUP, ...cache, truth: TRUTH });
  const s = summarize(r.arms);
  main.seeds.push({ seed, arms: s });
  for (const a of ARMS) {
    main.totals[a] = (main.totals[a] || 0) + s[a].gained;
    main.calls[a] = (main.calls[a] || 0) + s[a].calls;
  }
  for (const [t, row] of Object.entries(r.confusion)) for (const [g, n] of Object.entries(row)) {
    confusion[t] = confusion[t] || {};
    confusion[t][g] = (confusion[t][g] || 0) + n;
  }
  for (const g of grid) {
    const rr = summarize(runWorld(w, params, { ...SETUP, ...cache, truth: g.truth }).arms);
    for (const a of ARMS) g.gained[a] += rr[a].gained;
  }
  console.log(`seed ${seed} done`);
}
const per100 = Object.fromEntries(ARMS.map((a) => [a, main.calls[a] ? (100 * main.totals[a]) / main.calls[a] : 0]));
const result = { set, params: params.name, setup: SETUP, truth: TRUTH, seeds, totals: main.totals, calls: main.calls, per100, perSeed: main.seeds, confusion, grid, ranAt: new Date().toISOString() };
writeFileSync(`${resultsDir}/${set}.json`, JSON.stringify(result, null, 1));
console.log('per 100 calls', Object.fromEntries(Object.entries(per100).map(([k, v]) => [k, v.toFixed(1)])));
const wins = grid.filter((g) => g.gained.desk > g.gained.gapBudget).length;
const orderWins = grid.filter((g) => g.gained.deskOrderOnly > g.gained.gapBudget).length;
console.log(`grid: desk beats gap-budget list in ${wins} of ${grid.length}, ordering alone in ${orderWins} of ${grid.length}`);
console.log('confusion (true -> guessed)', JSON.stringify(confusion));
