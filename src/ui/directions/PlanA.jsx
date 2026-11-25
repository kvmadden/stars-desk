// Direction A, the cut line: the headline measure drawn against every real plan, annotated like a news graphic.
import React from 'react';
import { Stars, Track } from '../bits.jsx';
import { headline, LANE_ROWS } from '../Plan.jsx';
import { pointsToNextStar } from '../../engine/market.js';
import { n, savesLine } from './shared.js';

function CutChart({ m, hist }) {
  const W = 640;
  const H = 300;
  const top = 48;
  const base = 240;
  const lo = 77.5;
  const hi = 98.5;
  const x = (v) => ((v - lo) / (hi - lo)) * W;
  const bars = hist.filter(([s]) => s > lo && s < hi);
  const most = Math.max(...bars.map(([, c]) => c));
  const bw = W / (hi - lo);
  const px = x(m.rate);
  return (
    <svg className="a-cut" viewBox={`-8 0 ${W + 16} ${H}`} role="img" aria-label={`${hist.reduce((t, [, c]) => t + c, 0)} real plans by score, with cut points and this plan's projected ${m.rate.toFixed(1)}%`}>
      {m.cut.map((c, i) => (
        <g key={c} className="cutline">
          <line x1={x(c - 0.5)} x2={x(c - 0.5)} y1={top - 8} y2={base} />
          <text x={x(c - 0.5) + 5} y={top - 12} className="lablong">{i + 2} stars</text>
          <text x={x(c - 0.5) + 5} y={top - 12} className="labshort">{i + 2}★</text>
        </g>
      ))}
      {bars.map(([s, c]) => (
        <rect key={s} x={x(s - 0.5) + 1.5} width={bw - 3} y={base - ((base - top - 24) * c) / most} height={((base - top - 24) * c) / most} className={pointsToNextStar(m, s) === 1 ? 'b near' : 'b'} />
      ))}
      <line x1="0" x2={W} y1={base} y2={base} className="axis" />
      {[78, ...m.cut, 98].map((t, i) => <text key={t} x={i === 0 || i === m.cut.length + 1 ? x(t) : x(t - 0.5)} y={base + 18} className="tickl">{t}%</text>)}
      <g className="me">
        <line x1={px} x2={px} y1={base} y2={top + 20} />
        <circle cx={px} cy={base} r="6" />
        <text x={px - 10} y={base + 44} textAnchor="end">This plan, projected <tspan className="num">{m.rate.toFixed(1)}%</tspan></text>
      </g>
    </svg>
  );
}

export default function PlanA({ data, go }) {
  const h = headline(data.measures);
  const mk = data.market;
  const hm = h && mk?.measures[h.id];
  const max = Math.max(...LANE_ROWS.filter((l) => !l.noLink).map((l) => data.laneCounts[l.key] || 0));
  return (
    <div className="page a-page">
      <section className="a-open plan">
        <div className="a-copy">
          <p className="a-kicker">Part D Stars <span>·</span> October push <span>·</span> synthetic plan</p>
          {h ? <h1>{h.short} is {h.toNext} saves from {h.star + 1} stars</h1> : <h1>Every adherence measure is at 5 stars</h1>}
          {h && <p className="a-stand">This month's call list has {h.onList} {h.short.toLowerCase()} members who can still reach 80% by December 31.</p>}
          <div className="a-actions">
            <button className="a-primary" onClick={() => go('list', h ? { measure: h.id } : undefined)}>Open the call list</button>
            <a href="#/pilot">How a pilot would prove it</a>
          </div>
        </div>
        {h && hm && (
          <figure className="a-fig">
            <figcaption>
              <strong>{h.label}: where {n(hm.plans)} real drug plans scored</strong>
              <span>Gold bars sat one point short of the next star</span>
            </figcaption>
            <CutChart m={h} hist={hm.hist} />
            <p className="a-fact"><b>{mk.oneAway} of {mk.plans}</b> real Medicare Advantage drug plans sat one point short of the next star on at least one adherence measure in CMS's 2027 ratings.</p>
            <p className="a-src">Source: CMS 2027 Star Ratings data tables, MA-PD contracts. This plan's rate is synthetic, projected to December 31.</p>
          </figure>
        )}
      </section>

      <section className="a-multi">
        <div className="a-sechead">
          <h2>All six measures, if nothing changes</h2>
          <p>Each strip is every real plan's score. Ticks are the 2027 cut points, the dot is this plan.</p>
        </div>
        <div className="a-grid">
          {[...data.measures, ...data.safetyMeasures].map((m) => {
            const safety = data.safetyMeasures.includes(m);
            return (
              <article key={m.id} className="a-tile">
                <header>
                  <h3>{m.short}</h3>
                  <Stars n={m.star} size={13} />
                </header>
                <p className="a-tmeta">{m.weight === 3 ? 'Counts triple' : 'Counts once'} <span>·</span> <span className="num">{m.rate.toFixed(1)}%</span>{!m.higherIsBetter ? ', lower is better' : ''}</p>
                <Track m={m} hist={mk?.measures[m.id]?.hist} />
                <footer>
                  <span>{savesLine(m, safety)}</span>
                  <button className="a-link" onClick={() => (safety ? go('safety', { measure: m.id }) : go('list', { measure: m.id }))}>{safety ? 'Faxes' : 'Members'}</button>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className="a-lanes">
        <div className="a-sechead">
          <h2>Where the {n(data.plan.members)} members stand</h2>
          <p>The call list is {Math.round(data.plan.k / 25)} working days at 25 calls a day.</p>
        </div>
        <ul>
          {LANE_ROWS.map((l) => (
            <li key={l.key}>
              <button disabled={l.noLink} onClick={() => go('list', { lane: l.key })}>
                <span className="lname">{l.label}</span>
                <span className={`lbar ${l.tone}`}><span style={{ width: `${Math.min(100, (100 * (data.laneCounts[l.key] || 0)) / max)}%` }} /></span>
                <span className="num">{n(data.laneCounts[l.key])}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <p className="a-note">Adherence rates are projected to December 31 from each member's own refill pattern through September 30, a simple rule of thumb a pilot would test. Safety rates are part-year. Cut points are CMS's 2027 Star Ratings, standing in for the 2028 ratings this year's data feeds.</p>
    </div>
  );
}
