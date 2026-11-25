// Direction B, the counter: the store's will-call shelf after close. Today's pickups are printed labels.
import React, { useState } from 'react';
import { dayLabel } from '../format.js';
import { ORDER, LABEL, AT_COUNTER, PAYS } from '../Pharmacy.jsx';
import { REACH, n, dayName } from './shared.js';
import { COUNTER_DAYS } from '../../engine/pharmacy.js';

function Label({ r, store }) {
  return (
    <article className="b-label">
      <header><span>{store}</span><span className="num">{r.id}</span></header>
      <h3>{r.name}</h3>
      <p className="b-drug">Picking up <b>{r.drug}</b></p>
      <ul>
        {r.actions.map((a) => (
          <li key={a.measure}><span>{a.label}</span>{a.action}</li>
        ))}
      </ul>
    </article>
  );
}

export default function StoreB({ data }) {
  const ph = data.pharmacy;
  const asOf = data.plan.asOf;
  const [day, setDay] = useState(ph.week[0]?.day);
  const picked = ph.week.find((w) => w.day === day);
  const inWeek = ph.week.reduce((t, w) => t + w.count, 0);
  const most = Math.max(1, ...ph.week.map((w) => w.count));
  const total = ph.planMembersWithGaps;
  return (
    <div className="page b-page">
      <section className="b-open">
        <div className="b-left">
          <p className="b-kicker"><span className="b-dot" />{ph.store} <span>·</span> will call <span>·</span> synthetic plan</p>
          <h1>{ph.reach.counter} members with an open gap will walk into this store in the next 30 days</h1>
          <p className="b-stand">Each one is flagged before they arrive. The gap gets closed in the pickup conversation, not on a phone list.</p>
          <div className="b-rail" role="tablist" aria-label="Pickups by day">
            {ph.week.map((w) => (
              <button key={w.day} role="tab" aria-selected={w.day === day} className={w.day === day ? 'on' : ''} onClick={() => setDay(w.day)}>
                <span className="b-dname">{dayName(w.day, asOf)}</span>
                <span className="b-date num">{dayLabel(w.day)}</span>
                <span className="b-pips" aria-hidden="true">{Array.from({ length: w.count }, (_, i) => <i key={i} style={{ opacity: 0.45 + (0.55 * w.count) / most }} />)}</span>
                <span className="num b-count">{w.count}</span>
              </button>
            ))}
          </div>
          <p className="b-after">{inWeek} this week. {ph.reach.counter - inWeek} more in the {COUNTER_DAYS - 7} days after.</p>
        </div>
        {picked && (
          <div className="b-shelf" key={picked.day}>
            <p className="b-shelfhead"><span>{dayName(picked.day, asOf)}, {dayLabel(picked.day)}</span><span className="num">{picked.count} flagged</span></p>
            <div className="b-labels">
              {picked.rows.map((r) => <Label key={r.id} r={r} store={ph.store} />)}
            </div>
            {picked.count > picked.rows.length && <p className="b-more">and {picked.count - picked.rows.length} more that day</p>}
          </div>
        )}
      </section>

      <section className="b-plan">
        <h2>Across the whole plan</h2>
        <p className="b-sub">All {n(total)} members with an open adherence or safety gap, by how they next meet a pharmacy</p>
        <div className="b-bar" aria-hidden="true">
          {REACH.map((s) => <span key={s.key} className={s.tone} style={{ flexGrow: ph.plan[s.key] }} />)}
        </div>
        <ul className="b-key">
          {REACH.map((s) => <li key={s.key} className={s.tone}><i /><b className="num">{n(ph.plan[s.key])}</b><span>{s.short}</span></li>)}
        </ul>
        <p className="b-why">The store sees the member at pickup whatever plan they are in, and gets paid only for closures the plan's own claims confirm.</p>
      </section>

      <section className="b-deal">
        {PAYS.map((c, i) => (
          <div key={c.title}>
            <p className="num b-step">0{i + 1}</p>
            <h3>{c.title}</h3>
            <ul>{c.lines.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        ))}
      </section>

      <details className="b-more-detail">
        <summary>By measure: who one store can reach</summary>
        <table className="b-reach">
          <thead><tr><th>Gap</th><th className="r">Counter</th><th className="r">Phone</th><th className="r">Elsewhere</th><th>At the counter</th></tr></thead>
          <tbody>
            {ORDER.filter((m) => ph.byGap[m]).map((m) => {
              const g = ph.byGap[m];
              return <tr key={m}><th scope="row">{LABEL[m]}</th><td className="r num" data-k="counter">{g.counter}</td><td className="r num" data-k="phone">{g.phone}</td><td className="r num q" data-k="elsewhere">{g.elsewhere}</td><td>{AT_COUNTER[m]}</td></tr>;
            })}
          </tbody>
        </table>
      </details>
      <p className="b-note">Prove it the same way as the call list: randomize gap members into the counter flag or the plan's usual outreach, and compare closures on the plan's claims at year end. No outcome claim before that.</p>
    </div>
  );
}
