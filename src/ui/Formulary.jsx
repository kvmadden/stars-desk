import React, { useState } from 'react';
import { Chip } from './bits.jsx';

const SHORT = { D08: 'Diabetes', D09: 'Blood pressure', D10: 'Cholesterol' };

export default function Formulary({ data }) {
  const [i, setI] = useState(0);
  const c = data.changes[i];
  const total = data.changes.reduce((s, x) => s + x.count, 0);
  const high = data.changes.reduce((s, x) => s + x.high, 0);
  return (
    <div className="page formulary">
      <section className="hero small">
        <h1>
          January changes touch {total} members. <span className="hl">{high} have no room</span> for a gap.
        </h1>
        <p className="lede">They are behind or within two weeks of missing 80%. Reach them and their prescribers before January 1.</p>
      </section>
      <ol className="timeline" aria-label="What happens when">
          {data.timeline.map((t, k) => (
            <li key={t.date} className={k === 1 ? 'now' : ''}>
              <span className="mono">{t.date}</span>
              <span>{t.label}</span>
            </li>
          ))}
      </ol>
      <div className="split">
        <ol className="rows">
          {data.changes.map((x, k) => (
            <li key={x.drug}>
              <button className={k === i ? 'row on' : 'row'} onClick={() => setI(k)}>
                <span className="who">
                  <strong>{x.drug}</strong>
                  <span className="sub">{x.change}</span>
                </span>
                <span className="when">
                  <span><span className="mono">{x.high}</span> at risk</span>
                  <span className="sub">{x.count} affected</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <section className="detail">
          {c && (
            <>
              <div className="dhead">
                <h2>{c.drug}: {c.change.toLowerCase()}</h2>
                <p className="sub">{SHORT[c.measure]} · suggested switch: {c.alternatives.join(' or ')}</p>
              </div>
              <article className="mcard">
                <h3>Pharmacist note for the prescriber</h3>
                <p>{c.switchNote}</p>
              </article>
              <article className="mcard">
                <h3>Reach first</h3>
                <ul className="plain">
                  {c.sample.filter((s) => s.risk === 'high').slice(0, 6).map((s) => (
                    <li key={s.id + s.measure}>
                      <strong>{s.name}</strong>
                      <span className="sub">{s.margin == null ? 'below 80% in 2026, likely to gap in January' : `can miss ${s.margin} more days`} · {s.prescriberName}</span>
                    </li>
                  ))}
                  {c.sample.filter((s) => s.risk === 'high').length === 0 && <li className="sub">No one with a thin margin in this sample.</li>}
                </ul>
              </article>
              <article className="mcard notice">
                <header>
                  <h3>Member letter</h3>
                  <Chip tone="teal">Reads at grade {Math.round(c.grade)}</Chip>
                </header>
                <pre>{c.notice}</pre>
              </article>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
