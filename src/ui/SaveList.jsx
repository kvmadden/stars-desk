import React, { useEffect, useMemo, useState } from 'react';
import { CoverageStrip, Chip } from './bits.jsx';
import { dayLabel, pct, BARRIER_LABEL, LANES, firstName } from './format.js';

const SCRIPT = {
  ninety: 'Offer a 90-day supply with auto-refill. If the prescription is written for 30 days, ask the prescriber for 90.',
  steady: 'Set up auto-refill at the pharmacy they use most.',
  sync: 'Move refills to one pharmacy and line the dates up so everything is ready on one trip.',
  costfix: 'Ask about cost first. Offer to ask the prescriber about a lower-tier option suited to the indication, and check for Extra Help.',
  restart: 'Ask how the medicine went. If side effects stopped it, offer to contact the prescriber about another option.',
  confirm: 'Check with the prescriber before calling the member. If the change was intended, no refill push.',
  reminder: 'A refill reminder, and one open question about what makes refills hard.',
};
const LANE_NOTE = {
  lost: 'This member cannot reach 80% in 2026. Call for their health and for 2027, not for this rating.',
  'new-start': 'One fill so far, so not in the measure yet. A second fill brings them in. Clinical need decides, not the rating.',
  prescriber: 'The claims show a different drug after the last fill. Confirm the change with the prescriber before any refill push.',
  safe: 'On track. No call needed.',
  excluded: 'Excluded from this measure.',
  'not-counted': 'Not counted this year.',
};
const SHORT = { D08: 'Diabetes', D09: 'Blood pressure', D10: 'Cholesterol' };

function MeasureCard({ row, asOf }) {
  const tone = row.lane === 'save' ? 'gold' : row.lane === 'lost' ? 'brick' : row.lane === 'prescriber' ? 'slate' : 'teal';
  return (
    <article className="mcard">
      <header>
        <h3>{SHORT[row.measure]}</h3>
        <span className="sub">
          {row.drug} {row.strength} · {row.ds}-day
          {row.copay30 ? ` · $${row.copay30} a month` : ''}
        </span>
        <span className={`tag ${tone}`}>{row.lane === 'save' ? 'On the call' : LANES.find((l) => l.key === row.lane)?.label || row.lane}</span>
      </header>
      {row.segments.length > 0 && <CoverageStrip row={row} asOf={asOf} />}
      {row.pdc != null && (
        <p className="math">
          From the first fill on {dayLabel(row.ipsd)}, needs <b>{row.needCovered}</b> covered days of {row.periodDays}. Has <b>{row.covered}</b> so far ({pct(row.pdc)}).{' '}
          {row.budget >= 0 ? <>Can miss <b>{row.budget}</b> more.</> : <>Already <b>{-row.budget}</b> days short.</>}
        </p>
      )}
      {row.lane === 'save' && row.fix ? (
        <div className="fix">
          <div className="fixhead">
            <span className="sub">{BARRIER_LABEL[row.barrier]}</span>
            <strong>{row.fix.label}</strong>
          </div>
          <ul className="why">{row.why.map((w) => <li key={w}>{w}</li>)}</ul>
          <p>{SCRIPT[row.fix.key]}</p>
          {row.fix.key === 'costfix' && row.copay30 >= 100 && !row.capReached && (
            <p className="callout">At ${row.copay30} a month, the Medicare Prescription Payment Plan can spread the cost over the year. It does not lower the total.</p>
          )}
          {row.capReached && row.fix.key === 'costfix' && (
            <p className="callout">This member already reached the $2,100 yearly cap, so the rest of 2026 costs $0. Tell them.</p>
          )}
        </div>
      ) : (
        <p className="lanenote">{row.reason || LANE_NOTE[row.lane]}</p>
      )}
      <footer className="sub">
        {row.prescriber ? `${row.prescriber.name}, ${row.prescriber.practice}` : ''}
        {row.pharmacies.length ? ` · ${row.pharmacies.join(', ')}` : ''}
      </footer>
    </article>
  );
}

// Days until the member's earliest last-day-to-refill: the real urgency, and the list's sort order.
const spareDays = (m, asOf) => (m.callBy == null ? '' : Math.max(0, m.callBy - asOf));

const OUTCOMES = ['Reached, fix agreed', 'Reached, declined', 'Left a message', 'Wrong number'];
// What the pharmacist actually found. A pilot compares this with the desk's guess.
const FOUND = ['Refill routine', 'Cost', 'Pharmacy logistics', 'Side effects', 'Therapy changed', 'Something else'];

