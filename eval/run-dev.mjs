// Development runs only. The held-out world is scored once by eval/run-holdout.mjs.
import { buildWorld, DEV_PARAMS } from '../src/engine/world.js';
import { runWorld, summarize } from './sim.js';

export const EVAL_SETUP = {
  asOf: 273, // October 1
  k: 500, // member calls
  perDay: 25, // calls attempted per working day by a small pharmacist team
  truth: { reach: 0.6, pFix: 0.55, pGeneric: 0.25, pDiscover: 0.35 },
};

const seeds = (process.argv[2] || '101,102,103').split(',').map(Number);
const totals = {};
for (const seed of seeds) {
  const w = buildWorld(seed, DEV_PARAMS);
  const r = runWorld(w, DEV_PARAMS, EVAL_SETUP);
  const s = summarize(r.arms);
  console.log(`seed ${seed}`);
  for (const [name, v] of Object.entries(s)) {
    console.log(`  ${name.padEnd(14)} calls ${String(v.calls).padStart(4)}  gained ${String(v.gained).padStart(4)}  per100 ${v.per100.toFixed(1).padStart(5)}  ` +
      Object.entries(v.per).map(([id, p]) => `${id} ${p.rate.toFixed(1)} ${p.star}*`).join('  '));
    totals[name] = (totals[name] || 0) + v.gained;
  }
  console.log('  confusion', JSON.stringify(r.confusion));
}
console.log('totals', totals);
