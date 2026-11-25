// Final store view (Kevin's pick, Nov 25): A's newspaper style, B's headline that states only what the tool shows,
// C's 30-day refill calendar as the main exhibit, and A's square chart of every gap member as the secondary exhibit.
import React, { useState } from 'react';
import { ORDER, LABEL, AT_COUNTER, PAYS } from '../Pharmacy.jsx';
import { REACH, n, dayFull } from './shared.js';
import { Units } from './StoreA.jsx';
import { Calendar } from './StoreC.jsx';

export default function StoreFinal({ data }) {
  const ph = data.pharmacy;
  const asOf = data.plan.asOf;
  const [day, setDay] = useState(ph.week[0]?.day);
  const picked = ph.week.find((w) => w.day === day);
  return (
    <div className="page a-page f-page">
      <section className="a-open f-open">
        <div className="a-copy">
          <p className="a-kicker">{ph.store} <span>·</span> synthetic plan, October 1</p>
          <h1>{ph.reach.counter} members with an open gap will walk into this store in the next 30 days</h1>
          <p className="a-stand">Each one is flagged before they arrive, and the gap is closed in the pickup conversation rather than on a phone list.</p>
          <p className="a-why">The store sees the member at pickup whatever plan they are in, and gets paid only for closures the plan's own claims confirm.</p>
        </div>
        <figure className="a-fig f-cal">
          <figcaption>
            <strong>Refills due at {ph.store} from members with an open gap, next 30 days</strong>
            <span>Darker days have more due. Pick a day this week to see who is coming in.</span>
          </figcaption>
          <Calendar month={ph.month || []} week={ph.week} day={day} setDay={setDay} asOf={asOf} />
        </figure>
      </section>

      {picked && (
        <section className="a-store f-day">
          <table className="a-pickups">
            <caption>{dayFull(picked.day, asOf)}: {picked.count} gap members due to pick up</caption>
            <tbody>
              {picked.rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row"><strong>{r.name}</strong><span>Picking up {r.drug}</span></th>
                  <td>{r.actions.map((a) => <p key={a.measure}><span>{a.label}</span>{a.action}</p>)}</td>
                </tr>
              ))}
            </tbody>
            {picked.count > picked.rows.length && <tfoot><tr><td colSpan="2">and {picked.count - picked.rows.length} more that day</td></tr></tfoot>}
          </table>
        </section>
      )}

      <section className="a-store f-units">
        <div className="a-sechead">
          <h2>Across the synthetic plan, how {n(ph.planMembersWithGaps)} gap members next meet a pharmacy</h2>
          <p>Each square is one member. Synthetic claims through September 30. A real plan can count this from its own claims in an afternoon.</p>
        </div>
        <figure className="a-fig">
          <Units plan={ph.plan} cols={40} labels />
          <Units plan={ph.plan} cols={34} />
          <ul className="a-narrowkey">
            {REACH.map((s) => (
              <li key={s.key} className={s.tone}><i /><span className="num">{n(ph.plan[s.key])}</span> {s.label}</li>
            ))}
          </ul>
        </figure>
      </section>

      <section className="a-deal">
        <h2>The deal a store offers a plan</h2>
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
              return <tr key={m}><th scope="row">{LABEL[m]}</th><td className="r num" data-k="counter">{g.counter}</td><td className="r num" data-k="phone">{g.phone}</td><td className="r num q" data-k="elsewhere">{g.elsewhere}</td><td>{AT_COUNTER[m]}</td></tr>;
            })}
          </tbody>
        </table>
      </details>
      <p className="a-note">Prove it the same way as the call list: randomize gap members into the counter flag or the plan's usual outreach, and compare closures on the plan's claims at year end. No outcome claim before that.</p>
    </div>
  );
}