function LogCall({ id, logged, setLogged }) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState(null);
  if (logged[id]) return <p className="logged"><span className="tag teal">Logged</span> {logged[id]}</p>;
  const save = (text) => { setLogged({ ...logged, [id]: text }); setOpen(false); setOutcome(null); };
  return (
    <div className="logwrap">
      <button className="primary" onClick={() => setOpen(!open)} aria-expanded={open}>Log call outcome</button>
      {open && !outcome && (
        <div className="choices" role="group" aria-label="Call outcome">
          {OUTCOMES.map((o) => (
            <button key={o} className="pill" onClick={() => (o.startsWith('Reached') ? setOutcome(o) : save(o))}>{o}</button>
          ))}
        </div>
      )}
      {open && outcome && (
        <div className="choices" role="group" aria-label="Barrier found on the call">
          <span className="sub">What did you find?</span>
          {FOUND.map((f) => (
            <button key={f} className="pill" onClick={() => save(`${outcome} · ${f}`)}>{f}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SaveList({ data, params, go }) {
  const [logged, setLogged] = useState({});
  const [lane, setLane] = useState(params.get('lane') || 'save');
  useEffect(() => setLane(params.get('lane') || 'save'), [params.get('lane')]);
  const measure = params.get('measure');
  const ids = data.laneMembers[lane] || [];
  const rows = useMemo(() => {
    let list = ids.map((id) => data.members[id]);
    if (measure && lane === 'save') list = list.filter((m) => m.measures.some((r) => r.measure === measure && r.lane === 'save'));
    return list;
  }, [ids, measure, lane, data]);
  const [sel, setSel] = useState(null);
  useEffect(() => setSel(rows[0]?.id || null), [lane, measure]);
  const current = sel ? data.members[sel] : null;
  const [sheet, setSheet] = useState(false);

  return (
    <div className="page list">
      <div className="listhead">
        <div>
          <h1 className="h2">{lane === 'save' ? `${rows.length} calls, least time to spare first` : LANES.find((l) => l.key === lane)?.label}</h1>
          <p className="sub">{LANES.find((l) => l.key === lane)?.hint}</p>
        </div>
        <div className="seg" role="tablist">
          {LANES.map((l) => (
            <button key={l.key} role="tab" aria-selected={lane === l.key} className={lane === l.key ? 'segbtn on' : 'segbtn'} onClick={() => setLane(l.key)}>
              {l.label} <span className="mono">{data.laneCounts[l.key] || 0}</span>
            </button>
          ))}
        </div>
        {measure && lane === 'save' && (
          <p className="filter">
            Showing members with {SHORT[measure]?.toLowerCase()} on the line.{' '}
            <button className="link" onClick={() => go('list')}>Show all</button>
          </p>
        )}
      </div>
      <div className="split">
        <ol className="rows">
          {rows.map((m) => {
            const open = m.measures.filter((r) => r.lane === lane || (lane === 'save' && r.lane === 'save'));
            const lead = open[0] || m.measures[0];
            return (
              <li key={m.id}>
                <button className={sel === m.id ? 'row on' : 'row'} onClick={() => { setSel(m.id); setSheet(true); }}>
                  <span className="rank mono">{m.rank || ''}</span>
                  <span className="who">
                    <strong>{m.name}</strong>
                    <span className="sub">{open.map((r) => SHORT[r.measure]).join(' · ')}</span>
                  </span>
                  <span className="when">
                    {lane === 'save' ? (
                      <>
                        <span className="mono">{spareDays(m, data.plan.asOf)}</span>
                        <span className="sub">days to spare</span>
                      </>
                    ) : (
                      <span className="sub">{lead?.pdc != null ? pct(lead.pdc) : ''}</span>
                    )}
                  </span>
                  {lane === 'save' && <span className="fixlabel">{lead.fix?.label}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <section className={sheet ? 'detail open' : 'detail'} aria-live="polite">
          {current && (
            <>
              <div className="dhead">
                <button className="ghost back" onClick={() => setSheet(false)}>Back to list</button>
                <h2>{current.name}</h2>
                <p className="sub">
                  {current.age} · {current.id}
                  {current.callBy != null && lane === 'save' ? ` · call by ${dayLabel(current.callBy)}` : ''}
                </p>
                {lane === 'save' && (
                  <>
                    <p className="opener">One call to {firstName(current.name)} covers every medicine below.</p>
                    <LogCall id={current.id} logged={logged} setLogged={setLogged} />
                  </>
                )}
              </div>
              {current.measures
                .filter((r) => r.lane !== 'excluded' || r.reason)
                .sort((a, b) => (a.lane === lane ? -1 : 0) - (b.lane === lane ? -1 : 0))
                .map((r) => <MeasureCard key={r.measure} row={r} asOf={data.plan.asOf} />)}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
