import React from 'react';
import { MONTH_STARTS, MONTH_NAMES, dayLabel } from './format.js';
import { pointsToNextStar } from '../engine/market.js';

// MA-PD averages from the CMS 2027 Star Ratings Technical Notes (measure score averages table).
export const NATIONAL = { D08: 89, D09: 89, D10: 89, D11: 88, D12: 13, D13: 9 };

export function Stars({ n, size = 14 }) {
  return (
    <span className="stars" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" className={i <= n ? 'star on' : 'star'} />
        </svg>
      ))}
    </span>
  );
}

// A rate on a track with the cut points as ticks. Higher-is-better tracks run 78 to 98%,
// lower-is-better tracks run from 24 down to 0% so "better" is always to the right.
// With `hist` ([score, plans] pairs from CMS's 2027 ratings) it draws where real MA-PD plans scored,
// gold where a score sat one point short of the next star. Scores off the axis are not drawn.
export function Track({ m, hist }) {
  const hi = m.higherIsBetter;
  // The axis runs edge to edge of whole-percent bins, so the end bars sit inside the track.
  const lo = hi ? 77.5 : 24.5;
  const top = hi ? 98.5 : -0.5;
  const span = Math.abs(top - lo);
  const pos = (v) => ((v - lo) / (top - lo)) * 100;
  const x = (v) => `${Math.max(0, Math.min(100, pos(v)))}%`;
  const bars = hist ? hist.filter(([s]) => pos(s) >= 0 && pos(s) <= 100) : [];
  const most = Math.max(1, ...bars.map(([, n]) => n));
  return (
    <div className={hist ? 'track withhist' : 'track'} aria-hidden="true">
      {hist && (
        <div className="hist">
          {bars.map(([s, n]) => (
            <span
              key={s}
              className={pointsToNextStar(m, s) === 1 ? 'hbar near' : 'hbar'}
              style={{ left: `calc(${pos(s) - 50 / span}% + 1px)`, width: `calc(${100 / span}% - 2px)`, height: `${Math.max(6, (100 * n) / most)}%` }}
            />
          ))}
        </div>
      )}
      <div className="rail" />
      {m.cut.map((c, i) => (
        // CMS rounds to whole percents, so a cut point's real line sits half a point out: 89% for 3 stars starts at 88.5.
        <div key={c} className="tick" style={{ left: x(hi ? c - 0.5 : c + 0.5) }}>
          <span>{i + 2}★</span>
        </div>
      ))}
      {!hist && <div className="nat" style={{ left: x(NATIONAL[m.id]) }} title="National MA-PD average" />}
      <div className="dot" style={{ left: x(m.rate) }} />
    </div>
  );
}

// Days covered this year, today's line, and the last day to fill.
export function CoverageStrip({ row, asOf }) {
  const W = 730;
  const H = 52;
  const x = (d) => (d / 365) * W;
  const fillBy = row.mustFillBy != null && row.mustFillBy < 365 && row.lane === 'save' ? row.mustFillBy : null;
  return (
    <figure className="stripwrap">
    <svg className="strip" viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`Days covered so far. ${fillBy ? `Must refill by ${dayLabel(fillBy)}.` : ''}`}>
      <rect x={x(row.ipsd ?? 0)} y="8" width={x(asOf) - x(row.ipsd ?? 0)} height={H - 16} className="gapbg" />
      {row.segments.map(([a, b]) => (
        <rect key={a} x={x(a)} y="8" width={Math.max(1, x(b + 1) - x(a))} height={H - 16} className="cov" />
      ))}
      <rect x={x(asOf)} y="8" width={W - x(asOf)} height={H - 16} className="future" />
      {MONTH_STARTS.map((d, i) => (
        <text key={d} x={x(d) + 2} y={H + 14} className={i % 3 === 0 ? 'mlabel q' : 'mlabel'}>{MONTH_NAMES[i]}</text>
      ))}
      <line x1={x(asOf)} x2={x(asOf)} y1="2" y2={H} className="today" />
      {fillBy != null && (
        <g>
          <line x1={x(fillBy)} x2={x(fillBy)} y1="2" y2={H} className="fillby" />
        </g>
      )}
    </svg>
      <figcaption className="legend">
        <span><i className="k kcov" />covered</span>
        <span><i className="k kgap" />no supply</span>
        <span><i className="k ktoday" />today</span>
        {fillBy != null && <span><i className="k kfill" />refill by <b>{dayLabel(fillBy)}</b></span>}
      </figcaption>
    </figure>
  );
}

export function Chip({ tone = 'plain', children }) {
  return <span className={`chip ${tone}`}>{children}</span>;
}
