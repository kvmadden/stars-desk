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

function MeasureRow({ m, onOpen, safety, linkLabel }) {
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
        <button className="link rowlink" onClick={onOpen}>{linkLabel}</button>
      )}
    </li>
  );
}

const LANE_ROWS = [
  { key: 'save', label: 'Call this month', tone: 'gold' },
  { key: 'prescriber', label: 'Ask the prescriber first', tone: 'slate' },
  { key: 'new-start', label: 'New starts, not counted yet', tone: 'teal' },
  { key: 'onTrack', label: 'On track, no call needed', tone: 'calm', noLink: true },
  { key: 'lost', label: 'Below 80% for good this year', tone: 'muted' },
];

function Today({ data, go }) {
  // Scale to the lanes that need a pharmacist. "On track" is a full, quiet bar.
  const max = Math.max(...LANE_ROWS.filter((l) => !l.noLink).map((l) => data.laneCounts[l.key] || 0));
  return (
    <aside className="today" aria-label="Who is on the desk today">
      <h2>Where the {data.plan.members.toLocaleString()} members stand</h2>
      <p className="sub">Members on at least one adherence drug sit in the lane that needs them most</p>
      <ul>
        {LANE_ROWS.map((l) => (
          <li key={l.key}>
            <button className="laneline" disabled={l.noLink} onClick={() => go('list', { lane: l.key })}>
              <span>{l.label}</span>
              <span className={`lbar ${l.tone}`}><span style={{ width: `${Math.min(100, (100 * (data.laneCounts[l.key] || 0)) / max)}%` }} /></span>
              <span className="mono">{(data.laneCounts[l.key] || 0).toLocaleString()}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="sub">The call list is {Math.round(data.plan.k / 25)} working days at 25 calls a day.</p>
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
          {h && h.listSaves >= 2 * h.toNext
            ? `Today's ${data.plan.k} calls should save about ${h.listSaves} members there, more than twice the ${h.toNext} needed.`
            : h && h.listSaves >= h.toNext
              ? `Today's ${data.plan.k} calls should save about ${h.listSaves} members there, more than the ${h.toNext} needed.`
              : `Today's ${data.plan.k} calls should save about ${h?.listSaves ?? 0} members there.`}
        </p>
        <div className="actions">
          <button className="primary" onClick={() => go('list', h ? { measure: h.id } : undefined)}>Open the call list</button>
          <a className="quiet" href="#/proof">How the list was tested</a>
        </div>
        <p className="sub assume">Planning estimate, assuming {Math.round(data.plan.reach * 100)}% of members answer.</p>
      </section>
      <Today data={data} go={go} />
      </div>

      <section className="board">
        <h2>Where each measure lands if nothing changes</h2>
        <ul className="mlist">
          {[...data.measures].sort((a, b) => (a.id === h?.id ? -1 : b.id === h?.id ? 1 : 0)).map((m) => (
            <MeasureRow key={m.id} m={m} linkLabel="Members" onOpen={() => go('list', { measure: m.id })} />
          ))}
        </ul>
        <h2 className="second">Safety measures</h2>
        <ul className="mlist">
          {data.safetyMeasures.map((m) => (
            <MeasureRow key={m.id} m={m} safety linkLabel="Faxes" onOpen={() => go('safety', { measure: m.id })} />
          ))}
        </ul>
        <p className="note">
          Adherence rates are the desk's forecast for December 31 from claims through September 30. Safety rates are part-year, as of today, and for opioids with benzos and two anticholinergics lower is better. Ticks mark the 2027 Star Ratings cut points, the latest published, standing in for the 2028 ratings this year's data feeds.
        </p>
      </section>
    </div>
  );
}
