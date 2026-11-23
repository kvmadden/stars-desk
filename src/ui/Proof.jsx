import React, { useState } from 'react';
import { BARRIER_LABEL } from './format.js';

const ARMS = [
  { key: 'lowestFirst', label: 'Under 80%, lowest first' },
  { key: 'mostOverdue', label: 'Most overdue first' },
  { key: 'closestFirst', label: 'Under 80%, closest to 80 first' },
  { key: 'gapBudget', label: 'Fewest missed days left (best plain list)' },
  { key: 'deskOrderOnly', label: 'Desk order, plain reminder call' },
  { key: 'desk', label: 'Desk order and matched fix' },
];

function Bars({ r, max }) {
  return (
    <ul className="bars">
      {ARMS.map((a) => {
        const v = r.per100[a.key];
        if (v == null) return null;
        return (
          <li key={a.key} className={a.key === 'desk' ? 'hot' : a.key === 'gapBudget' ? 'base' : ''}>
            <span className="blabel">{a.label}</span>
            <span className="bar"><span style={{ width: `${(v / max) * 100}%` }} /></span>
            <span className="mono">{v.toFixed(1)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Proof({ data }) {
  // Version 2 (harder plans, add-on therapy) is the headline when it exists. Version 1 stays on record.
  const v2 = data.eval.holdout2 ? { held: data.eval.holdout2, dev: data.eval.dev2 } : null;
  const v1 = { held: data.eval.holdout, dev: data.eval.dev };
  const { held, dev } = v2 || v1;
  const [more, setMore] = useState(false);
  const main = held || dev;
  if (!main) return <div className="page"><p>No evaluation results in this build.</p></div>;
  const max = Math.max(...[held, dev, v1.held].filter(Boolean).flatMap((r) => ARMS.map((a) => r.per100[a.key] ?? 0)));
  const best = main.per100.gapBudget != null ? 'gapBudget' : 'closestFirst';
  const wins = main.grid.filter((g) => g.gained.desk > g.gained[best]).length;
  const orderWins = main.grid.filter((g) => g.gained.deskOrderOnly > g.gained[best]).length;
  const conf = main.confusion;
  let right = 0;
  let all = 0;
  for (const [t, row] of Object.entries(conf)) for (const [g, n] of Object.entries(row)) { all += n; if (t === g) right += n; }
  return (
    <div className="page proof">
      <section className="hero small">
        <p className="eyebrow">Simulated on synthetic plans</p>
        <h1>
          Per 100 calls, the desk kept <span className="hl">{main.per100.desk.toFixed(0)} members</span> at 80%. The strongest plain list kept {main.per100[best].toFixed(0)}.
        </h1>
        <p className="lede">The gain comes from matching the fix to the barrier. Ordering the same list better, with a plain reminder, adds little.</p>
      </section>
      <section className="proofmain">
        <div>
          <h2>Held-out plans</h2>
          <p className="sub">{held?.seeds.length} plans of 6,000 members, with settings fixed before the test and never used to build the rules</p>
        </div>
        <Bars r={held || dev} max={max} />
      </section>
      <button className="ghost" onClick={() => setMore(!more)} aria-expanded={more}>{more ? 'Hide how this was tested' : 'How this was tested'}</button>
      {more && (
        <section className="method">
          <p>
            Each plan is played from October 1 to December 31 twice: once with no calls and once with {main.setup.k} member calls at {main.setup.perDay} a day. Both runs share the same random draws until the call, so every difference comes from the call. A call reaches the member {Math.round(main.truth.reach * 100)}% of the time. A fix that matches the real barrier changes the member's refills {Math.round(main.truth.pFix * 100)}% of the time. A pharmacist on the phone finds the real barrier without a guess {Math.round(main.truth.pDiscover * 100)}% of the time.
          </p>
          <p>
            Those three numbers are assumptions, so the run repeats over {main.grid.length} combinations of them. The desk beat the strongest plain list in {wins} of {main.grid.length}. Its ordering alone, with a plain reminder call, won in {orderWins} of {main.grid.length}.
          </p>
          <p>
            The barrier guess is read against the simulator's own barrier types, so its match rate is an upper bound. It matched the hidden truth for {right.toLocaleString()} of {all.toLocaleString()} called member-drugs ({Math.round((100 * right) / all)}%).
          </p>
          {dev && (
            <div className="devpanel">
              <h3>Development plans</h3>
              <p className="sub">{dev.seeds.length} plans the rules were written against</p>
              <Bars r={dev} max={max} />
            </div>
          )}
          {v2 && v1.held && (
            <p>
              An earlier, easier version of the plans gave {v1.held.per100.desk.toFixed(1)} per 100 calls for the desk and {(v1.held.per100.gapBudget ?? v1.held.per100.closestFirst).toFixed(1)} for the strongest plain list. Version 2 adds add-on therapy that looks like a switch, members with two barriers, and members no fix reaches.
            </p>
          )}
          <p>
            What this does not show: real members. The plans, the barriers and the call effects are simulated, so the result says the ranking and the fixes are sound given those mechanics. A pilot with real outreach logs would measure reach and fix rates directly.
          </p>
        </section>
      )}
    </div>
  );
}
