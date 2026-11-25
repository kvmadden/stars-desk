// Direction C, the exhibit: the action title in a band, then one banded exhibit of all six measures.
import React from 'react';
import { headline, LANE_ROWS } from '../Plan.jsx';
import { n, axis, savesLine } from './shared.js';

function Bands({ m }) {
  const { pos, bands } = axis(m);
  const at = pos(m.rate);
  return (
    <div className="c-bands" aria-label={`${m.rate.toFixed(1)}%, ${m.star} stars`}>
      {bands.map((b) => (
        <span key={b.star} className={`c-sband s${b.star}${b.star === m.star ? ' here' : ''}`} style={{ left: `${b.from * 100}%`, width: `${(b.to - b.from) * 100}%` }}>
          <i>{b.star}★</i>
        </span>
      ))}
      <span className="c-me" style={{ left: `${at * 100}%` }}><b className="num">{m.rate.toFixed(1)}%</b></span>
    </div>
  );
}

export default function PlanC({ data, go }) {
  const h = headline(data.measures);
  const mk = data.market;
  const all = [...data.measures, ...data.safetyMeasures];
  const lanes = LANE_ROWS.filter((l) => l.key !== 'onTrack');
  const laneTotal = lanes.reduce((t, l) => t + (data.laneCounts[l.key] || 0), 0);
  return (
    <div className="page c-page">
      <section className="c-band">
        <div className="c-inner c-bandgrid">
          <div>
            <p className="c-kicker">Part D Stars <span>|</span> October push <span>|</span> synthetic plan</p>
            {h ? <h1>{h.short} is {h.toNext} saves from {h.star + 1} stars, and this month's call list holds {h.onList} members who can still reach 80%</h1> : <h1>Every adherence measure is at 5 stars</h1>}
          </div>
          <div className="c-bandside">
            {mk && <p><b className="num">{mk.oneAway} of {mk.plans}</b> real Medicare Advantage drug plans sat one point short of the next star on at least one adherence measure in CMS's 2027 ratings.</p>}
            <button className="c-primary" onClick={() => go('list', h ? { measure: h.id } : undefined)}>Open the call list</button>
          </div>
        </div>
      </section>

      <div className="c-inner">
        <figure className="c-ex wide">
          <p className="c-exn">Exhibit 1</p>
          <figcaption>Where each measure lands on December 31 if nothing changes</figcaption>
          <div className="c-rows">
            {all.map((m) => {
              const safety = data.safetyMeasures.includes(m);
              return (
                <div key={m.id} className={m.id === h?.id ? 'c-row lead' : 'c-row'}>
                  <div className="c-name"><b>{m.short}</b><span>{m.weight === 3 ? 'Counts triple' : 'Counts once'}{!m.higherIsBetter ? ', lower is better' : ''}</span></div>
                  <Bands m={m} />
                  <div className="c-gap">
                    <span>{savesLine(m, safety)}</span>
                    <button className="c-link" onClick={() => (safety ? go('safety', { measure: m.id }) : go('list', { measure: m.id }))}>{safety ? 'Faxes' : 'Members'}</button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="c-src">Bands are CMS's 2027 Star Ratings cut points, standing in for the 2028 ratings this year's data feeds. Adherence rates are synthetic, projected to December 31 from each member's refill pattern through September 30. Safety rates are part-year.</p>
        </figure>

        <figure className="c-ex wide">
          <p className="c-exn">Exhibit 2</p>
          <figcaption>{n(laneTotal)} of the {n(data.plan.members)} members need a pharmacist. {n(data.laneCounts.onTrack)} are on track.</figcaption>
          <div className="c-lanebar" aria-hidden="true">
            {lanes.map((l) => <span key={l.key} className={`t-${l.key}`} style={{ flexGrow: data.laneCounts[l.key] || 0 }} />)}
          </div>
          <ul className="c-lanes">
            {lanes.map((l) => (
              <li key={l.key}>
                <button disabled={l.noLink} onClick={() => go('list', { lane: l.key })}>
                  <i className={`t-${l.key}`} />
                  <b className="num">{n(data.laneCounts[l.key])}</b>
                  <span>{l.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="c-src">The call list is {Math.round(data.plan.k / 25)} working days at 25 calls a day. <a href="#/pilot">How a pilot would prove it</a></p>
        </figure>
      </div>
    </div>
  );
}
