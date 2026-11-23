// Development check: does the desk's miss probability match what happens with no calls?
import { buildWorld, DEV_PARAMS } from '../src/engine/world.js';
import { ADHERENCE } from '../src/engine/measures.js';
import { finalPdc } from '../src/engine/pdc.js';
import { analyzeMember } from '../src/engine/desk.js';
const bins = Array.from({ length: 10 }, () => ({ n: 0, pred: 0, miss: 0 }));
for (const seed of [101, 102, 103]) {
  const w = buildWorld(seed, DEV_PARAMS);
  for (const m of w.members) {
    const a = analyzeMember(m, 273);
    for (const r of a.measures) {
      if (r.status.state !== 'open') continue;
      const p = finalPdc(ADHERENCE[r.measure], m);
      if (p == null) continue;
      const b = bins[Math.min(9, Math.floor(r.pMiss * 10))];
      b.n++; b.pred += r.pMiss; b.miss += p < 0.8 ? 1 : 0;
    }
  }
}
for (const [i, b] of bins.entries()) if (b.n) console.log(`${i / 10}-${(i + 1) / 10}  n ${String(b.n).padStart(5)}  predicted ${(b.pred / b.n).toFixed(2)}  actual ${(b.miss / b.n).toFixed(2)}`);
