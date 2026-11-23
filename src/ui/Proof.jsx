import React, { useState } from 'react';
import { BARRIER_LABEL } from './format.js';

const ARMS = [
  { key: 'lowestFirst', label: 'Under 80%, lowest first' },
  { key: 'mostOverdue', label: 'Most overdue first' },
  { key: 'closestFirst', label: 'Under 80%, closest to 80 first' },
  { key: 'deskOrderOnly', label: 'Desk order, plain reminder call' },
  { key: 'desk', label: 'Desk order and matched fix' },
];

function Bars({ r, max }) {
  return (
    <ul className="bars">
      {ARMS.map((a) => {
        const v = r.per100[a.key];
        return (
          <li key={a.key} className={a.key === 'desk' ? 'hot' : a.key === 'closestFirst' ? 'base' : ''}>
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
  const { dev, holdout } = data.eval;
  const [more, setMore] = useState(false);
  const main = holdout || dev;
  if (!main) return <div className="page"><p>No evaluation results in this build.</p></div>;
  const max = Math.max(...[dev, holdout].filter(Boolean).flatMap((r) => ARMS.map((a) => r.per100[a.key])));
  const wins = main.grid.filter((g) => g.gained.desk > g.gained.closestFirst).length;
  const orderWins = main.grid.filter((g) => g.gained.deskOrderOnly > g.gained.closestFirst).length;
  const conf = main.confusion;
  let right = 0;
  let all = 0;
  for (const [t, row] of Object.entries(conf)) for (const [g, n] of Object.entries(row)) { all += n; if (t === g) right += n; }
  return (
    <div className="page proof">
      <section className="hero small">
        <p className="eyebrow">{holdout ? 'Held-out plan, scored once' : 'Development plans'}</p>
        <h1>
          Per 100 calls, the desk kept <span className="hl">{main.per100.desk.toFixed(0)} members</span> at 80%. The best plain list kept {main.per100.closestFirst.toFixed(0)}.
        </h1>
        <p className="lede">Members who finished the year at or above 80% because of a call, counted against the same plan with no calls.</p>
      </section>
      <div className="proofgrid">
        {holdout && (
          <section>
            <h2>Held-out plan</h2>
            <p className="sub">{holdout.seeds.length} plans of 6,000 members, built by a separate agent from a written spec and frozen before the first run</p>
            <Bars r={holdout} max={max} />
          </section>
        )}
        {dev && (
          <section>
            <h2>Development plans</h2>
            <p className="sub">{dev.seeds.length} plans the rules were written against</p>
            <Bars r={dev} max={max} />
          </section>
        )}
      </div>
      <button className="ghost" onClick={() => setMore(!more)}>{more ? 'Hide how this is calculated' : 'How this is calculated'}</button>
      {more && (
        <section className="method">
          <p>
            Each plan is played from October 1 to December 31 twice: once with no calls and once with {main.setup.k} member calls at {main.setup.perDay} a day. Both runs share the same random draws until the call, so every difference comes from the call. A call reaches the member {Math.round(main.truth.reach * 100)}% of the time. A fix that matches the real barrier changes the member's refills {Math.round(main.truth.pFix * 100)}% of the time. A pharmacist on the phone finds the real barrier without a guess {Math.round(main.truth.pDiscover * 100)}% of the time.
          </p>
          <p>
            Those three numbers are assumptions, so the run repeats over {main.grid.length} combinations of them. The desk beat the closest-to-80 list in {wins} of {main.grid.length}. Its ordering alone, with a plain reminder call, won in {orderWins} of {main.grid.length}.
          </p>
          <p>
            The barrier guess matched the hidden truth for {right} of {all} called member-drugs ({Math.round((100 * right) / all)}%).{' '}
            {Object.entries(conf).map(([t, row]) => `${BARRIER_LABEL[t] || t}: ${row[t] || 0} of ${Object.values(row).reduce((a, b) => a + b, 0)}`).join('. ')}.
          </p>
          <p>
            What this does not show: real members. The plan, the barriers and the call effects are simulated, so the result says the ranking and the fixes are sound given those mechanics. A pilot with real outreach logs would measure reach and fix rates directly.
          </p>
        </section>
      )}
    </div>
  );
}
