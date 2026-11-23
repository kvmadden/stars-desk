import React from 'react';
import { Stars, Track, NATIONAL } from './bits.jsx';

function headline(measures) {
  // Lead with a star the list can actually reach, otherwise the closest one.
  const open = measures.filter((m) => m.toNext > 0 && m.star < 5);
  const reachable = open.filter((m) => m.listSaves >= m.toNext).sort((a, b) => a.star - b.star || a.toNext - b.toNext);
  if (reachable.length) return reachable[0];
  open.sort((a, b) => a.toNext / a.weight - b.toNext / b.weight);
  return open[0];
}

function MeasureRow({ m, onOpen, safety }) {
  const next = m.star + 1;
  return (
    <li className="mrow">
      <div className="mname">
        <strong>{m.short}</strong>
        <span className="sub">{m.weight === 3 ? 'Counts triple' : 'Counts once'}</span>
      </div>
      <Stars n={m.star} />
      <div className="mtrack">
        <Track m={m} />
        <div className="trackcap">
          <span className="mono">{m.rate.toFixed(1)}%</span>
          <span className="sub">national average {NATIONAL[m.id]}%</span>
        </div>
      </div>
      <div className="mgap">
        {m.star >= 5 ? (
          <span className="sub">At 5 stars</span>
        ) : (
          <>
            <span className="mono big">{m.toNext}</span>
            <span className="sub">{safety && !m.higherIsBetter ? `fewer members to reach ${next} stars` : safety ? `more members to reach ${next} stars` : `saves to ${next} stars`}</span>
          </>
        )}
      </div>
      {onOpen && (
        <button className="ghost" onClick={onOpen}>{safety ? 'Faxes' : 'Members'}</button>
      )}
    </li>
  );
}

const LANE_ROWS = [
  { key: 'save', label: 'Call this month', tone: 'gold' },
  { key: 'prescriber', label: 'Ask the prescriber first', tone: 'slate' },
  { key: 'new-start', label: 'New starts, not counted yet', tone: 'teal' },
  { key: 'lost', label: 'Lost for 2026', tone: 'brick' },
];

function Today({ data, go }) {
  const max = Math.max(...LANE_ROWS.map((l) => data.laneCounts[l.key] || 0));
  return (
    <aside className="today" aria-label="Who is on the desk today">
      <h2>Who needs a pharmacist</h2>
      <p className="sub">Members, from {data.plan.members.toLocaleString()} in the plan</p>
      <ul>
        {LANE_ROWS.map((l) => (
          <li key={l.key}>
            <button className="laneline" onClick={() => go('list', { lane: l.key })}>
              <span>{l.label}</span>
              <span className={`lbar ${l.tone}`}><span style={{ width: `${(100 * (data.laneCounts[l.key] || 0)) / max}%` }} /></span>
              <span className="mono">{data.laneCounts[l.key] || 0}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="sub">The rest are on track or excluded. {Math.round(data.plan.k / 25)} working days at 25 calls a day.</p>
    </aside>
  );
}

export default function Plan({ data, go }) {
  const h = headline(data.measures);
  return (
    <div className="page plan">
      <div className="herogrid">
      <section className="hero">
        <p className="eyebrow">Part D Stars, October push</p>
        {h ? (
          <h1>
            {h.short} is <span className="hl">{h.toNext} saves</span> from {h.star + 1} stars.
          </h1>
        ) : (
          <h1>Every adherence measure is at 5 stars.</h1>
        )}
        <p className="lede">
          The top {data.plan.k} calls on today's list should bring about {h?.listSaves ?? 0} there, if {Math.round(data.plan.reach * 100)}% of members answer.
        </p>
        <button className="primary" onClick={() => go('list', h ? { measure: h.id } : undefined)}>Open the call list</button>
      </section>
      <Today data={data} go={go} />
      </div>

      <section className="board">
        <h2>Where each measure lands if nothing changes</h2>
        <ul className="mlist">
          {data.measures.map((m) => (
            <MeasureRow key={m.id} m={m} onOpen={() => go('list', { measure: m.id })} />
          ))}
        </ul>
        <h2 className="second">Safety measures, lower is better</h2>
        <ul className="mlist">
          {data.safetyMeasures.map((m) => (
            <MeasureRow key={m.id} m={m} safety onOpen={() => go(m.id === 'D11' ? 'safety' : 'safety', { measure: m.id })} />
          ))}
        </ul>
        <p className="note">
          Adherence rates are the desk's forecast for December 31 from claims through September 30. Safety rates are as of today. Ticks mark the 2027 Star Ratings cut points.
        </p>
      </section>
    </div>
  );
}
