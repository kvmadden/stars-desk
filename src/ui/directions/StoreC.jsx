// Direction C, the exhibit: a strategy deck page. An action title, numbered exhibits, a source under each.
import React, { useState } from 'react';
import { dayLabel } from '../format.js';
import { ORDER, LABEL, AT_COUNTER, PAYS } from '../Pharmacy.jsx';
import { REACH, n, weekday, dayFull } from './shared.js';

const STEPS = ['The plan sends its gap file', 'The store closes gaps at pickup', 'The plan pays on its own claims'];
const COLS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

export default function StoreC({ data }) {
  const ph = data.pharmacy;
  const asOf = data.plan.asOf;
  const [day, setDay] = useState(ph.week[0]?.day);
  const picked = ph.week.find((w) => w.day === day);
  const total = ph.planMembersWithGaps;
  return (
    <div className="page c-page">
      <section className="c-band">
        <div className="c-inner">
          <p className="c-kicker">Pharmacy <span>|</span> synthetic plan, as of October 1</p>
          <h1>A plan can reach most of its gap members at a pharmacy counter before it pays for a single call</h1>
          <ol className="c-steps" data-oneline>
            {STEPS.map((s, i) => <li key={s}><b className="num">{i + 1}</b>{s}</li>)}
          </ol>
        </div>
      </section>

      <div className="c-inner">
        <section className="c-exhibits">
          <figure className="c-ex narrow">
            <p className="c-exn">Exhibit 1</p>
            <figcaption>How {n(total)} gap members next meet a pharmacy</figcaption>
            <div className="c-stack">
              <div className="c-col" aria-hidden="true">
                {REACH.map((s) => <span key={s.key} className={s.tone} style={{ flexGrow: ph.plan[s.key] }} />)}
              </div>
              <ul>
                <li className="walk" style={{ top: 0 }}><b className="num">{n(ph.plan['walk-in'])}</b><span>{REACH[0].short}</span></li>
                <li className="call" style={{ top: `${(100 * ph.plan['walk-in']) / total}%` }}><b className="num">{n(ph.plan['store-call'])}</b><span>use a pharmacy, overdue or on 90 days</span></li>
                <li className="quiet"><b className="num">{n(ph.plan.mail + ph.plan.none)}</b><span>mail order only ({ph.plan.mail}) or no recent fill ({ph.plan.none})</span></li>
              </ul>
            </div>
            <p className="c-src">Source: synthetic plan claims through September 30. A real plan can count this from its own claims.</p>
          </figure>
          <figure className="c-ex">
            <p className="c-exn">Exhibit 2</p>
            <figcaption>{ph.store}: {ph.reach.counter} gap members due at the counter in the next 30 days</figcaption>
            <Calendar month={ph.month || []} week={ph.week} day={day} setDay={setDay} asOf={asOf} />
            <p className="c-src">Darker days have more gap members due. Pick any day this week to see who is coming in.</p>
          </figure>
        </section>

        {picked && (
          <section className="c-day">
            <h2>{dayFull(picked.day, asOf)}: {picked.count} members flagged before they arrive</h2>
            <ul>
              {picked.rows.map((r) => (
                <li key={r.id}>
                  <div className="c-who"><b>{r.name}</b><span>Picking up {r.drug}</span></div>
                  <div className="c-acts">{r.actions.map((a) => <p key={a.measure}><span>{a.label}</span>{a.action}</p>)}</div>
                </li>
              ))}
            </ul>
            {picked.count > picked.rows.length && <p className="c-more">and {picked.count - picked.rows.length} more that day</p>}
          </section>
        )}

        <section className="c-deal">
          <h2>What the store sells</h2>
          <div className="c-cols">
            {PAYS.map((c, i) => (
              <div key={c.title}>
                <p className="c-num num">{i + 1}</p>
                <h3>{c.title}</h3>
                <ul>{c.lines.map((l) => <li key={l}>{l}</li>)}</ul>
              </div>
            ))}
          </div>
          <p className="c-src">The store sees the member at pickup whatever plan they are in, and gets paid only for closures the plan's own claims confirm.</p>
        </section>

        <details className="c-detail">
          <summary>By measure: who one store can reach</summary>
          <table className="c-reach">
            <thead><tr><th>Gap</th><th className="r">Counter</th><th className="r">Phone</th><th className="r">Elsewhere</th><th>What the store does</th></tr></thead>
            <tbody>
              {ORDER.filter((m) => ph.byGap[m]).map((m) => {
                const g = ph.byGap[m];
                return <tr key={m}><th scope="row">{LABEL[m]}</th><td className="r num" data-k="counter">{g.counter}</td><td className="r num" data-k="phone">{g.phone}</td><td className="r num q" data-k="elsewhere">{g.elsewhere}</td><td>{AT_COUNTER[m]}</td></tr>;
              })}
            </tbody>
          </table>
        </details>
        <p className="c-note">Prove it the same way as the call list: randomize gap members into the counter flag or the plan's usual outreach, and compare closures on the plan's claims at year end. No outcome claim before that.</p>
      </div>
    </div>
  );
}
