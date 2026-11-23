import React from 'react';
import { MONTH_STARTS, MONTH_NAMES, dayLabel } from './format.js';

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

// A rate on a track with the cut points as ticks. Higher-is-better tracks run 78 to 98,
// lower-is-better tracks run from 24 down to 0 so "better" is always to the right.
export function Track({ m }) {
  const hi = m.higherIsBetter;
  const lo = hi ? 78 : 24;
  const top = hi ? 98 : 0;
  const x = (v) => `${Math.max(0, Math.min(100, ((v - lo) / (top - lo)) * 100))}%`;
  return (
    <div className="track" aria-hidden="true">
      <div className="rail" />
      {m.cut.map((c, i) => (
        <div key={c} className="tick" style={{ left: x(c) }}>
          <span>{i + 2}★</span>
        </div>
      ))}
      <div className="nat" style={{ left: x(NATIONAL[m.id]) }} title="National MA-PD average" />
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
