// Direction A, the cut line: a newspaper graphics desk treatment. One annotated unit chart carries the first screen.
import React, { useState } from 'react';
import { dayLabel } from '../format.js';
import { ORDER, LABEL, AT_COUNTER, PAYS } from '../Pharmacy.jsx';
import { REACH, n, dayFull, dayName } from './shared.js';

// One square per member, filled row by row in reach order.
export function Units({ plan, cols, cell = 9, gap = 2, labels }) {
  const order = REACH.flatMap((s) => Array(plan[s.key]).fill(s.tone));
  const rows = Math.ceil(order.length / cols);
  const step = cell + gap;
  const W = cols * step - gap;
  const H = rows * step - gap;
  // Where each segment's first and last square sit, for the leader lines.
  let at = 0;
  const marks = REACH.map((s) => {
    const a = at;
    at += plan[s.key];
    return { ...s, rowFrom: Math.floor(a / cols), rowTo: Math.floor((at - 1) / cols) };
  });
  const walk = marks[0];
  const call = marks[1];
  const LW = labels ? 300 : 0;
  return (
    <svg className={labels ? 'a-units wide' : 'a-units narrow'} viewBox={`0 0 ${W + LW} ${H + (labels ? 36 : 0)}`} role="img" aria-label={REACH.map((s) => `${plan[s.key]} ${s.label}`).join('. ')}>
      {order.map((tone, i) => (
        <rect key={i} x={(i % cols) * step} y={Math.floor(i / cols) * step} width={cell} height={cell} className={`u ${tone}`} />
      ))}
      {labels && (
        <g className="a-anno">
          <line x1={W + 8} x2={W + 24} y1={((walk.rowFrom + walk.rowTo) / 2) * step} y2={((walk.rowFrom + walk.rowTo) / 2) * step} />
          <text x={W + 32} y={((walk.rowFrom + walk.rowTo) / 2) * step - 14} className="big walk">{n(plan['walk-in'])}</text>
          <text x={W + 32} y={((walk.rowFrom + walk.rowTo) / 2) * step + 12}>have a refill due at a pharmacy</text>
          <text x={W + 32} y={((walk.rowFrom + walk.rowTo) / 2) * step + 32}>counter in the next 30 days</text>
          <line x1={W + 8} x2={W + 24} y1={((call.rowFrom + call.rowTo) / 2) * step + 4} y2={((call.rowFrom + call.rowTo) / 2) * step + 4} />
          <text x={W + 32} y={((call.rowFrom + call.rowTo) / 2) * step + 9}><tspan className="num call">{n(plan['store-call'])}</tspan> use a pharmacy but are</text>
          <text x={W + 32} y={((call.rowFrom + call.rowTo) / 2) * step + 29}>overdue or on 90-day fills</text>
          <text x={W + 32} y={H + 30}><tspan className="num">{n(plan.mail + plan.none)}</tspan> mail order only or no recent fill</text>
        </g>
      )}
    </svg>
  );
}

export default function StoreA({ data }) {
  const ph = data.pharmacy;
  const asOf = data.plan.asOf;
  const [day, setDay] = useState(ph.week[0]?.day);
  const picked = ph.week.find((w) => w.day === day);
  const month = ph.month || [];
  const most = Math.max(1, ...month.map((d) => d.count));
  const weekDays = new Set(ph.week.map((w) => w.day));
  return (
    <div className="page a-page">
      <section className="a-open">
        <div className="a-copy">
          <p className="a-kicker">Pharmacy <span>·</span> synthetic plan, October 1</p>
          <h1>Most members with an open gap are already on their way to a pharmacy counter</h1>
          <p className="a-stand">Before a plan pays to phone its gap list, it can count who will walk in anyway. The pickup is the outreach.</p>
          <p className="a-why">A store sees the member at pickup whatever plan they are in, and gets paid only for closures the plan's own claims confirm.</p>
        </div>
        <figure className="a-fig">
          <figcaption>
            <strong>{n(ph.planMembersWithGaps)} members with an open adherence or safety gap</strong>
            <span>Each square is one member, by how they next meet a pharmacy</span>
          </figcaption>
          <Units plan={ph.plan} cols={40} labels />
          <Units plan={ph.plan} cols={34} />
          <ul className="a-narrowkey">
            {REACH.map((s) => (
              <li key={s.key} className={s.tone}><i /><span className="num">{n(ph.plan[s.key])}</span> {s.label}</li>
            ))}
          </ul>
          <p className="a-src">Synthetic claims through September 30. A real plan can count this from its own claims in an afternoon.</p>
        </figure>
      </section>

      <section className="a-store">
        <div className="a-sechead">
          <h2>At one store, {ph.store} sees {ph.reach.counter} of them in the next 30 days</h2>
          <p>Each one is flagged before they arrive. Pick a day to see who is coming in.</p>
        </div>
        <div className="a-month" aria-label={`Gap members due at ${ph.store} each day for 30 days`}>
          {month.map((d) => (
            <span key={d.day} className={d.day === day ? 'on' : weekDays.has(d.day) ? 'wk' : ''}>
              <i style={{ height: `${(100 * d.count) / most}%` }} />
              <em>{(d.day - asOf) % 7 === 0 && d.day - asOf < 28 ? dayLabel(d.day) : ''}</em>
            </span>
          ))}
        </div>
        <div className="a-days" role="tablist" aria-label="Pickups by day" data-oneline>
          {ph.week.map((w) => (
            <button key={w.day} role="tab" aria-selected={w.day === day} className={w.day === day ? 'on' : ''} onClick={() => setDay(w.day)}>
              <span>{dayName(w.day, asOf)}</span>
              <b className="num">{w.count}</b>
            </button>
          ))}
        </div>
        {picked && (
          <table className="a-pickups">
            <caption>{dayFull(picked.day, asOf)}: {picked.count} gap members due to pick up</caption>
            <tbody>
              {picked.rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row"><strong>{r.name}</strong><span>Picking up {r.drug}</span></th>
                  <td>
                    {r.actions.map((a) => <p key={a.measure}><span>{a.label}</span>{a.action}</p>)}
                  </td>
                </tr>
              ))}
            </tbody>
            {picked.count > picked.rows.length && <tfoot><tr><td colSpan="2">and {picked.count - picked.rows.length} more that day</td></tr></tfoot>}
          </table>
        )}
      </section>

      <section className="a-deal">
        <h2>The deal a store offers any plan</h2>
        <div className="a-cols">
          {PAYS.map((c) => (
            <div key={c.title}>
              <h3>{c.title}</h3>
              <ul>{c.lines.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <details className="a-more">
        <summary>By measure: who one store can reach</summary>
        <table className="a-reach">
          <thead><tr><th>Gap</th><th className="r">Counter</th><th className="r">Phone</th><th className="r">Elsewhere</th><th>What the store does</th></tr></thead>
          <tbody>
            {ORDER.filter((m) => ph.byGap[m]).map((m) => {
              const g = ph.byGap[m];
              return (
                <tr key={m}><th scope="row">{LABEL[m]}</th><td className="r num" data-k="counter">{g.counter}</td><td className="r num" data-k="phone">{g.phone}</td><td className="r num q" data-k="elsewhere">{g.elsewhere}</td><td>{AT_COUNTER[m]}</td></tr>
              );
            })}
          </tbody>
        </table>
      </details>
      <p className="a-note">Prove it the same way as the call list: randomize gap members into the counter flag or the plan's usual outreach, and compare closures on the plan's claims at year end. No outcome claim before that.</p>
    </div>
  );
}
