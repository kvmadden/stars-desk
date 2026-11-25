// The store view: one store's next 30 days of gap members at the counter, and how the whole synthetic plan
// next meets a pharmacy. Synthetic data only.
import React, { useState } from 'react';
import { dayLabel } from './format.js';
import { REACH, n, dayFull, weekday } from './shared.js';

export const ORDER = ['D08', 'D09', 'D10', 'D11', 'D12', 'D13'];
export const LABEL = { D08: 'Diabetes adherence', D09: 'Blood pressure adherence', D10: 'Statin adherence', D11: 'Statin use in diabetes', D12: 'Opioid with benzodiazepine', D13: 'Two anticholinergics' };
export const AT_COUNTER = {
  D08: 'The call list fix, offered at pickup: 90 days, synced refills or a cost check',
  D09: 'The call list fix, offered at pickup',
  D10: 'The call list fix, offered at pickup',
  D11: 'Ask about a statin, then a prescriber request',
  D12: 'Safety fax to the prescriber. Naloxone offer at pickup',
  D13: 'Safety fax to the prescriber with a non-anticholinergic option',
};
export const PAYS = [
  { title: 'The plan sends', lines: ['A weekly file of its members with an open gap', 'Measure, days to spare and last fill, by the CMS rules', 'Any member it wants handled by its own team instead'] },
  { title: 'The store does', lines: ['Flags the member in the pickup workflow before they arrive', 'The counter action for each gap, in one conversation', 'Prescriber requests for anything that needs a new prescription', 'Logs what it offered and what the member said'] },
  { title: 'The plan pays for', lines: ['Closures its own claims confirm, using the CMS rules', 'Adherence: the member ends the year at 80% or higher', 'Statin in diabetes: a statin fill in the measurement year', 'Not for calls, attempts or flags on their own'] },
];

const COLS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
          <text x={W + 32} y={H + 30}><tspan className="num">{n(plan.mail)}</tspan> mail order only, <tspan className="num">{n(plan.none)}</tspan> no recent fill</text>
        </g>
      )}
    </svg>
  );
}

// The counter window as a month calendar. Darker days have more gap members due. This week's days can be picked.
export function Calendar({ month, week, day, setDay, asOf }) {
  const most = Math.max(1, ...month.map((d) => d.count));
  const lead = (weekday(month[0].day) + 6) % 7; // Monday first
  const cells = [...Array(lead).fill(null), ...month];
  while (cells.length % 7) cells.push(null);
  const pickable = new Set(week.map((w) => w.day));
  return (
    <div className="c-cal">
      <div className="c-calhead">{COLS.map((c) => <span key={c}>{c}</span>)}</div>
      <div className="c-calgrid">
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="c-cell empty" />;
          const shade = d.count ? 0.12 + (0.88 * d.count) / most : 0;
          const dark = shade > 0.55;
          const inner = (
            <>
              <span className="c-date">{d.day === asOf ? 'Today' : dayLabel(d.day)}</span>
              <span className="c-n num">{d.count || ''}</span>
            </>
          );
          const style = { '--shade': shade };
          return pickable.has(d.day) ? (
            <button key={i} className={`c-cell pick${dark ? ' dark' : ''}${d.day === day ? ' on' : ''}`} style={style} onClick={() => setDay(d.day)} aria-pressed={d.day === day} aria-label={`${dayLabel(d.day)}: ${d.count} gap members due`}>{inner}</button>
          ) : (
            <span key={i} className={`c-cell${dark ? ' dark' : ''}`} style={style}>{inner}</span>
          );
        })}
      </div>
    </div>
  );
}

export default function Pharmacy({ data }) {
  const ph = data.pharmacy;
  const asOf = data.plan.asOf;
  const [day, setDay] = useState(ph.week[0]?.day);
  const picked = ph.week.find((w) => w.day === day);
  return (
    <div className="page store">
      <section className="a-open f-open">
        <div className="a-copy">
          <p className="a-kicker">{ph.store} <span>·</span> synthetic plan, October 1</p>
          <h1>{ph.reach.counter} gap members have a refill due at this store in the next 30 days</h1>
          <p className="a-stand">Each one can be flagged before they arrive, so the gap gets raised at pickup.</p>
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
          <p>Each square is one member. Synthetic claims through September 30. A real plan can count this from its own claims.</p>
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
        <summary><span className="chev" aria-hidden="true" />Who one store can reach, by measure<span className="show">Show</span><span className="hide">Hide</span></summary>
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
