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

const SEGS = [
  { key: 'walk-in', label: 'Refill due at a pharmacy counter in the next 30 days', tone: 'gold' },
  { key: 'store-call', label: 'Use a pharmacy, but overdue or on 90 days', tone: 'slate' },
  { key: 'mail', label: 'Mail order only', tone: 'quiet' },
  { key: 'none', label: 'No recent fill', tone: 'quiet' },
];

function WalkIn({ plan, total }) {
  return (
    <figure className="walkin">
      <div className="wstack" aria-hidden="true">
        {SEGS.map((s, i) => <span key={s.key} className={s.tone} style={{ flexGrow: plan[s.key], animationDelay: `${150 + i * 120}ms` }} />)}
      </div>
      <ul className="wlegend">
        {SEGS.map((s) => (
          <li key={s.key} className={s.tone}>
            <span className="mono">{plan[s.key].toLocaleString()}</span>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>
      <figcaption className="sub">All {total.toLocaleString()} members of the synthetic plan with an open adherence or safety gap on October 1. A real plan can count this from its own claims in an afternoon.</figcaption>
    </figure>
  );
}

export default function Pharmacy({ data }) {
  const ph = data.pharmacy;
  const asOf = data.plan.asOf;
  const week = ph.week;
  const [day, setDay] = useState(week[0]?.day);
  const most = Math.max(1, ...week.map((w) => w.count));
  const picked = week.find((w) => w.day === day);
  const pct = Math.round((100 * ph.plan['walk-in']) / ph.planMembersWithGaps);
  return (
    <div className="page pharmacy">
      <section className="phlead">
        <p className="eyebrow">For a pharmacy selling to any plan</p>
        <h1>Before a plan pays to phone its gap list, it should count who is <span className="hl">about to walk into a pharmacy</span> anyway.</h1>
        <p className="walkhead"><span className="mono">{pct}%</span> in this synthetic plan. The pickup is the outreach.</p>
        <WalkIn plan={ph.plan} total={ph.planMembersWithGaps} />
        <p className="lede">One national pharmacy chain plans to split its stores off from its insurer and benefit manager (<a href="https://www.pharmacytimes.com/view/cvs-health-to-split-into-2-public-companies-separating-retail-and-specialty-pharmacy" target="_blank" rel="noreferrer">Pharmacy Times, Nov 4, 2026</a>), so they would sell to every plan, not one parent. What a store sells: flag the member before they arrive, close the gap in the pickup conversation, and get paid only for gaps the plan's own claims show closed.</p>
      </section>

      <section className="weekview">
        <h2>What that looks like at one store: {ph.store}, the next 7 days</h2>
        <p className="sub">{ph.reach.counter} of the plan's gap members have a refill due here in the next 30 days. Each is flagged before they arrive.</p>
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

      <details className="board bymeasure">
        <summary><h2>By measure: who one store can reach</h2></summary>
        <p className="boardsub">Counter means a refill at {ph.store} falls due in the next 30 days. Phone means they fill there but are overdue or not due this month.</p>
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
      </details>
      <p className="note">Prove it the same way as the call list: randomize gap members into the counter flag or the plan's usual outreach, and compare closures on the plan's claims at year end. No outcome claim before that.</p>
    </div>
  );
}
