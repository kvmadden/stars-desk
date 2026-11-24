import React, { useState } from 'react';
import { dayLabel } from './format.js';

const ORDER = ['D08', 'D09', 'D10', 'D11', 'D12', 'D13'];
const LABEL = { D08: 'Diabetes adherence', D09: 'Blood pressure adherence', D10: 'Statin adherence', D11: 'Statin use in diabetes', D12: 'Opioid with benzodiazepine', D13: 'Two anticholinergics' };
const AT_COUNTER = {
  D08: 'The call list fix, offered at pickup: 90 days, synced refills or a cost check',
  D09: 'The call list fix, offered at pickup',
  D10: 'The call list fix, offered at pickup',
  D11: 'Ask about a statin, then a prescriber request',
  D12: 'Safety fax to the prescriber. Naloxone offer at pickup',
  D13: 'Safety fax to the prescriber with a non-anticholinergic option',
};
const PAYS = [
  { title: 'The plan sends', lines: ['A weekly file of its members with an open gap', 'Measure, days to spare and last fill, by the CMS rules', 'Any member it wants handled by its own team instead'] },
  { title: 'The store does', lines: ['Flags the member in the pickup workflow before they arrive', 'The counter action for each gap, in one conversation', 'Prescriber requests for anything that needs a new prescription', 'Logs what it offered and what the member said'] },
  { title: 'The plan pays for', lines: ['Closures its own claims confirm, using the CMS rules', 'Adherence: the member ends the year at 80% or higher', 'Statin in diabetes: a statin fill in the measurement year', 'Not for calls, attempts or flags on their own'] },
];

function Funnel({ total, here, counter, store }) {
  const w = (n) => `${Math.max(1.5, (100 * n) / total)}%`;
  return (
    <ol className="funnel" aria-label="Who the store can reach">
      <li><span className="fbar"><i style={{ width: '100%' }} /></span><span className="mono">{total.toLocaleString()}</span><span>plan members with an open gap</span></li>
      <li><span className="fbar"><i className="mid" style={{ width: w(here) }} /></span><span className="mono">{here.toLocaleString()}</span><span>filled something at {store} in the last 120 days</span></li>
      <li className="hot"><span className="fbar"><i className="gold" style={{ width: w(counter) }} /></span><span className="mono">{counter.toLocaleString()}</span><span>have a refill due here in the next 30 days</span></li>
    </ol>
  );
}

export default function Pharmacy({ data }) {
  const ph = data.pharmacy;
  const asOf = data.plan.asOf;
  const here = ph.reach.counter + ph.reach.phone;
  const week = ph.week;
  const [day, setDay] = useState(week[0]?.day);
  const most = Math.max(1, ...week.map((w) => w.count));
  const picked = week.find((w) => w.day === day);
  return (
    <div className="page pharmacy">
      <section className="herogrid">
        <div className="hero">
          <p className="eyebrow">For a pharmacy selling to any plan</p>
          <h1>One store has <span className="hl">{ph.reach.counter} of the plan's {ph.planMembersWithGaps.toLocaleString()} gap members</span> due at its counter in the next 30 days.</h1>
          <p className="lede">CVS Health plans to split its stores into a standalone company (<a href="https://www.pharmacytimes.com/view/cvs-health-to-split-into-2-public-companies-separating-retail-and-specialty-pharmacy" target="_blank" rel="noreferrer">Pharmacy Times, Nov 4, 2026</a>), so those stores would sell to every plan, not one parent. A store's edge over a call center is that the member walks in. The plan pays only for gaps its own claims show closed.</p>
        </div>
        <aside className="today">
          <h2>{ph.store} (synthetic)</h2>
          <Funnel total={ph.planMembersWithGaps} here={here} counter={ph.reach.counter} store={ph.store} />
          <p className="sub">The other {ph.reach.elsewhere.toLocaleString()} fill at other pharmacies or by mail. Their own pharmacy or the plan's outreach reaches them.</p>
        </aside>
      </section>

      <section className="board">
        <h2>Who the store can reach, by measure</h2>
        <p className="boardsub">Counter means a refill here falls due in the next 30 days. Phone means they fill here but their refill is already overdue or not due for a month, so the store calls.</p>
        <table className="reach">
          <thead><tr><th>Gap</th><th className="num">At the counter</th><th className="num">By phone</th><th className="num">Elsewhere</th><th>What the store does</th></tr></thead>
          <tbody>
            {ORDER.filter((m) => ph.byGap[m]).map((m) => {
              const g = ph.byGap[m];
              const tot = g.counter + g.phone + g.elsewhere;
              return (
                <tr key={m}>
                  <th scope="row">{LABEL[m]}<span className="rbar"><i style={{ width: `${(100 * g.counter) / tot}%` }} /></span></th>
                  <td className="num mono">{g.counter}</td>
                  <td className="num mono">{g.phone}</td>
                  <td className="num mono muted">{g.elsewhere}</td>
                  <td>{AT_COUNTER[m]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="weekview">
        <h2>At the counter in the next 7 days</h2>
        <p className="sub">Each member is flagged before they arrive, so the conversation happens at pickup with no call.</p>
        <div className="weekstrip" role="tablist" aria-label="Pickups by day">
          {week.map((w) => (
            <button key={w.day} role="tab" aria-selected={w.day === day} className={w.day === day ? 'wday on' : 'wday'} onClick={() => setDay(w.day)}>
              <span className="wbar"><i style={{ height: `${(100 * w.count) / most}%` }} /></span>
              <span className="mono">{w.count}</span>
              <span className="sub">{w.day === asOf ? 'Today' : dayLabel(w.day)}</span>
            </button>
          ))}
        </div>
        {picked && (
          <ul className="pickups" key={picked.day}>
            {picked.rows.map((r) => (
              <li key={r.id}>
                <span className="pwho"><strong>{r.name}</strong><span className="sub">Picking up {r.drug}</span></span>
                <span className="pacts">{r.actions.map((a) => <span key={a.measure} className="pact"><b>{a.label}</b>{a.action}</span>)}</span>
              </li>
            ))}
            {picked.count > picked.rows.length && <li className="sub more">and {picked.count - picked.rows.length} more that day</li>}
          </ul>
        )}
      </section>

      <section className="pcards three">
        {PAYS.map((c) => (
          <article key={c.title} className="mcard">
            <h3>{c.title}</h3>
            <ul className="plist">{c.lines.map((l) => <li key={l}>{l}</li>)}</ul>
          </article>
        ))}
      </section>
      <p className="note">Prove it the same way as the call list: randomize a store's gap members into the counter flag or the plan's usual outreach, and compare closures on the plan's claims at year end. No outcome claim before that.</p>
    </div>
  );
}
