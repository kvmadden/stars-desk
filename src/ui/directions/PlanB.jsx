// Direction B, the counter: the plan view leads with the work. The headline, then who to call first.
import React from 'react';
import { headline, MeasureRow, LANE_ROWS } from '../Plan.jsx';
import { n } from './shared.js';

const SHORT = { D08: 'Diabetes', D09: 'Blood pressure', D10: 'Cholesterol' };

export default function PlanB({ data, go }) {
  const h = headline(data.measures);
  const mk = data.market;
  const asOf = data.plan.asOf;
  const days = Math.round(data.plan.k / 25);
  const first = (data.laneMembers.save || []).slice(0, 5).map((id) => data.members[id]);
  return (
    <div className="page b-page">
      <section className="b-open plan">
        <div className="b-left">
          <p className="b-kicker"><span className="b-dot" />Part D Stars <span>·</span> October push <span>·</span> synthetic plan</p>
          {h ? <h1>{h.short} is {h.toNext} saves from {h.star + 1} stars</h1> : <h1>Every adherence measure is at 5 stars</h1>}
          {h && <p className="b-stand">This month's call list has {h.onList} {h.short.toLowerCase()} members who can still reach 80% by December 31.</p>}
          <div className="b-days" aria-label={`${data.plan.k} calls over ${days} working days`}>
            <p><b className="num">{data.plan.k}</b> calls <span>·</span> <b className="num">{days}</b> working days at 25 a day</p>
            <div className="b-dayblocks" aria-hidden="true">{Array.from({ length: days }, (_, i) => <i key={i} className={i === 0 ? 'now' : ''} />)}</div>
          </div>
          <div className="b-actions">
            <button className="b-primary" onClick={() => go('list', h ? { measure: h.id } : undefined)}>Open the call list</button>
            <a href="#/pilot">How a pilot would prove it</a>
          </div>
          {mk && <p className="b-fact"><b className="num">{mk.oneAway} of {mk.plans}</b> real Medicare Advantage drug plans sat one point short of the next star on at least one adherence measure in CMS's 2027 ratings.</p>}
        </div>
        <div className="b-shelf">
          <p className="b-shelfhead"><span>First up, least time to spare</span><span className="num">{first.length} of {data.plan.k}</span></p>
          <ol className="b-queue">
            {first.map((m) => {
              const open = m.measures.filter((r) => r.lane === 'save');
              return (
                <li key={m.id}>
                  <button onClick={() => go('list', { member: m.id })}>
                    <span className="num b-rank">{String(m.rank).padStart(2, '0')}</span>
                    <span className="b-who"><b>{m.name}</b><span>{open.map((r) => SHORT[r.measure]).join(' · ')}</span></span>
                    <span className="b-spare"><b className="num">{m.callBy == null ? '' : Math.max(0, m.callBy - asOf)}</b><span>days to spare</span></span>
                    <span className="b-fix">{open[0]?.fix?.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="b-board">
        <h2>Where each measure lands if nothing changes</h2>
        <p className="b-sub">Bars are every real plan's score in CMS's 2027 ratings, amber where a plan sat one point short. The dot is this plan, projected.</p>
        <ul className="mlist">
          {[...data.measures].sort((a, b) => (a.id === h?.id ? -1 : b.id === h?.id ? 1 : 0)).map((m) => (
            <MeasureRow key={m.id} m={m} hist={mk?.measures[m.id]?.hist} linkLabel="Members" onOpen={() => go('list', { measure: m.id })} />
          ))}
          {data.safetyMeasures.map((m) => (
            <MeasureRow key={m.id} m={m} hist={mk?.measures[m.id]?.hist} safety linkLabel="Faxes" onOpen={() => go('safety', { measure: m.id })} />
          ))}
        </ul>
      </section>

      <section className="b-plan">
        <h2>Where the {n(data.plan.members)} members stand</h2>
        <ul className="b-lanes">
          {LANE_ROWS.map((l) => (
            <li key={l.key}>
              <button disabled={l.noLink} onClick={() => go('list', { lane: l.key })}>
                <b className="num">{n(data.laneCounts[l.key])}</b>
                <span>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <p className="b-note">Adherence rates are projected to December 31 from each member's own refill pattern through September 30, a simple rule of thumb a pilot would test. Safety rates are part-year. Cut points are CMS's 2027 Star Ratings, standing in for the 2028 ratings this year's data feeds.</p>
    </div>
  );
}
